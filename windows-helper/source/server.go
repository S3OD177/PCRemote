package main

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net"
	"net/http"
	"os"
	"strconv"
	"strings"
	"sync"
	"time"
)

// How far a command's timestamp may be from our clock, in seconds. Covers
// normal phone/PC clock drift while keeping the replay window small.
const clockSkew = 120

type server struct {
	st       *state
	port     int
	http     *http.Server
	hostname string

	nonces *nonceCache
}

func newServer(st *state) *server {
	host, _ := os.Hostname()
	if host == "" {
		host = "PC"
	}
	return &server{
		st:       st,
		port:     st.Port,
		hostname: host,
		nonces:   newNonceCache(),
	}
}

func (s *server) start() error {
	ln, err := net.Listen("tcp", fmt.Sprintf("0.0.0.0:%d", s.port))
	if err != nil {
		return err
	}
	mux := http.NewServeMux()
	mux.HandleFunc("/api/v1/ping", s.handlePing)       // unsigned: connectivity + pairing state
	mux.HandleFunc("/api/v1/command", s.handleCommand) // signed: the actual actions
	mux.HandleFunc("/pair", s.handlePairInfo)          // local only: pairing payload as JSON
	mux.HandleFunc("/pair.png", s.handlePairQR)        // local only: the QR image
	mux.HandleFunc("/", s.handlePairPage)              // local only: the pairing web page

	s.http = &http.Server{
		Handler:      s.withGuards(mux),
		ReadTimeout:  5 * time.Second,
		WriteTimeout: 5 * time.Second,
		IdleTimeout:  30 * time.Second,
	}
	go func() {
		if err := s.http.Serve(ln); err != nil && err != http.ErrServerClosed {
			log.Printf("serve: %v", err)
		}
	}()
	return nil
}

// withGuards blocks requests that don't belong to us before they reach a handler.
func (s *server) withGuards(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("X-Content-Type-Options", "nosniff")
		w.Header().Set("Cache-Control", "no-store")
		if !s.hostOK(r.Host) {
			writeJSON(w, http.StatusForbidden, map[string]any{"ok": false, "error": "bad_host"})
			return
		}
		next.ServeHTTP(w, r)
	})
}

// hostOK allows only an IP address or this PC's own name in the Host header,
// which stops a malicious website from using the browser to reach us
// (DNS rebinding).
func (s *server) hostOK(host string) bool {
	if host == "" {
		return true
	}
	h := host
	if strings.HasPrefix(h, "[") { // [IPv6]:port
		if i := strings.Index(h, "]"); i >= 0 {
			h = h[1:i]
		}
	} else if i := strings.LastIndex(h, ":"); i >= 0 {
		h = h[:i]
	}
	if net.ParseIP(h) != nil {
		return true
	}
	h = strings.ToLower(h)
	name := strings.ToLower(s.hostname)
	return h == "localhost" || h == name || h == name+".local"
}

func (s *server) handlePing(w http.ResponseWriter, r *http.Request) {
	s.st.mu.RLock()
	paired := s.st.Paired
	s.st.mu.RUnlock()
	writeJSON(w, http.StatusOK, map[string]any{
		"ok":      true,
		"app":     appID,
		"api":     apiVersion,
		"version": buildVersion,
		"name":    s.hostname,
		"os":      "windows",
		"paired":  paired,
	})
}

// handlePairInfo is reachable only from this machine (the tray opens it to draw
// the QR). It returns the current pairing payload.
func (s *server) handlePairInfo(w http.ResponseWriter, r *http.Request) {
	if !isLoopback(r.RemoteAddr) {
		writeJSON(w, http.StatusForbidden, map[string]any{"ok": false, "error": "local_only"})
		return
	}
	writeJSON(w, http.StatusOK, s.pairingPayload())
}

type commandReq struct {
	Action string `json:"action"`
	TS     int64  `json:"ts"`    // unix milliseconds on the phone
	Nonce  string `json:"nonce"` // random, one-time
}

func (s *server) handleCommand(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		writeJSON(w, http.StatusMethodNotAllowed, map[string]any{"ok": false, "error": "method"})
		return
	}
	body, err := io.ReadAll(io.LimitReader(r.Body, 4096))
	if err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]any{"ok": false, "error": "read"})
		return
	}
	var req commandReq
	if err := json.Unmarshal(body, &req); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]any{"ok": false, "error": "json"})
		return
	}

	// 1) Fresh timestamp?
	nowMS := time.Now().UnixMilli()
	if abs64(nowMS-req.TS) > clockSkew*1000 {
		log.Printf("reject %q from %s: stale timestamp", req.Action, clientIP(r))
		writeJSON(w, http.StatusUnauthorized, map[string]any{"ok": false, "error": "stale"})
		return
	}
	// 2) Signature valid?
	sig := r.Header.Get("X-Signature")
	if !s.verify(req, sig) {
		log.Printf("reject %q from %s: bad signature", req.Action, clientIP(r))
		writeJSON(w, http.StatusUnauthorized, map[string]any{"ok": false, "error": "signature"})
		return
	}
	// 3) Not a replay?
	if req.Nonce == "" || !s.nonces.add(req.Nonce, time.Now()) {
		log.Printf("reject %q from %s: replay", req.Action, clientIP(r))
		writeJSON(w, http.StatusUnauthorized, map[string]any{"ok": false, "error": "replay"})
		return
	}

	act, ok := actions[req.Action]
	if !ok {
		writeJSON(w, http.StatusNotFound, map[string]any{"ok": false, "error": "unknown_action"})
		return
	}

	s.st.touch(time.Now().Unix())
	log.Printf("%s requested from %s", act.label, clientIP(r))
	writeJSON(w, http.StatusOK, map[string]any{"ok": true, "action": req.Action})

	// Run just after replying, so the phone gets the "done" before the PC goes down.
	go func() {
		time.Sleep(900 * time.Millisecond)
		if err := act.run(); err != nil {
			log.Printf("%s failed: %v", act.label, err)
		}
	}()
}

// verify recomputes the HMAC over "ts.nonce.action" and compares it in constant time.
func (s *server) verify(req commandReq, gotHex string) bool {
	msg := strconv.FormatInt(req.TS, 10) + "." + req.Nonce + "." + req.Action
	mac := hmac.New(sha256.New, []byte(s.st.secret()))
	mac.Write([]byte(msg))
	want := mac.Sum(nil)
	got, err := hex.DecodeString(strings.TrimSpace(gotHex))
	if err != nil {
		return false
	}
	return hmac.Equal(want, got)
}

func (s *server) pairingPayload() map[string]any {
	ip := primaryIP()
	return map[string]any{
		"v":      1,
		"app":    appID,
		"host":   s.hostname,
		"ip":     ip,
		"port":   s.port,
		"secret": s.st.secret(),
		"mac":    primaryMAC(), // lets the phone wake this PC later (Wake-on-LAN)
	}
}

func (s *server) allURLs() []string {
	var out []string
	for _, ip := range allIPs() {
		out = append(out, fmt.Sprintf("http://%s:%d", ip, s.port))
	}
	return out
}

// ---- small helpers ----

func writeJSON(w http.ResponseWriter, code int, v any) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(code)
	_ = json.NewEncoder(w).Encode(v)
}

func clientIP(r *http.Request) string { return clientIPFrom(r.RemoteAddr) }

func clientIPFrom(remote string) string {
	host, _, err := net.SplitHostPort(remote)
	if err != nil {
		return remote
	}
	return host
}

func isLoopback(remote string) bool {
	ip := net.ParseIP(clientIPFrom(remote))
	return ip != nil && ip.IsLoopback()
}

func abs64(x int64) int64 {
	if x < 0 {
		return -x
	}
	return x
}

// nonceCache remembers nonces for twice the skew window so a replayed command
// is caught, then forgets them to stay small.
type nonceCache struct {
	mu   sync.Mutex
	seen map[string]time.Time
}

func newNonceCache() *nonceCache { return &nonceCache{seen: make(map[string]time.Time)} }

// add returns true if the nonce is new (and records it); false if seen already.
func (c *nonceCache) add(nonce string, now time.Time) bool {
	c.mu.Lock()
	defer c.mu.Unlock()
	// prune
	cutoff := now.Add(-2 * clockSkew * time.Second)
	for k, t := range c.seen {
		if t.Before(cutoff) {
			delete(c.seen, k)
		}
	}
	if _, ok := c.seen[nonce]; ok {
		return false
	}
	c.seen[nonce] = now
	return true
}

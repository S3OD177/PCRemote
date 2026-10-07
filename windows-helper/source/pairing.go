package main

import (
	"encoding/json"
	"html/template"
	"net/http"

	qrcode "github.com/skip2/go-qrcode"
)

// qrText is what the QR encodes: the pairing payload as compact JSON. The phone
// scans it, keeps the secret, and uses the ip/port/mac to talk to this PC.
func (s *server) qrText() (string, error) {
	b, err := json.Marshal(s.pairingPayload())
	if err != nil {
		return "", err
	}
	return string(b), nil
}

func (s *server) handlePairQR(w http.ResponseWriter, r *http.Request) {
	if !isLoopback(r.RemoteAddr) {
		http.Error(w, "local only", http.StatusForbidden)
		return
	}
	text, err := s.qrText()
	if err != nil {
		http.Error(w, "qr error", http.StatusInternalServerError)
		return
	}
	png, err := qrcode.Encode(text, qrcode.Medium, 440)
	if err != nil {
		http.Error(w, "qr error", http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "image/png")
	w.Header().Set("Cache-Control", "no-store")
	_, _ = w.Write(png)
}

func (s *server) handlePairPage(w http.ResponseWriter, r *http.Request) {
	if !isLoopback(r.RemoteAddr) {
		writeJSON(w, http.StatusForbidden, map[string]any{"ok": false, "error": "local_only"})
		return
	}
	if r.URL.Path != "/" {
		http.NotFound(w, r)
		return
	}
	s.st.mu.RLock()
	paired := s.st.Paired
	s.st.mu.RUnlock()

	data := struct {
		Host   string
		URLs   []string
		Paired bool
	}{s.hostname, s.allURLs(), paired}
	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	_ = pairTmpl.Execute(w, data)
}

var pairTmpl = template.Must(template.New("pair").Parse(`<!doctype html>
<html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Pair PC Remote</title>
<style>
:root{color-scheme:dark light}
*{box-sizing:border-box}
body{margin:0;min-height:100vh;display:grid;place-items:center;padding:28px;
 font-family:-apple-system,"Segoe UI",system-ui,sans-serif;background:#0b1020;color:#eef2ff}
.card{width:100%;max-width:430px;background:#141a2e;border:1px solid rgba(255,255,255,.08);
 border-radius:24px;padding:30px;text-align:center;box-shadow:0 30px 80px -30px #000}
h1{font-size:23px;margin:0 0 4px}
p{color:#9aa6c4;font-size:15px;line-height:1.6;margin:6px 0}
.qr{margin:22px auto;width:300px;height:300px;background:#fff;border-radius:18px;padding:16px;display:grid;place-items:center}
.qr img{width:100%;height:100%;image-rendering:pixelated}
.badge{display:inline-block;margin-top:6px;padding:5px 14px;border-radius:999px;font-size:13px;font-weight:600}
.on{background:rgba(52,211,153,.15);color:#34d399}
.off{background:rgba(251,191,36,.15);color:#fbbf24}
.steps{text-align:left;margin:18px auto 0;max-width:330px;font-size:14.5px;color:#c7d0e8;line-height:1.9}
.steps b{color:#fff}
.urls{margin-top:18px;font-size:12.5px;color:#6b7694;word-break:break-all}
code{background:rgba(255,255,255,.07);padding:2px 7px;border-radius:7px;color:#a5b4fc}
</style></head>
<body><div class="card">
<h1>Pair your iPhone</h1>
<p>Open <b>PC Remote</b> on your iPhone and scan this code.</p>
<div class="qr"><img src="/pair.png?t={{len .URLs}}" alt="Pairing QR code"></div>
{{if .Paired}}<span class="badge on">✓ A phone is paired</span>
<p>Scanning again adds another phone. To remove phones, use “Unpair all” in the tray menu.</p>
{{else}}<span class="badge off">Waiting for your phone…</span>{{end}}
<div class="steps">
 <div>1. On the iPhone, open <b>PC Remote</b>.</div>
 <div>2. Tap <b>Add a PC</b>, then point the camera here.</div>
 <div>3. Done — the buttons light up.</div>
</div>
<div class="urls">This PC: {{range .URLs}}<code>{{.}}</code> {{end}}</div>
</div></body></html>`))

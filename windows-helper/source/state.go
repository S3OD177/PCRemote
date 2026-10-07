package main

import (
	"crypto/rand"
	"encoding/base32"
	"encoding/json"
	"os"
	"path/filepath"
	"sync"
)

// state is what we remember between runs: the pairing secret and the port.
type state struct {
	mu       sync.RWMutex
	Secret   string `json:"secret"`    // base32, shared with the phone by QR only
	Port     int    `json:"port"`      // the port the service listens on
	Paired   bool   `json:"paired"`    // has a phone completed pairing?
	LastSeen int64  `json:"last_seen"` // unix seconds of the last valid command

	path string
}

func statePath() string { return filepath.Join(dataDir(), "state.json") }

func loadState() (*state, error) {
	s := &state{Port: defaultPort, path: statePath()}
	data, err := os.ReadFile(s.path)
	if err == nil {
		_ = json.Unmarshal(data, s)
	}
	if s.Port < 1024 || s.Port > 65535 {
		s.Port = defaultPort
	}
	if len(s.Secret) < 32 {
		s.Secret = newSecret()
		s.Paired = false
		_ = s.save()
	}
	return s, err
}

// newSecret returns 32 random bytes as an unpadded base32 string (A–Z, 2–7),
// which is compact and survives being put in a QR code and a URL.
func newSecret() string {
	b := make([]byte, 32)
	if _, err := rand.Read(b); err != nil {
		panic("no randomness available: " + err.Error())
	}
	return base32.StdEncoding.WithPadding(base32.NoPadding).EncodeToString(b)
}

func (s *state) save() error {
	s.mu.RLock()
	snapshot := struct {
		Secret   string `json:"secret"`
		Port     int    `json:"port"`
		Paired   bool   `json:"paired"`
		LastSeen int64  `json:"last_seen"`
	}{s.Secret, s.Port, s.Paired, s.LastSeen}
	s.mu.RUnlock()

	data, err := json.MarshalIndent(snapshot, "", "  ")
	if err != nil {
		return err
	}
	tmp := s.path + ".tmp"
	if err := os.WriteFile(tmp, data, 0o600); err != nil {
		return err
	}
	return os.Rename(tmp, s.path)
}

func (s *state) secret() string {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return s.Secret
}

func (s *state) markPaired() {
	s.mu.Lock()
	s.Paired = true
	s.mu.Unlock()
	_ = s.save()
}

func (s *state) touch(now int64) {
	s.mu.Lock()
	s.LastSeen = now
	wasPaired := s.Paired
	s.Paired = true
	s.mu.Unlock()
	if !wasPaired {
		_ = s.save()
	}
}

// resetSecret makes a brand-new secret, which unpairs every phone that had the
// old one. Used by the "Unpair all devices" menu item.
func (s *state) resetSecret() {
	s.mu.Lock()
	s.Secret = newSecret()
	s.Paired = false
	s.LastSeen = 0
	s.mu.Unlock()
	_ = s.save()
}

//go:build !windows

// Stubs so the project builds and the server can be exercised on Linux/macOS.
// On Windows the real tray lives in tray_windows.go.
package main

import "log"

func runTray(srv *server) {
	log.Printf("[stub] no tray on this OS; running service only. URLs: %v", srv.allURLs())
	select {}
}

func fatalDialog(text string) { log.Printf("FATAL: %s", text) }
func autostartEnabled() bool  { return false }
func setAutostart(bool) error { return nil }

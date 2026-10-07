//go:build !windows

// Test stubs so the server logic can be built and exercised on Linux/macOS.
// The real behavior lives in actions_windows.go.
package main

import "log"

func doShutdown() error { log.Printf("[stub] shutdown"); return nil }
func doSleep() error    { log.Printf("[stub] sleep"); return nil }
func doLock() error     { log.Printf("[stub] lock"); return nil }

//go:build windows

package main

import (
	"os/exec"
	"syscall"

	"golang.org/x/sys/windows"
)

const createNoWindow = 0x08000000

// doShutdown turns the PC off. /f forces still-open apps to close so it doesn't
// hang on an "unsaved changes" dialog.
func doShutdown() error {
	return runHidden("shutdown", "/s", "/f", "/t", "0")
}

// doLock locks the screen (same as Win+L) via the documented user32 call.
func doLock() error {
	user32 := windows.NewLazySystemDLL("user32.dll")
	r, _, err := user32.NewProc("LockWorkStation").Call()
	if r == 0 {
		return err
	}
	return nil
}

// doSleep puts the PC to sleep. SetSuspendState(false,...) means sleep, not
// hibernate. We first enable the shutdown privilege, which sleep requires.
func doSleep() error {
	enableShutdownPrivilege()

	powrprof := windows.NewLazySystemDLL("powrprof.dll")
	allowed, _, _ := powrprof.NewProc("IsPwrSuspendAllowed").Call()
	if allowed != 0 {
		r, _, err := powrprof.NewProc("SetSuspendState").Call(0, 0, 0) // hibernate=0, force=0, wake=0
		if r == 0 {
			return err
		}
		return nil
	}

	// Modern-standby laptops have no classic sleep; turning the display off
	// drops them into standby instead.
	user32 := windows.NewLazySystemDLL("user32.dll")
	const HWND_BROADCAST = 0xFFFF
	const WM_SYSCOMMAND = 0x0112
	const SC_MONITORPOWER = 0xF170
	user32.NewProc("SendMessageW").Call(HWND_BROADCAST, WM_SYSCOMMAND, SC_MONITORPOWER, 2)
	return nil
}

// enableShutdownPrivilege grants this process SeShutdownPrivilege for the
// current token, needed before sleeping or shutting down via the API.
func enableShutdownPrivilege() {
	var tok windows.Token
	p := windows.CurrentProcess()
	if err := windows.OpenProcessToken(p, windows.TOKEN_ADJUST_PRIVILEGES|windows.TOKEN_QUERY, &tok); err != nil {
		return
	}
	defer tok.Close()

	var luid windows.LUID
	name, _ := windows.UTF16PtrFromString("SeShutdownPrivilege")
	if err := windows.LookupPrivilegeValue(nil, name, &luid); err != nil {
		return
	}
	priv := windows.Tokenprivileges{PrivilegeCount: 1}
	priv.Privileges[0] = windows.LUIDAndAttributes{Luid: luid, Attributes: windows.SE_PRIVILEGE_ENABLED}
	_ = windows.AdjustTokenPrivileges(tok, false, &priv, 0, nil, nil)
}

func runHidden(name string, args ...string) error {
	cmd := exec.Command(name, args...)
	cmd.SysProcAttr = &syscall.SysProcAttr{HideWindow: true, CreationFlags: createNoWindow}
	return cmd.Run()
}

//go:build windows

package main

import (
	"fmt"
	"log"
	"os"
	"os/exec"
	"syscall"
	"unsafe"

	"fyne.io/systray"
	"golang.org/x/sys/windows"
	"golang.org/x/sys/windows/registry"
)

const runKey = `Software\Microsoft\Windows\CurrentVersion\Run`
const runName = "PC Remote"

func runTray(srv *server) {
	systray.Run(func() { onReady(srv) }, func() {})
}

func onReady(srv *server) {
	systray.SetIcon(iconICO)
	systray.SetTitle("")
	systray.SetTooltip("PC Remote — control this PC from your iPhone")

	mPair := systray.AddMenuItem("Pair iPhone…", "Show the QR code to pair your phone")
	systray.AddSeparator()
	mAuto := systray.AddMenuItemCheckbox("Start with Windows", "Launch automatically when you sign in", autostartEnabled())
	mUnpair := systray.AddMenuItem("Unpair all devices", "Make a new secret; every phone must pair again")
	systray.AddSeparator()
	mStatus := systray.AddMenuItem(statusLine(srv), "")
	mStatus.Disable()
	mLogs := systray.AddMenuItem("Open log folder", "")
	mQuit := systray.AddMenuItem("Quit", "Stop PC Remote")

	go func() {
		for {
			select {
			case <-mPair.ClickedCh:
				openPairing(srv)
			case <-mAuto.ClickedCh:
				toggleAutostart(mAuto)
			case <-mUnpair.ClickedCh:
				if confirm("Unpair all devices?",
					"Every paired iPhone will stop working and must scan the QR code again.") {
					srv.st.resetSecret()
					log.Printf("secret reset; all devices unpaired")
					info("Done", "All devices were unpaired. Open “Pair iPhone…” to pair again.")
				}
			case <-mLogs.ClickedCh:
				openPath(dataDir())
			case <-mQuit.ClickedCh:
				systray.Quit()
				os.Exit(0)
			}
		}
	}()
}

func statusLine(srv *server) string {
	urls := srv.allURLs()
	if len(urls) == 0 {
		return "No network found"
	}
	return "Running at " + urls[0]
}

func openPairing(srv *server) {
	openURL(fmt.Sprintf("http://127.0.0.1:%d/", srv.port))
}

// ---- auto-start (registry Run key) ----

func exePath() string {
	p, err := os.Executable()
	if err != nil {
		return os.Args[0]
	}
	return p
}

func autostartCommand() string { return fmt.Sprintf("\"%s\" --serve", exePath()) }

func autostartEnabled() bool {
	k, err := registry.OpenKey(registry.CURRENT_USER, runKey, registry.QUERY_VALUE)
	if err != nil {
		return false
	}
	defer k.Close()
	v, _, err := k.GetStringValue(runName)
	return err == nil && v != ""
}

func toggleAutostart(item *systray.MenuItem) {
	var err error
	if autostartEnabled() {
		err = setAutostart(false)
		if err == nil {
			item.Uncheck()
		}
	} else {
		err = setAutostart(true)
		if err == nil {
			item.Check()
		}
	}
	if err != nil {
		log.Printf("autostart: %v", err)
		info("Couldn't change this setting", err.Error())
	}
}

func setAutostart(on bool) error {
	k, _, err := registry.CreateKey(registry.CURRENT_USER, runKey, registry.SET_VALUE)
	if err != nil {
		return err
	}
	defer k.Close()
	if on {
		return k.SetStringValue(runName, autostartCommand())
	}
	err = k.DeleteValue(runName)
	if err == registry.ErrNotExist {
		return nil
	}
	return err
}

// ---- Windows dialogs & shell ----

func messageBox(title, text string, flags uint32) int32 {
	user32 := windows.NewLazySystemDLL("user32.dll")
	t, _ := windows.UTF16PtrFromString(text)
	c, _ := windows.UTF16PtrFromString(title)
	r, _, _ := user32.NewProc("MessageBoxW").Call(0,
		uintptr(unsafe.Pointer(t)), uintptr(unsafe.Pointer(c)), uintptr(flags))
	return int32(r)
}

func info(title, text string)  { messageBox(title, text, 0x40) }        // MB_ICONINFORMATION
func fatalDialog(text string)  { messageBox("PC Remote", text, 0x10) }  // MB_ICONERROR
func confirm(title, text string) bool {
	const MB_YESNO, MB_ICONQUESTION, IDYES = 0x4, 0x20, 6
	return messageBox(title, text, MB_YESNO|MB_ICONQUESTION) == IDYES
}

func openURL(url string)  { _ = shellExec(url) }
func openPath(p string)   { _ = shellExec(p) }

func shellExec(target string) error {
	verb, _ := windows.UTF16PtrFromString("open")
	file, _ := windows.UTF16PtrFromString(target)
	shell32 := windows.NewLazySystemDLL("shell32.dll")
	r, _, err := shell32.NewProc("ShellExecuteW").Call(0,
		uintptr(unsafe.Pointer(verb)), uintptr(unsafe.Pointer(file)), 0, 0, 1) // SW_SHOWNORMAL
	if r <= 32 {
		// Fallback via cmd for odd cases.
		c := exec.Command("cmd", "/c", "start", "", target)
		c.SysProcAttr = &syscall.SysProcAttr{HideWindow: true, CreationFlags: createNoWindow}
		return c.Run()
	}
	_ = err
	return nil
}

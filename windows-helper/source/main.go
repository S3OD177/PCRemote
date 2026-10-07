// PC Remote - companion service for the PC Remote iPhone app.
//
// Runs quietly in the Windows notification area (next to the clock). You pair
// your iPhone once by scanning a QR code; after that the phone can shut down,
// sleep, or lock this PC over your home Wi-Fi.
//
// Security model (why this is safe without a password):
//   - Pairing shares a 32-byte secret by QR code only. The secret is shown on
//     THIS screen and never travels over the network.
//   - Every command the phone sends is signed with that secret (HMAC-SHA256)
//     and carries a timestamp + one-time nonce, so a command can't be forged,
//     replayed, or sent by any other app or website.
//   - The service answers only on your local network (private IPs), and checks
//     the Host header to block DNS-rebinding tricks.
//
// Build (from Windows, or cross-compiled):
//   go build -ldflags "-H windowsgui -s -w" -o PCRemote.exe .
package main

import (
	"flag"
	"log"
	"os"
	"path/filepath"
	"runtime"
)

const (
	appName    = "PC Remote"
	appID      = "pc-remote"
	apiVersion = "1"
	defaultPort = 8765
)

func main() {
	var (
		serveOnly = flag.Bool("serve", false, "run the background service without the tray menu")
		noTray    = flag.Bool("no-tray", false, "alias for -serve")
		showVer   = flag.Bool("version", false, "print version and exit")
	)
	flag.Parse()

	if *showVer {
		os.Stdout.WriteString(appName + " " + buildVersion + "\n")
		return
	}

	setupLogging()
	log.Printf("%s %s starting (os=%s)", appName, buildVersion, runtime.GOOS)

	st, err := loadState()
	if err != nil {
		log.Printf("state: %v (using fresh state)", err)
	}

	srv := newServer(st)
	if err := srv.start(); err != nil {
		log.Printf("FATAL: could not start service: %v", err)
		fatalDialog("PC Remote couldn't start.\n\n" + err.Error() +
			"\n\nAnother copy may already be running, or the port is in use.")
		return
	}
	log.Printf("listening on port %d", srv.port)

	// -serve: just the background service (used by auto-start). Otherwise show
	// the tray icon and its menu.
	if *serveOnly || *noTray {
		select {} // run forever
	}
	runTray(srv)
}

func dataDir() string {
	base, err := os.UserConfigDir()
	if err != nil || base == "" {
		base, _ = os.UserHomeDir()
	}
	dir := filepath.Join(base, "PCRemote")
	_ = os.MkdirAll(dir, 0o700)
	return dir
}

func setupLogging() {
	f, err := os.OpenFile(filepath.Join(dataDir(), "pcremote.log"),
		os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0o600)
	if err != nil {
		return
	}
	// Keep the log from growing without bound.
	if st, err := f.Stat(); err == nil && st.Size() > 512*1024 {
		f.Truncate(0)
		f.Seek(0, 0)
	}
	log.SetOutput(f)
	log.SetFlags(log.LstdFlags)
}

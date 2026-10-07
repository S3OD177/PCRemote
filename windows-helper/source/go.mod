module pcremote

go 1.24.0

toolchain go1.24.7

replace (
	fyne.io/systray => github.com/fyne-io/systray v1.11.0
	golang.org/x/sys => github.com/golang/sys v0.36.0
)

require (
	fyne.io/systray v1.11.0
	github.com/skip2/go-qrcode v0.0.0-20200617195104-da1b6568686e
	golang.org/x/sys v0.36.0
)

require github.com/godbus/dbus/v5 v5.1.0 // indirect

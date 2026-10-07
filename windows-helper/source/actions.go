package main

// An action is one thing the phone can ask the PC to do.
type action struct {
	label string
	run   func() error
}

// The set of actions the phone can trigger. To add one: implement it in
// actions_windows.go and add a line here.
var actions = map[string]action{
	"shutdown": {"Shut down", doShutdown},
	"sleep":    {"Sleep", doSleep},
	"lock":     {"Lock screen", doLock},
}

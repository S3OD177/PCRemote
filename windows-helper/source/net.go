package main

import (
	"net"
	"sort"
)

var buildVersion = "2.0"

// primaryIP picks the LAN IPv4 address other devices would use to reach us.
func primaryIP() string {
	ips := allIPs()
	if len(ips) > 0 {
		return ips[0]
	}
	// Fallback: ask the routing table which source address reaches the internet.
	if c, err := net.Dial("udp", "8.8.8.8:80"); err == nil {
		defer c.Close()
		if a, ok := c.LocalAddr().(*net.UDPAddr); ok {
			return a.IP.String()
		}
	}
	return "127.0.0.1"
}

// allIPs returns usable private IPv4 addresses, most-likely-LAN first.
func allIPs() []string {
	ifaces, err := net.Interfaces()
	if err != nil {
		return nil
	}
	type cand struct {
		ip   string
		rank int
	}
	var cands []cand
	for _, ifa := range ifaces {
		if ifa.Flags&net.FlagUp == 0 || ifa.Flags&net.FlagLoopback != 0 {
			continue
		}
		addrs, _ := ifa.Addrs()
		for _, a := range addrs {
			ipn, ok := a.(*net.IPNet)
			if !ok {
				continue
			}
			ip4 := ipn.IP.To4()
			if ip4 == nil || !ip4.IsPrivate() {
				continue
			}
			cands = append(cands, cand{ip4.String(), rankIP(ip4, ifa.Name)})
		}
	}
	sort.SliceStable(cands, func(i, j int) bool { return cands[i].rank < cands[j].rank })
	out := make([]string, 0, len(cands))
	for _, c := range cands {
		out = append(out, c.ip)
	}
	return out
}

// rankIP prefers common home-router ranges and real Wi-Fi/Ethernet adapters
// over virtual ones (VirtualBox, VMware, Hyper-V, WSL).
func rankIP(ip net.IP, name string) int {
	r := 0
	switch {
	case ip[0] == 192 && ip[1] == 168:
		r = 0
	case ip[0] == 10:
		r = 1
	default: // 172.16/12
		r = 2
	}
	lname := name
	for _, bad := range []string{"VirtualBox", "VMware", "Hyper-V", "vEthernet", "WSL", "Loopback", "Bluetooth"} {
		if containsFold(lname, bad) {
			r += 10
		}
	}
	return r
}

// primaryMAC returns the hardware address matching primaryIP, as AA:BB:...,
// so the phone can send a Wake-on-LAN packet to this PC later.
func primaryMAC() string {
	target := primaryIP()
	ifaces, err := net.Interfaces()
	if err != nil {
		return ""
	}
	for _, ifa := range ifaces {
		addrs, _ := ifa.Addrs()
		for _, a := range addrs {
			if ipn, ok := a.(*net.IPNet); ok {
				if ip4 := ipn.IP.To4(); ip4 != nil && ip4.String() == target {
					if len(ifa.HardwareAddr) == 6 {
						return ifa.HardwareAddr.String()
					}
				}
			}
		}
	}
	return ""
}

func containsFold(s, sub string) bool {
	return len(sub) == 0 || indexFold(s, sub) >= 0
}

func indexFold(s, sub string) int {
	ls, lsub := toLower(s), toLower(sub)
	for i := 0; i+len(lsub) <= len(ls); i++ {
		if ls[i:i+len(lsub)] == lsub {
			return i
		}
	}
	return -1
}

func toLower(s string) string {
	b := []byte(s)
	for i, c := range b {
		if c >= 'A' && c <= 'Z' {
			b[i] = c + 32
		}
	}
	return string(b)
}

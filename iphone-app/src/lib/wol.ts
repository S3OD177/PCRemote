// Wake-on-LAN helper. Wraps the native module and works out the subnet
// broadcast address from the PC's IP (assuming the common /24 home network),
// so the magic packet reaches the PC even when it's asleep and has no IP active.
import WakeOnLan, { isAvailable } from '../../modules/wake-on-lan';
import type { PC } from './storage';

export function canWake(pc: PC): boolean {
  return isAvailable() && !!pc.mac;
}

function subnetBroadcast(ip: string): string | null {
  const parts = ip.split('.');
  if (parts.length !== 4) return null;
  parts[3] = '255';
  return parts.join('.');
}

export async function wake(pc: PC): Promise<boolean> {
  if (!pc.mac) throw new Error('no mac');
  return WakeOnLan.send(pc.mac, subnetBroadcast(pc.ip));
}

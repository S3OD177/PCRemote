// Talking to the PC: a connectivity ping and the signed command sender. The
// signature scheme here must match the Go service exactly:
//   X-Signature = hex(HMAC-SHA256(secret, "<ts>.<nonce>.<action>"))
import * as Crypto from 'expo-crypto';

import { hmacSha256Hex, toHex } from './hmac';
import type { PC } from './storage';

export type Action = 'shutdown' | 'sleep' | 'lock';

const PING_TIMEOUT = 3000;
const CMD_TIMEOUT = 6000;

export type PingResult =
  | { ok: true; name: string; version: string; paired: boolean }
  | { ok: false };

function baseURL(pc: PC): string {
  return `http://${pc.ip}:${pc.port}`;
}

async function withTimeout(ms: number): Promise<{ signal: AbortSignal; done: () => void }> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  return { signal: ctrl.signal, done: () => clearTimeout(timer) };
}

export async function ping(pc: PC): Promise<PingResult> {
  const { signal, done } = await withTimeout(PING_TIMEOUT);
  try {
    const res = await fetch(`${baseURL(pc)}/api/v1/ping`, { signal, cache: 'no-store' });
    if (!res.ok) return { ok: false };
    const d = await res.json();
    if (d?.app !== 'pc-remote') return { ok: false };
    return { ok: true, name: d.name ?? pc.name, version: d.version ?? '', paired: !!d.paired };
  } catch {
    return { ok: false };
  } finally {
    done();
  }
}

export type CmdResult =
  | { ok: true }
  | { ok: false; reason: 'unauthorized' | 'network' | 'server' };

function nonceHex(): string {
  return toHex(Crypto.getRandomBytes(12));
}

export async function sendCommand(pc: PC, action: Action): Promise<CmdResult> {
  const ts = Date.now();
  const nonce = nonceHex();
  const sig = hmacSha256Hex(pc.secret, `${ts}.${nonce}.${action}`);
  const { signal, done } = await withTimeout(CMD_TIMEOUT);
  try {
    const res = await fetch(`${baseURL(pc)}/api/v1/command`, {
      method: 'POST',
      signal,
      cache: 'no-store',
      headers: { 'Content-Type': 'application/json', 'X-Signature': sig },
      body: JSON.stringify({ action, ts, nonce }),
    });
    if (res.ok) return { ok: true };
    if (res.status === 401) return { ok: false, reason: 'unauthorized' };
    return { ok: false, reason: 'server' };
  } catch {
    return { ok: false, reason: 'network' };
  } finally {
    done();
  }
}

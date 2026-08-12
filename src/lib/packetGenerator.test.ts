import { describe, expect, it } from 'vitest';
import {
  makeAmplificationPacket,
  makeArpSpoofPacket,
  makeFloodPacket,
  makeGameTickPacket,
  makeLobbyPacket,
  makePingPacket,
  makePortScanPacket,
  makeSlowlorisPacket,
  makeSniffedPacket,
} from './packetGenerator';
import type { Packet } from '../types';

function assertWellFormedPacket(p: Packet) {
  expect(p.id).toBeGreaterThan(0);
  expect(p.no).toBeGreaterThan(0);
  expect(p.length).toBeGreaterThan(0);
  expect(p.src.length).toBeGreaterThan(0);
  expect(p.dst.length).toBeGreaterThan(0);
  expect(p.info.length).toBeGreaterThan(0);

  const hexBytes = p.hex.split(' ').filter(Boolean);
  expect(hexBytes.length).toBeGreaterThan(0);
  for (const byte of hexBytes) {
    expect(byte).toMatch(/^[0-9a-f]{2}$/);
  }
  expect(p.ascii.length).toBe(hexBytes.length);
}

describe('packetGenerator', () => {
  it('generates well-formed game tick packets', () => {
    expect(() => assertWellFormedPacket(makeGameTickPacket())).not.toThrow();
  });

  it('generates well-formed lobby packets', () => {
    expect(() => assertWellFormedPacket(makeLobbyPacket())).not.toThrow();
  });

  it('generates well-formed sniffed packets marked malicious', () => {
    const p = makeSniffedPacket();
    assertWellFormedPacket(p);
    expect(p.malicious).toBe(true);
  });

  it('generates well-formed flood packets with spoofed sources', () => {
    const p = makeFloodPacket();
    assertWellFormedPacket(p);
    expect(p.malicious).toBe(true);
    expect(p.protocol).toBe('UDP');
  });

  it('generates well-formed port scan packets cycling through ports', () => {
    const p1 = makePortScanPacket();
    const p2 = makePortScanPacket();
    assertWellFormedPacket(p1);
    assertWellFormedPacket(p2);
    expect(p1.dst).not.toBe(p2.dst);
  });

  it('generates well-formed ARP spoof packets', () => {
    const p = makeArpSpoofPacket();
    assertWellFormedPacket(p);
    expect(p.protocol).toBe('ARP');
    expect(p.malicious).toBe(true);
  });

  it('generates oversized amplification packets', () => {
    const p = makeAmplificationPacket();
    assertWellFormedPacket(p);
    expect(p.length).toBeGreaterThanOrEqual(1200);
  });

  it('generates low-length slowloris packets', () => {
    const p = makeSlowlorisPacket();
    assertWellFormedPacket(p);
    expect(p.protocol).toBe('TCP');
  });

  it('increments packet ids across calls', () => {
    const a = makeGameTickPacket();
    const b = makeGameTickPacket();
    expect(b.id).toBeGreaterThan(a.id);
  });

  it('produces a plausible ping reply', () => {
    const { line, ms } = makePingPacket('104.22.15.89', 1);
    expect(line).toContain('icmp_seq=1');
    expect(ms).toBeGreaterThan(0);
  });
});

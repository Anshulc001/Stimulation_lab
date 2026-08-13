import { describe, expect, it } from 'vitest';
import {
  makeAmplificationPacket,
  makeArpPacket,
  makeArpSpoofPacket,
  makeDhcpPacket,
  makeDnsPacket,
  makeFloodPacket,
  makeGameTickPacket,
  makeIcmpPacket,
  makeLobbyPacket,
  makeNtpPacket,
  makePingPacket,
  makePortScanPacket,
  makeReflectionRequestPacket,
  makeSlowlorisPacket,
  makeTlsPacket,
  makeUdpPortScanPacket,
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

  it('generates well-formed TLS capture packets marked benign', () => {
    const p = makeTlsPacket();
    assertWellFormedPacket(p);
    expect(p.protocol).toBe('TCP');
    expect(p.malicious).toBe(false);
    expect(p.info).toContain('encrypted');
  });

  it('generates well-formed TCP SYN flood packets with spoofed sources', () => {
    const p = makeFloodPacket();
    assertWellFormedPacket(p);
    expect(p.malicious).toBe(true);
    expect(p.protocol).toBe('TCP');
    expect(p.info).toContain('[SYN]');
  });

  it('generates well-formed reflection request packets', () => {
    const p = makeReflectionRequestPacket();
    assertWellFormedPacket(p);
    expect(p.protocol).toBe('UDP');
    expect(p.malicious).toBe(true);
    expect(p.info).toContain('[REFLECTION]');
  });

  it('generates well-formed port scan packets cycling through ports', () => {
    const p1 = makePortScanPacket();
    const p2 = makePortScanPacket();
    assertWellFormedPacket(p1);
    assertWellFormedPacket(p2);
    expect(p1.dst).not.toBe(p2.dst);
  });

  it('generates well-formed UDP port scan probes', () => {
    const p = makeUdpPortScanPacket();
    assertWellFormedPacket(p);
    expect(p.protocol).toBe('UDP');
    expect(p.malicious).toBe(false);
    expect(p.info).toContain('UDP-SCAN');
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

  it('generates benign background ARP packets', () => {
    const p = makeArpPacket();
    assertWellFormedPacket(p);
    expect(p.protocol).toBe('ARP');
    expect(p.malicious).toBe(false);
    expect(p.info).toContain('[ARP]');
  });

  it('generates benign DNS packets', () => {
    const p = makeDnsPacket();
    assertWellFormedPacket(p);
    expect(p.protocol).toBe('UDP');
    expect(p.malicious).toBe(false);
    expect(p.info).toContain('[DNS]');
  });

  it('generates benign NTP packets', () => {
    const p = makeNtpPacket();
    assertWellFormedPacket(p);
    expect(p.protocol).toBe('UDP');
    expect(p.malicious).toBe(false);
    expect(p.info).toContain('[NTP]');
  });

  it('generates benign DHCP packets', () => {
    const p = makeDhcpPacket();
    assertWellFormedPacket(p);
    expect(p.protocol).toBe('UDP');
    expect(p.malicious).toBe(false);
    expect(p.info).toContain('[DHCP]');
  });

  it('generates benign ICMP echo packets', () => {
    const p = makeIcmpPacket();
    assertWellFormedPacket(p);
    expect(p.protocol).toBe('ICMP');
    expect(p.malicious).toBe(false);
    expect(p.info).toContain('[ICMP]');
  });

  it('increments packet ids across calls', () => {
    const a = makeGameTickPacket();
    const b = makeGameTickPacket();
    expect(b.id).toBeGreaterThan(a.id);
  });

  it('produces a plausible ping reply', () => {
    const { line, ms } = makePingPacket('10.0.0.10', 1);
    expect(line).toContain('icmp_seq=1');
    expect(ms).toBeGreaterThan(0);
  });
});

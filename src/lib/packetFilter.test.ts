import { describe, expect, it } from 'vitest';
import { parsePacketFilter } from './packetFilter';
import type { Packet } from '../types';

function makePacket(overrides: Partial<Packet> = {}): Packet {
  return {
    id: 1,
    no: 1,
    time: '0.000000',
    src: '192.168.1.45',
    dst: '104.22.15.89:7777',
    protocol: 'UDP',
    length: 64,
    info: 'Player State Update Seq=1',
    malicious: false,
    hex: '00 01',
    ascii: '..',
    ...overrides,
  };
}

describe('parsePacketFilter', () => {
  it('matches everything for an empty query', () => {
    const predicate = parsePacketFilter('');
    expect(predicate(makePacket())).toBe(true);
  });

  it('matches plain substrings against src/dst/info/protocol', () => {
    const predicate = parsePacketFilter('45.33.12.201');
    expect(predicate(makePacket({ src: '45.33.12.201' }))).toBe(true);
    expect(predicate(makePacket({ src: '10.0.0.1' }))).toBe(false);
  });

  it('supports src== field filter', () => {
    const predicate = parsePacketFilter('src==192.168.1.45');
    expect(predicate(makePacket({ src: '192.168.1.45' }))).toBe(true);
    expect(predicate(makePacket({ src: '10.0.0.1' }))).toBe(false);
  });

  it('supports proto== field filter case-insensitively', () => {
    const predicate = parsePacketFilter('proto==udp');
    expect(predicate(makePacket({ protocol: 'UDP' }))).toBe(true);
    expect(predicate(makePacket({ protocol: 'TCP' }))).toBe(false);
  });

  it('supports ip.addr== matching either src or dst', () => {
    const predicate = parsePacketFilter('ip.addr==104.22.15.89');
    expect(predicate(makePacket({ dst: '104.22.15.89:7777' }))).toBe(true);
    expect(predicate(makePacket({ src: '104.22.15.89', dst: '1.2.3.4' }))).toBe(true);
    expect(predicate(makePacket({ src: '1.2.3.4', dst: '5.6.7.8' }))).toBe(false);
  });

  it('combines multiple tokens with AND semantics', () => {
    const predicate = parsePacketFilter('proto==udp 104.22.15.89');
    expect(predicate(makePacket({ protocol: 'UDP', dst: '104.22.15.89:7777' }))).toBe(true);
    expect(predicate(makePacket({ protocol: 'TCP', dst: '104.22.15.89:7777' }))).toBe(false);
    expect(predicate(makePacket({ protocol: 'UDP', dst: '1.2.3.4' }))).toBe(false);
  });
});

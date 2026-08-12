import type { Packet } from '../types';

type FieldKey = 'src' | 'dst' | 'proto' | 'ip.addr';

const FIELD_ALIASES: Record<string, FieldKey> = {
  src: 'src',
  source: 'src',
  dst: 'dst',
  dest: 'dst',
  destination: 'dst',
  proto: 'proto',
  protocol: 'proto',
  'ip.addr': 'ip.addr',
};

function matchesField(packet: Packet, field: FieldKey, value: string): boolean {
  const v = value.toLowerCase();
  switch (field) {
    case 'src':
      return packet.src.toLowerCase().includes(v);
    case 'dst':
      return packet.dst.toLowerCase().includes(v);
    case 'proto':
      return packet.protocol.toLowerCase() === v;
    case 'ip.addr':
      return packet.src.toLowerCase().includes(v) || packet.dst.toLowerCase().includes(v);
    default:
      return true;
  }
}

/**
 * Parses a Wireshark-lite filter query into a predicate function.
 * Supports space-separated tokens (implicit AND):
 *   - plain substrings, matched against src/dst/info
 *   - `field==value` tokens for src, dst, proto/protocol, ip.addr
 */
export function parsePacketFilter(query: string): (p: Packet) => boolean {
  const trimmed = query.trim();
  if (!trimmed) return () => true;

  const tokens = trimmed.split(/\s+/).filter(Boolean);
  const predicates: ((p: Packet) => boolean)[] = tokens.map((token) => {
    const eqMatch = token.match(/^([\w.]+)==(.+)$/);
    if (eqMatch) {
      const [, rawField, value] = eqMatch;
      const field = FIELD_ALIASES[rawField.toLowerCase()];
      if (field) {
        return (p: Packet) => matchesField(p, field, value);
      }
    }
    const needle = token.toLowerCase();
    return (p: Packet) =>
      p.src.toLowerCase().includes(needle) ||
      p.dst.toLowerCase().includes(needle) ||
      p.info.toLowerCase().includes(needle) ||
      p.protocol.toLowerCase().includes(needle);
  });

  return (p: Packet) => predicates.every((pred) => pred(p));
}

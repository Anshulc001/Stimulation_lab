import { describe, expect, it } from 'vitest';
import { parseCommandLine } from './commands';

describe('parseCommandLine', () => {
  it('parses a simple command with no args', () => {
    expect(parseCommandLine('help')).toEqual({ cmd: 'help', args: [] });
  });

  it('parses a command with args', () => {
    expect(parseCommandLine('ping 104.22.15.89')).toEqual({ cmd: 'ping', args: ['104.22.15.89'] });
  });

  it('parses flags and multiple args', () => {
    expect(parseCommandLine('hping3 -S --flood -p 7777 104.22.15.89')).toEqual({
      cmd: 'hping3',
      args: ['-S', '--flood', '-p', '7777', '104.22.15.89'],
    });
  });

  it('collapses extra whitespace', () => {
    expect(parseCommandLine('  nmap   -sS   104.22.15.89  ')).toEqual({
      cmd: 'nmap',
      args: ['-sS', '104.22.15.89'],
    });
  });

  it('handles an empty string', () => {
    expect(parseCommandLine('')).toEqual({ cmd: '', args: [] });
  });

  it('parses iptables block syntax', () => {
    expect(parseCommandLine('iptables -A INPUT -s 45.33.12.201 -j DROP')).toEqual({
      cmd: 'iptables',
      args: ['-A', 'INPUT', '-s', '45.33.12.201', '-j', 'DROP'],
    });
  });
});

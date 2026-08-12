import { describe, expect, it } from 'vitest';
import { isInsecureSniffArgs, parseCommandLine } from './commands';

describe('parseCommandLine', () => {
  it('parses a simple command with no args', () => {
    expect(parseCommandLine('help')).toEqual({ cmd: 'help', args: [] });
  });

  it('parses a command with args', () => {
    expect(parseCommandLine('ping 10.0.0.10')).toEqual({ cmd: 'ping', args: ['10.0.0.10'] });
  });

  it('parses flags and multiple args', () => {
    expect(parseCommandLine('hping3 -S --flood -p 7777 10.0.0.10')).toEqual({
      cmd: 'hping3',
      args: ['-S', '--flood', '-p', '7777', '10.0.0.10'],
    });
  });

  it('collapses extra whitespace', () => {
    expect(parseCommandLine('  nmap   -sS   10.0.0.10  ')).toEqual({
      cmd: 'nmap',
      args: ['-sS', '10.0.0.10'],
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

describe('isInsecureSniffArgs', () => {
  it('accepts the canonical --insecure flag', () => {
    expect(isInsecureSniffArgs(['--insecure'])).toBe(true);
  });

  it('accepts the bracketed form copied from help text', () => {
    expect(isInsecureSniffArgs(['[--insecure]'])).toBe(true);
  });

  it('accepts the shorthand -i flag', () => {
    expect(isInsecureSniffArgs(['-i'])).toBe(true);
  });

  it('rejects a plain sniff invocation', () => {
    expect(isInsecureSniffArgs([])).toBe(false);
    expect(isInsecureSniffArgs(['10.0.0.10'])).toBe(false);
  });
});

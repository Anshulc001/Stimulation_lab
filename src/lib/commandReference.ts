export interface CommandReference {
  cmd: string;
  usage: string;
  description: string;
}

export const COMMAND_REFERENCE: CommandReference[] = [
  { cmd: 'help', usage: 'help [command]', description: 'List all commands, or show detailed usage for one command.' },
  { cmd: 'guide', usage: 'guide', description: 'Open the full in-app scenario & command guide panel.' },
  { cmd: 'clear', usage: 'clear', description: 'Clear the terminal scrollback.' },
  { cmd: 'status', usage: 'status', description: 'Print the current scenario, server health, and live telemetry values.' },
  { cmd: 'ping', usage: 'ping <ip>', description: 'Send 4 simulated ICMP echo requests to a host and print latency stats.' },
  { cmd: 'traceroute', usage: 'traceroute <ip>', description: 'Print a simulated hop-by-hop route to a host.' },
  { cmd: 'whois', usage: 'whois <ip>', description: 'Look up simulated registrar / ASN / country info for an IP.' },
  { cmd: 'netstat', usage: 'netstat -an', description: 'Show active simulated socket connections (reflects current scenario).' },
  { cmd: 'sniff', usage: 'sniff', description: 'Start simulated passive packet capture on the local subnet. TLS payloads stay encrypted and invisible; add --insecure to demonstrate plaintext HTTP session-token exposure (Recon).' },
  { cmd: 'nmap', usage: 'nmap -sS -sU <ip>', description: 'Run a simulated combined TCP SYN + UDP port scan against a host — reveals which services are exposed (Recon).' },
  { cmd: 'arpspoof', usage: 'arpspoof -t <victim> -r <gateway>', description: 'Poison the local ARP cache between the victim client and the gateway, rerouting traffic through the attacker (MITM).' },
  { cmd: 'hping3', usage: 'hping3 -S --flood -p 7777 <ip>', description: 'Launch a simulated SYN flood DDoS attack. Add --amplify -p <port> for an amplification attack.' },
  { cmd: 'slowloris', usage: 'slowloris <ip>', description: 'Launch a simulated low-and-slow Slowloris connection-exhaustion attack.' },
  { cmd: 'waf', usage: 'waf <on|off>', description: 'Toggle Web/Traffic-shaping firewall mitigation for the currently active attack.' },
  { cmd: 'block', usage: 'block <ip>', description: 'Manually drop a specific spoofed/attacking source IP at the firewall.' },
  { cmd: 'iptables', usage: 'iptables -A INPUT -s <ip> -j DROP', description: 'Same as `block <ip>` — manually firewall a specific source IP.' },
  { cmd: 'ban', usage: 'ban', description: 'Run the Anti-Cheat enforcement pass: detect, flag HWID, and ban the current attacker.' },
];

export function findCommandReference(cmd: string): CommandReference | undefined {
  return COMMAND_REFERENCE.find((c) => c.cmd === cmd);
}

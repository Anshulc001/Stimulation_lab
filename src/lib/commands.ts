import { useSimStore } from '../store/simStore';
import { useWindowStore } from '../store/windowStore';
import { makePingPacket } from './packetGenerator';
import { getScenario, isAttackScenario } from './scenarios/registry';
import { COMMAND_REFERENCE, findCommandReference } from './commandReference';
import type { ScenarioId } from '../types';

export function parseCommandLine(raw: string): { cmd: string; args: string[] } {
  const trimmed = raw.trim();
  const [cmd, ...args] = trimmed.split(/\s+/).filter(Boolean);
  return { cmd: cmd ?? '', args };
}

function typeLine(text: string, type: 'output' | 'error' | 'success' = 'output', delay = 0) {
  const { pushTerminalLine } = useSimStore.getState();
  if (delay === 0) {
    pushTerminalLine(type, text);
  } else {
    setTimeout(() => pushTerminalLine(type, text), delay);
  }
}

function buildHelpText(): string {
  const width = Math.max(...COMMAND_REFERENCE.map((c) => c.usage.length)) + 2;
  const lines = ['Available commands:'];
  for (const c of COMMAND_REFERENCE) {
    lines.push(`  ${c.usage.padEnd(width)}${c.description}`);
  }
  return lines.join('\n');
}

function runHelp(args: string[]) {
  if (args[0]) {
    const ref = findCommandReference(args[0]);
    if (!ref) {
      typeLine(`no help entry for '${args[0]}'`, 'error');
      return;
    }
    typeLine(`${ref.cmd}\n  usage: ${ref.usage}\n  ${ref.description}`, 'success');
    return;
  }
  typeLine(buildHelpText());
}

function runPing(args: string[]) {
  const host = args[0] || '104.22.15.89';
  typeLine(`PING ${host} (${host}): 56 data bytes`);
  let seq = 0;
  const iv = setInterval(() => {
    seq += 1;
    const { line } = makePingPacket(host, seq);
    typeLine(line);
    if (seq >= 4) {
      clearInterval(iv);
      typeLine('');
      typeLine(`--- ${host} ping statistics ---`);
      typeLine('4 packets transmitted, 4 packets received, 0.0% packet loss');
    }
  }, 400);
}

function runTraceroute(args: string[]) {
  const host = args[0] || '104.22.15.89';
  typeLine(`traceroute to ${host}, 8 hops max`);
  const hops = [
    '192.168.1.1',
    '10.10.0.1',
    '172.16.4.9',
    '203.0.113.1',
    '198.51.100.7',
    '100.64.0.23',
    '104.22.0.1',
    host,
  ];
  let i = 0;
  const iv = setInterval(() => {
    i += 1;
    const ms = (8 + i * 6 + Math.random() * 8).toFixed(2);
    typeLine(`${String(i).padStart(2, ' ')}  ${hops[i - 1]}  ${ms} ms`);
    if (i >= hops.length) clearInterval(iv);
  }, 220);
}

function runWhois(args: string[]) {
  const host = args[0] || '104.22.15.89';
  typeLine(`whois lookup for ${host}`);
  typeLine(`  registrar:    CyberLab Simulated Registry`);
  typeLine(`  asn:          AS${13000 + (host.split('.').reduce((a, b) => a + Number(b) || 0, 0) % 900)}`);
  typeLine(`  country:      ${['US', 'DE', 'NL', 'SG', 'IN'][host.length % 5]}`);
  typeLine(`  organization: Simulated Cloud Hosting Ltd.`);
  typeLine(`  abuse-email:  abuse@example-simulated.test`);
}

function runHping3(args: string[], raw: string) {
  const target = args[args.length - 1] || '104.22.15.89';
  const isAmplify = raw.includes('--amplify');
  const portMatch = raw.match(/-p\s*(\d+)/);
  const port = portMatch ? portMatch[1] : isAmplify ? '123' : '7777';

  if (isAmplify) {
    typeLine(`HPING ${target} (eth0 ${target}): amplification mode, reflector port ${port}`);
    typeLine('Sending spoofed requests to open reflectors... (simulated)', 'output', 200);
    typeLine('[!] WARNING: Oversized reflected UDP responses detected inbound to match server.', 'error', 600);
    startAttack('amplification', target, port, 900);
    return;
  }

  typeLine(`HPING ${target} (eth0 ${target}): S set, 40 headers + 0 data bytes`);
  typeLine(`Flooding target on port ${port}... press CTRL-C to stop (simulated)`, 'output', 200);
  typeLine('', 'output', 300);
  typeLine('[!] WARNING: Malicious traffic pattern detected on outbound interface.', 'error', 600);
  startAttack('synflood', target, port, 900);
}

function runSlowloris(args: string[]) {
  const target = args[0] || '104.22.15.89';
  typeLine(`Slowloris targeting ${target}:80 — opening sockets and trickling partial headers...`);
  typeLine('[!] WARNING: Connection pool exhaustion pattern detected.', 'error', 400);
  startAttack('slowloris', target, '80', 700);
}

function runArpspoof(args: string[]) {
  const gateway = args.includes('-t') ? args[args.indexOf('-t') + 1] : '192.168.1.1';
  const target = args.includes('-r') ? args[args.indexOf('-r') + 1] : '104.22.15.10';
  typeLine(`arpspoof: poisoning ARP cache — impersonating ${gateway} to reroute traffic toward ${target}`);
  typeLine('[!] WARNING: Gratuitous ARP replies detected on local subnet.', 'error', 400);
  const { setScenario, pushSecurityEvent } = useSimStore.getState();
  setTimeout(() => {
    setScenario('arpspoof');
    pushSecurityEvent('warning', 'Gratuitous ARP Reply Detected');
    typeLine('>>> SYSTEM STATE CHANGED: MITM / ARP SPOOF ACTIVE <<<', 'error');
  }, 700);
}

function runNmap(args: string[]) {
  const target = args[args.length - 1] || '104.22.15.89';
  typeLine(`Starting Nmap-lite scan on ${target}`);
  useSimStore.getState().setScenario('portscan');
  const ports = [21, 22, 23, 25, 53, 80, 110, 143, 443, 3389, 7777, 8080];
  let i = 0;
  const iv = setInterval(() => {
    if (i >= ports.length) {
      clearInterval(iv);
      typeLine('');
      typeLine(`Nmap done: ${ports.length} ports scanned on ${target}`, 'success');
      return;
    }
    const port = ports[i];
    const isGamePort = port === 7777;
    const state = isGamePort ? 'open' : ['open', 'closed', 'filtered'][Math.floor(Math.random() * 3)];
    const svc = isGamePort ? 'game' : ['ftp', 'ssh', 'telnet', 'smtp', 'dns', 'http', 'pop3', 'imap', 'https', 'ms-wbt', 'game', 'http-alt'][i];
    const proto = isGamePort ? 'UDP' : 'TCP';
    typeLine(`PORT ${port}/${proto.toLowerCase()}  STATE: ${state.toUpperCase()}  SERVICE: ${svc}`, state === 'open' ? 'success' : 'output');
    i += 1;
  }, 350);
}

function startAttack(id: ScenarioId, target: string, port: string, delay: number) {
  setTimeout(() => {
    const { setScenario, pushSecurityEvent } = useSimStore.getState();
    setScenario(id);
    pushSecurityEvent('critical', `${getScenario(id).shortLabel} initiated against ${target}:${port}`);
    typeLine(`>>> SYSTEM STATE CHANGED: UNDER ${getScenario(id).shortLabel.toUpperCase()} ATTACK <<<`, 'error');
  }, delay);
}

function runNetstat() {
  const lines = [
    'Active Internet connections',
    'Proto  Local Address           Foreign Address         State',
    'udp    192.168.1.45:51422      104.22.15.89:7777       ESTABLISHED',
    'tcp    192.168.1.45:51888      104.22.15.10:443        ESTABLISHED',
    'tcp    192.168.1.45:51889      104.22.15.10:443        TIME_WAIT',
    'udp    192.168.1.45:51423      104.22.15.89:7777       ESTABLISHED',
  ];
  const scenario = useSimStore.getState().activeScenario;
  if (scenario === 'synflood' || scenario === 'amplification' || scenario === 'recovering') {
    lines.push('udp    45.33.12.201:0          104.22.15.89:7777       SYN_FLOOD');
    lines.push('udp    88.198.44.19:0          104.22.15.89:7777       SYN_FLOOD');
    lines.push('udp    193.29.107.5:0          104.22.15.89:7777       SYN_FLOOD');
  }
  if (scenario === 'slowloris') {
    for (let i = 0; i < 6; i++) {
      lines.push(
        `tcp    ${randomIp()}:0             104.22.15.89:80         ${Math.random() > 0.5 ? 'ESTABLISHED' : 'FIN_WAIT_1'}`
      );
    }
  }
  if (scenario === 'arpspoof') {
    lines.push('');
    lines.push('ARP cache table');
    lines.push('Address              HWtype  HWaddress           Flags');
    lines.push('192.168.1.1          ether   00:1a:2b:77:ff:ee   C  (SPOOFED — expected 00:1a:2b:00:11:22)');
  }
  lines.forEach((l) => typeLine(l));
}

function randomIp() {
  return `${Math.floor(Math.random() * 223) + 1}.${Math.floor(Math.random() * 255)}.${Math.floor(
    Math.random() * 255
  )}.${Math.floor(Math.random() * 254) + 1}`;
}

function runStatus() {
  const s = useSimStore.getState();
  const scenario = getScenario(s.activeScenario);
  typeLine(`scenario: ${scenario.label} (${s.activeScenario})`);
  typeLine(`server health: ${s.serverHealth}`);
  typeLine(`cpu load: ${s.cpuLoad.toFixed(0)}%`);
  typeLine(`ping: ${s.ping.toFixed(0)}ms`);
  typeLine(`tick rate: ${s.tickRate.toFixed(0)}Hz`);
  typeLine(`packet loss: ${s.packetLoss.toFixed(1)}%`);
  typeLine(`players online: ${s.playerCount.toFixed(0)}`);
  typeLine(`waf mitigation: ${s.wafActive ? 'ON' : 'off'}`);
  typeLine(`hwid banned: ${s.hwidBanned}`);
}

function runSniff() {
  const { setScenario, pushSecurityEvent } = useSimStore.getState();
  setScenario('sniffing');
  typeLine('Starting passive packet capture on eth0...');
  typeLine('Listening for unencrypted session fragments...', 'output', 300);
  pushSecurityEvent('warning', 'Promiscuous mode NIC detected on local subnet');
  let count = 0;
  const iv = setInterval(() => {
    count += 1;
    const isUdp = Math.random() > 0.3;
    const proto = isUdp ? 'UDP' : 'TCP';
    const port = isUdp ? 7777 : [443, 80, 27015][Math.floor(Math.random() * 3)];
    const len = Math.floor(Math.random() * 200) + 60;
    const srcIp = Math.random() > 0.5 ? '192.168.1.45' : '104.22.15.89';
    const dstIp = srcIp === '192.168.1.45' ? '104.22.15.89' : '192.168.1.45';
    typeLine(
      `${count.toString().padStart(4, ' ')}  ${proto} ${srcIp}:${port} -> ${dstIp}:${port}  Len=${len}`,
      'output',
      0
    );
    if (count >= 10) {
      clearInterval(iv);
      typeLine('');
      typeLine(`Capture complete: ${count} packets captured on eth0`, 'success');
    }
  }, 500);
}

function runWaf(args: string[]) {
  const mode = args[0];
  if (mode !== 'on' && mode !== 'off') {
    typeLine('usage: waf <on|off>', 'error');
    return;
  }
  const { setWafActive, pushSecurityEvent, activeScenario } = useSimStore.getState();
  setWafActive(mode === 'on');
  if (mode === 'on' && isAttackScenario(activeScenario)) {
    pushSecurityEvent('success', 'WAF Rule Applied: Rate-Limiting Excess Traffic');
    typeLine('WAF mitigation engaged — excess traffic is now being rate-limited.', 'success');
  } else {
    typeLine(`WAF mitigation ${mode === 'on' ? 'armed' : 'disarmed'}.`, mode === 'on' ? 'success' : 'output');
  }
}

function runBlock(args: string[]) {
  const ip = args[0];
  if (!ip) {
    typeLine('usage: block <ip>', 'error');
    return;
  }
  const { blockIp, pushSecurityEvent } = useSimStore.getState();
  blockIp(ip);
  pushSecurityEvent('success', `Manual Firewall Rule Added: DROP ${ip}`);
  typeLine(`Firewall rule added: all traffic from ${ip} is now dropped at the edge.`, 'success');
}

function runIptables(raw: string) {
  const match = raw.match(/-s\s+([\d.]+)/);
  if (match) {
    runBlock([match[1]]);
    return;
  }
  typeLine('usage: iptables -A INPUT -s <ip> -j DROP', 'error');
}

function runBan() {
  const { pushSecurityEvent, setHwidBanned, activeScenario, setScenario } = useSimStore.getState();

  if (!isAttackScenario(activeScenario)) {
    setScenario('synflood');
    pushSecurityEvent('critical', 'SYN Flood initiated against 104.22.15.89:7777');
    typeLine('Malicious flood detected on ingress — spinning up anti-cheat enforcement...', 'error');
  } else {
    typeLine('Running anti-cheat enforcement pass...');
  }

  setTimeout(() => pushSecurityEvent('warning', 'Anomalous Packet Rate Detected'), 800);
  setTimeout(
    () => pushSecurityEvent('critical', 'Flagged Attacker Hardware Hash: HWID-88F2-A901-7BC3'),
    1800
  );
  setTimeout(() => {
    pushSecurityEvent('success', 'HWID Ban Enforced');
    setHwidBanned(true);
    useSimStore.getState().setScenario('recovering');
    typeLine('HWID-88F2-A901-7BC3 has been permanently banned. Server recovering...', 'success');
  }, 2800);
}

export function executeCommand(raw: string) {
  const trimmed = raw.trim();
  const { pushTerminalLine, clearTerminal } = useSimStore.getState();
  pushTerminalLine('input', trimmed);

  if (!trimmed) return;
  const { cmd, args } = parseCommandLine(trimmed);

  switch (cmd) {
    case 'help':
      runHelp(args);
      break;
    case 'guide':
      useWindowStore.getState().openApp({
        appId: 'guide',
        title: 'CyberLab Guide',
        width: 520,
        height: 500,
      });
      typeLine('Opening guide window...', 'success');
      break;
    case 'clear':
      clearTerminal();
      break;
    case 'ping':
      if (!args[0]) {
        typeLine('usage: ping <ip>', 'error');
      } else {
        runPing(args);
      }
      break;
    case 'traceroute':
      runTraceroute(args);
      break;
    case 'whois':
    case 'geoip':
      runWhois(args);
      break;
    case 'hping3':
      runHping3(args, trimmed);
      break;
    case 'slowloris':
      runSlowloris(args);
      break;
    case 'arpspoof':
    case 'mitm':
      runArpspoof(args);
      break;
    case 'nmap':
    case 'portscan':
      runNmap(args);
      break;
    case 'netstat':
      runNetstat();
      break;
    case 'status':
      runStatus();
      break;
    case 'sniff':
      runSniff();
      break;
    case 'waf':
      runWaf(args);
      break;
    case 'block':
      runBlock(args);
      break;
    case 'iptables':
      runIptables(trimmed);
      break;
    case 'ban':
      runBan();
      break;
    default:
      typeLine(`command not found: ${cmd} (type 'help' for a list of commands)`, 'error');
  }
}

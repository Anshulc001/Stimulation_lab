import { useSimStore } from '../store/simStore';
import { useWindowStore } from '../store/windowStore';
import {
  ATTACKER_IP,
  CLIENT_IP,
  GATEWAY_IP,
  HTTP_PORT,
  MATCH_PORT,
  MATCH_SERVER,
  NTP_REFLECTOR_PORT,
  TCP_SCAN_RESULTS,
  UDP_SCAN_RESULTS,
  WEB_PORT,
  WEB_SERVER,
  makePingPacket,
} from './packetGenerator';
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
  const host = args[0] || MATCH_SERVER;
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
  const host = args[0] || MATCH_SERVER;
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
  const host = args[0] || MATCH_SERVER;
  typeLine(`whois lookup for ${host}`);
  typeLine(`  registrar:    CyberLab Simulated Registry`);
  typeLine(`  asn:          AS${13000 + (host.split('.').reduce((a, b) => a + Number(b) || 0, 0) % 900)}`);
  typeLine(`  country:      ${['US', 'DE', 'NL', 'SG', 'IN'][host.length % 5]}`);
  typeLine(`  organization: Simulated Cloud Hosting Ltd.`);
  typeLine(`  abuse-email:  abuse@example-simulated.test`);
}

function runHping3(args: string[], raw: string) {
  const target = args[args.length - 1] || MATCH_SERVER;
  const isAmplify = raw.includes('--amplify');
  const portMatch = raw.match(/-p\s*(\d+)/);
  const port = portMatch
    ? portMatch[1]
    : isAmplify
      ? String(NTP_REFLECTOR_PORT)
      : String(MATCH_PORT);

  if (isAmplify) {
    typeLine(`HPING ${target} (eth0 ${target}): amplification mode, reflector port ${port}`);
    typeLine(`Attack path: ${ATTACKER_IP} (attacker) ──▶ open reflectors ──▶ ${target}:${MATCH_PORT}/UDP (target)`, 'output', 200);
    typeLine('Sending spoofed requests to open reflectors... (simulated)', 'output', 350);
    typeLine('[!] WARNING: Oversized reflected UDP responses detected inbound to match server.', 'error', 600);
    startAttack('amplification', target, port, 900);
    return;
  }

  typeLine(`HPING ${target} (eth0 ${target}): S set, 40 headers + 0 data bytes`);
  typeLine(`Attack path: ${ATTACKER_IP} (attacker) ──▶ ${target}:${port}/TCP (target)`, 'output', 200);
  typeLine(`Flooding target on port ${port}... press CTRL-C to stop (simulated)`, 'output', 300);
  typeLine('', 'output', 400);
  typeLine('[!] WARNING: Malicious traffic pattern detected on outbound interface.', 'error', 600);
  startAttack('synflood', target, port, 900);
}

function runSlowloris(args: string[]) {
  const target = args[0] || WEB_SERVER;
  typeLine(`Slowloris targeting ${target}:${HTTP_PORT} — opening sockets and trickling partial headers...`);
  typeLine(`Attack path: ${ATTACKER_IP} (attacker) ──▶ ${target}:${HTTP_PORT}/TCP (web / API server)`, 'output', 200);
  typeLine('[!] WARNING: Connection pool exhaustion pattern detected.', 'error', 450);
  startAttack('slowloris', target, String(HTTP_PORT), 700);
}

function runArpspoof(args: string[]) {
  const victim = args.includes('-t') ? args[args.indexOf('-t') + 1] : CLIENT_IP;
  const gateway = args.includes('-r') ? args[args.indexOf('-r') + 1] : GATEWAY_IP;
  typeLine('arpspoof: poisoning ARP cache — impersonating the gateway to reroute client traffic');
  typeLine('');
  typeLine('[SIMULATION]', 'output', 150);
  typeLine(`Attacker: ${ATTACKER_IP}`, 'output', 200);
  typeLine(`Victim:   ${victim}`, 'output', 250);
  typeLine(`Gateway:  ${gateway}`, 'output', 300);
  typeLine('', 'output', 400);
  typeLine('ARP poisoning simulation started.', 'output', 450);
  typeLine('Client traffic is now being represented as:', 'output', 500);
  typeLine('Client → Attacker → Gateway', 'output', 550);
  typeLine('[!] WARNING: Gratuitous ARP replies detected on local subnet.', 'error', 600);
  const { setScenario, pushSecurityEvent } = useSimStore.getState();
  setTimeout(() => {
    setScenario('arpspoof');
    pushSecurityEvent('warning', 'Gratuitous ARP Reply Detected');
    typeLine('>>> SYSTEM STATE CHANGED: MITM / ARP SPOOF ACTIVE <<<', 'error');
  }, 700);
}

function scanRow(proto: string, port: number, state: string, svc: string): string {
  return `${`${port}/${proto}`.padEnd(13)}${state.padEnd(12)}${svc}`;
}

function scanHeader(label: string): string {
  return `${label.padEnd(13)}${'STATE'.padEnd(12)}SERVICE`;
}

function runNmap(args: string[]) {
  const target = args[args.length - 1] || MATCH_SERVER;
  typeLine(`Starting Nmap-lite combined TCP SYN + UDP scan on ${target}`);
  useSimStore.getState().setScenario('portscan');

  typeLine('', 'output', 250);
  typeLine(scanHeader('TCP PORT'), 'output', 250);
  let i = 0;
  const iv = setInterval(() => {
    if (i < TCP_SCAN_RESULTS.length) {
      const r = TCP_SCAN_RESULTS[i];
      typeLine(scanRow(r.proto.toLowerCase(), r.port, r.state, r.service), r.state === 'OPEN' ? 'success' : 'output');
    } else if (i === TCP_SCAN_RESULTS.length) {
      typeLine('', 'output', 0);
      typeLine(scanHeader('UDP PORT'), 'output', 0);
    } else if (i < TCP_SCAN_RESULTS.length + 1 + UDP_SCAN_RESULTS.length) {
      const r = UDP_SCAN_RESULTS[i - TCP_SCAN_RESULTS.length - 1];
      typeLine(scanRow(r.proto.toLowerCase(), r.port, r.state, r.service), r.state === 'OPEN' ? 'success' : 'output');
    } else {
      clearInterval(iv);
      typeLine('', 'output', 0);
      typeLine(
        `Nmap-lite done: ${TCP_SCAN_RESULTS.length} TCP ports + ${UDP_SCAN_RESULTS.length} UDP ports scanned`,
        'success',
        0
      );
      // Recon → target identification: feed the attack selection.
      typeLine('', 'output', 250);
      typeLine('[RECON]', 'output', 300);
      typeLine(`Target discovered: ${target}`, 'output', 400);
      typeLine(`Open service: UDP/${MATCH_PORT}`, 'output', 500);
      typeLine('Service: GAME', 'output', 600);
      typeLine('', 'output', 700);
      typeLine('[INFO] Game service is reachable.', 'success', 800);
      typeLine('[SIMULATION] Target can now be selected for a network-flood scenario.', 'output', 950);
      typeLine('[INFO] Session credentials are not required for network-flood scenarios.', 'output', 1100);
      return;
    }
    i += 1;
  }, 300);
}

function startAttack(id: ScenarioId, target: string, port: string, delay: number) {
  setTimeout(() => {
    const { setScenario, pushSecurityEvent } = useSimStore.getState();
    setScenario(id);
    pushSecurityEvent('critical', `${getScenario(id).shortLabel} initiated against ${target}:${port}`);
    typeLine(`>>> SYSTEM STATE CHANGED: UNDER ${getScenario(id).shortLabel.toUpperCase()} ATTACK <<<`, 'error');
  }, delay);
}

function netstatLine(proto: string, local: string, foreign: string, state: string) {
  return `${proto.padEnd(5)}  ${local.padEnd(19)}${foreign.padEnd(21)}${state}`;
}

function runNetstat() {
  const s = useSimStore.getState();
  const lines = [
    'Active Internet connections',
    netstatLine('Proto', 'Local Address', 'Foreign Address', 'State'),
    netstatLine('tcp', `${CLIENT_IP}:51888`, `${WEB_SERVER}:${WEB_PORT}`, 'ESTABLISHED'),
    netstatLine('tcp', `${CLIENT_IP}:51889`, `${WEB_SERVER}:${WEB_PORT}`, 'TIME_WAIT'),
  ];
  // The game UDP socket only exists while the match server is running.
  if (s.gameActive) {
    lines.push(netstatLine('udp', `${CLIENT_IP}:51422`, `${MATCH_SERVER}:${MATCH_PORT}`, 'ESTABLISHED'));
    lines.push(netstatLine('udp', `${CLIENT_IP}:51423`, `${MATCH_SERVER}:${MATCH_PORT}`, 'ESTABLISHED'));
  }
  const scenario = s.activeScenario;
  if (scenario === 'synflood' || scenario === 'amplification' || scenario === 'recovering') {
    lines.push(netstatLine('tcp', '45.33.12.201:0', `${MATCH_SERVER}:${MATCH_PORT}`, 'SYN_FLOOD'));
    lines.push(netstatLine('tcp', '88.198.44.19:0', `${MATCH_SERVER}:${MATCH_PORT}`, 'SYN_FLOOD'));
    lines.push(netstatLine('tcp', '193.29.107.5:0', `${MATCH_SERVER}:${MATCH_PORT}`, 'SYN_FLOOD'));
  }
  if (scenario === 'slowloris') {
    for (let i = 0; i < 6; i++) {
      lines.push(
        netstatLine('tcp', `${randomIp()}:0`, `${WEB_SERVER}:${HTTP_PORT}`, Math.random() > 0.5 ? 'ESTABLISHED' : 'FIN_WAIT_1')
      );
    }
  }
  if (scenario === 'arpspoof') {
    lines.push('');
    lines.push('ARP cache table');
    lines.push('Address              HWtype  HWaddress           Flags');
    lines.push(`${GATEWAY_IP}          ether   00:1a:2b:77:ff:ee   C  (SPOOFED — expected 00:1a:2b:00:11:22)`);
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
  typeLine(`game server: ${s.gameActive ? `RUNNING (${MATCH_SERVER}:${MATCH_PORT}/UDP)` : 'STOPPED'}`);
  typeLine(`server health: ${s.serverHealth}`);
  typeLine(`cpu load: ${s.cpuLoad.toFixed(0)}%`);
  typeLine(`ping: ${s.ping.toFixed(0)}ms`);
  typeLine(`tick rate: ${s.tickRate.toFixed(0)}Hz`);
  typeLine(`packet loss: ${s.packetLoss.toFixed(1)}%`);
  typeLine(`players online: ${s.playerCount.toFixed(0)}`);
  typeLine(`waf mitigation: ${s.wafActive ? 'ON' : 'off'}`);
  typeLine(`hwid banned: ${s.hwidBanned}`);
}

function runStartServer() {
  const { setGameActive } = useSimStore.getState();
  setGameActive(true);
  typeLine(`Game server started: ${MATCH_SERVER}:${MATCH_PORT}/UDP is now accepting connections.`, 'success');
  typeLine('Game-tick traffic will now appear in the packet analyzer.', 'output', 200);
}

function runStopServer() {
  const { setGameActive, setScenario, activeScenario } = useSimStore.getState();
  setGameActive(false);
  // A stopped server ends any running demo — return to the idle baseline.
  if (activeScenario !== 'baseline') setScenario('baseline');
  typeLine(`Game server stopped: ${MATCH_SERVER}:${MATCH_PORT}/UDP is no longer serving.`, 'success');
  typeLine('Capture now shows normal background LAN traffic only.', 'output', 200);
}

interface SniffFrame {
  proto: string;
  src: string;
  dst: string;
  label: string;
  len: number;
}

let sniffStreamInterval: ReturnType<typeof setInterval> | null = null;

function printSniffFrames(frames: SniffFrame[], onComplete: () => void) {
  if (sniffStreamInterval) clearInterval(sniffStreamInterval);
  let count = 0;
  const iv = setInterval(() => {
    const f = frames[count];
    typeLine(
      `${String(count + 1).padStart(4, ' ')}  ${f.proto} ${f.src.padEnd(22)}-> ${f.dst.padEnd(
        22
      )}  ${f.label.padEnd(5)} Len=${f.len}`,
      'output',
      0
    );
    count += 1;
    if (count >= frames.length) {
      clearInterval(iv);
      sniffStreamInterval = null;
      onComplete();
    }
  }, 450);
  sniffStreamInterval = iv;
}

/** True when the user asked for the plaintext demo, in any form they may have copied from help. */
export function isInsecureSniffArgs(args: string[]): boolean {
  return args.some(
    (a) => a.replace(/[[\]]/g, '').toLowerCase() === '--insecure' || a === '-i'
  );
}

function runSniff(args: string[]) {
  const { setScenario, pushSecurityEvent } = useSimStore.getState();
  setScenario('sniffing');
  typeLine('Starting simulated passive packet capture on eth0...');

  typeLine('', 'output', 150);
  typeLine(`Attacker: ${ATTACKER_IP}`, 'output', 150);
  typeLine('Capture target: Local LAN', 'output', 200);
  typeLine(`Observed client: ${CLIENT_IP}`, 'output', 250);
  typeLine('', 'output', 320);
  // Which hosts are visible on the segment — the "who am I observing" answer.
  typeLine('Observed hosts on segment:', 'output', 320);
  typeLine(`  ${GATEWAY_IP.padEnd(15)} gateway (LAN router)`, 'output', 360);
  typeLine(`  ${CLIENT_IP.padEnd(15)} game client (victim)`, 'output', 400);
  typeLine(`  ${MATCH_SERVER.padEnd(15)} game server :${MATCH_PORT}/UDP`, 'output', 440);
  typeLine(`  ${WEB_SERVER.padEnd(15)} web / API server :${WEB_PORT} (TLS)`, 'output', 480);
  typeLine('', 'output', 560);

  // Scenario B — plaintext demo: passive capture exposes a readable session token.
  if (isInsecureSniffArgs(args)) {
    typeLine('Warning: plaintext application traffic detected.', 'error', 700);
    pushSecurityEvent('critical', 'Plaintext HTTP session token exposed on local subnet');
    setTimeout(
      () =>
        printSniffFrames(
          [
            { proto: 'TCP', src: `${CLIENT_IP}:51442`, dst: `${WEB_SERVER}:${HTTP_PORT}`, label: 'HTTP', len: 253 },
            { proto: 'TCP', src: `${WEB_SERVER}:${HTTP_PORT}`, dst: `${CLIENT_IP}:51442`, label: 'HTTP', len: 184 },
            { proto: 'TCP', src: `${CLIENT_IP}:51443`, dst: `${WEB_SERVER}:${HTTP_PORT}`, label: 'HTTP', len: 137 },
            { proto: 'TCP', src: `${WEB_SERVER}:${HTTP_PORT}`, dst: `${CLIENT_IP}:51443`, label: 'HTTP', len: 212 },
          ],
          () => {
            typeLine('', 'output', 200);
            typeLine('[!] Plaintext HTTP detected', 'error', 250);
            typeLine('[!] Session token observed in captured payload', 'error', 450);
            typeLine('', 'output', 550);
            typeLine('    Cookie: SESSION_ID=SIM-7F31-A92C', 'output', 650);
            typeLine('', 'output', 800);
            typeLine('[CRITICAL] Session credential exposed to passive observer.', 'error', 900);
            typeLine('', 'output', 1050);
            typeLine('[INFO] Simulated response — session protection:', 'output', 1150);
            typeLine('Session risk: HIGH', 'error', 1300);
            typeLine('Session revoked · captured token is now invalid', 'success', 1500);
          }
        ),
      750
    );
    return;
  }

  // Scenario A — encrypted default: capture is possible, contents are protected.
  typeLine('Capturing observable local traffic...', 'output', 700);
  pushSecurityEvent('warning', 'Promiscuous mode NIC detected on local subnet');
  setTimeout(() => printSniffFrames(
    [
      { proto: 'ARP', src: GATEWAY_IP, dst: CLIENT_IP, label: 'Who-has', len: 42 },
      { proto: 'UDP', src: `${CLIENT_IP}:${MATCH_PORT}`, dst: `${MATCH_SERVER}:${MATCH_PORT}`, label: 'Game', len: 158 },
      { proto: 'UDP', src: `${MATCH_SERVER}:${MATCH_PORT}`, dst: `${CLIENT_IP}:${MATCH_PORT}`, label: 'Game', len: 107 },
      { proto: 'TCP', src: `${CLIENT_IP}:54320`, dst: `${WEB_SERVER}:${WEB_PORT}`, label: 'TLS', len: 253 },
      { proto: 'TCP', src: `${WEB_SERVER}:${WEB_PORT}`, dst: `${CLIENT_IP}:54320`, label: 'TLS', len: 251 },
      { proto: 'UDP', src: `${MATCH_SERVER}:${MATCH_PORT}`, dst: `${CLIENT_IP}:${MATCH_PORT}`, label: 'Game', len: 134 },    ],
    () => {
      typeLine('', 'output', 200);
      typeLine('[!] Passive capture detected.', 'error', 250);
      typeLine('[+] Traffic is observable on the simulated local segment.', 'success', 450);
      typeLine('[+] TLS payloads are encrypted.', 'success', 650);
      typeLine('[+] Session credentials: NOT VISIBLE', 'success', 850);
      typeLine('[+] Token contents: ENCRYPTED', 'success', 1050);
      typeLine('', 'output', 1200);
      typeLine('No plaintext session secrets exposed.', 'output', 1300);
    }
  ),
  750
);
}

/** Attack-appropriate mitigation messaging — defense is not a single generic button. */
const WAF_MITIGATION: Record<ScenarioId, { title: string; detail: string }> = {
  synflood: {
    title: 'SYN Protection: ENABLED',
    detail: 'SYN queue pressure ↓ · half-open connections ↓ · server CPU ↓',
  },
  amplification: {
    title: 'Reflection-source filtering + rate limiting applied',
    detail: 'Bandwidth saturation ↓ · packet rate ↓ · packet loss ↓',
  },
  slowloris: {
    title: 'Connection limits + request timeouts applied',
    detail: 'Open connections: 980/1000 → 210/1000 · connection pool freed',
  },
  arpspoof: {
    title: 'Dynamic ARP Inspection (DAI) armed',
    detail: 'ARP mapping conflict detected — malicious ARP update rejected · spoofed replies dropped',
  },
  portscan: {
    title: 'Firewall filtering + IDS alert raised',
    detail: 'Scan source added to watchlist',
  },
  sniffing: { title: 'Rate limiting engaged', detail: 'Excess traffic dropped at the edge' },
  baseline: { title: 'Rate limiting engaged', detail: 'Excess traffic dropped at the edge' },
  recovering: { title: 'Rate limiting engaged', detail: 'Excess traffic dropped at the edge' },
};

function runWaf(args: string[]) {
  const mode = args[0];
  if (mode !== 'on' && mode !== 'off') {
    typeLine('usage: waf <on|off>', 'error');
    return;
  }
  const { setWafActive, pushSecurityEvent, activeScenario } = useSimStore.getState();
  setWafActive(mode === 'on');
  if (mode === 'on' && isAttackScenario(activeScenario)) {
    const mitigation = WAF_MITIGATION[activeScenario];
    pushSecurityEvent('success', `${getScenario(activeScenario).shortLabel}: mitigation applied`);
    typeLine('[DETECTION] Malicious traffic pattern confirmed.', 'error');
    typeLine(`[MITIGATION] ${mitigation.title}`, 'success', 300);
    typeLine(`             ${mitigation.detail}`, 'output', 500);
    typeLine('[RESULT] Telemetry recovering toward baseline.', 'success', 800);
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
    pushSecurityEvent('critical', `SYN Flood initiated against ${MATCH_SERVER}:${MATCH_PORT}`);
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
    case 'start':
      runStartServer();
      break;
    case 'stop':
      runStopServer();
      break;
    case 'sniff':
    case 'sniff-insecure':
      runSniff(cmd === 'sniff-insecure' ? ['--insecure'] : args);
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

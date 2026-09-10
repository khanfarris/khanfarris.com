import {clientUpdates} from './client-updates';
export type Evidence = {
  tool: string;
  title: string;
  body: string;
  lesson: string;
};
export type Action = {
  id: string;
  label: string;
  tool: string;
  why: string;
  requires?: string;
  bad?: boolean;
  contain?: boolean;
};
export type Scenario = {
  id: string;
  title: string;
  skill: string;
  severity: string;
  brief: string;
  truth: string;
  evidence: Evidence[];
  actions: Action[];
  lesson: string;
  recap: string;
  source: number;
  host: string;
};
export const sources = [
  [
    'NIST · Incident Response Recommendations',
    'https://csrc.nist.gov/pubs/sp/800/61/r3/final',
  ],
  [
    'CISA · Incident Response Playbooks',
    'https://www.cisa.gov/news-events/news/federal-government-cybersecurity-incident-and-vulnerability-response-playbooks',
  ],
  [
    'Microsoft · Compromised cloud email response',
    'https://learn.microsoft.com/en-us/defender-office-365/responding-to-a-compromised-email-account',
  ],
  [
    'SentinelOne · Endpoint response and rollback',
    'https://www.sentinelone.com/faq/',
  ],
  [
    'Blackpoint · Microsoft 365 integration',
    'https://blackpointcyber.com/integrations/microsoft-365/',
  ],
  [
    'KnowBe4 · Phish Alert Button',
    'https://www.knowbe4.com/free-cybersecurity-tools/phish-alert-button',
  ],
  [
    'Timus · Device posture checks',
    'https://www.timusnetworks.com/device-posture-checks-msp-security/',
  ],
  [
    'CISA · Known Exploited Vulnerabilities',
    'https://www.cisa.gov/known-exploited-vulnerabilities-catalog',
  ],
  [
    'Microsoft · Troubleshoot DNS clients',
    'https://learn.microsoft.com/en-us/troubleshoot/windows-server/networking/troubleshoot-dns-guidance',
  ],
];
const e = (
  tool: string,
  title: string,
  body: string,
  lesson: string,
): Evidence => ({ tool, title, body, lesson });
const a = (
  id: string,
  label: string,
  tool: string,
  why: string,
  extra: Partial<Action> = {},
): Action => ({ id, label, tool, why, ...extra });
export const scenarios: Scenario[] = [
  {
    id: 'bec',
    title: 'The redirected invoice',
    skill: 'Identity',
    severity: 'Critical',
    host: 'FIN-023',
    brief:
      'The finance director sees a payment instruction they did not send. Blackpoint has escalated a cloud identity alert. The client incident plan preauthorizes containment of confirmed account compromise.',
    truth: 'Confirmed compromise',
    evidence: [
      e(
        'Entra ID',
        'Sign-in timeline',
        '10:04 UTC · user: finance@client.example\n10:04 · 198.51.100.28 · unmanaged device · successful sign-in\n10:07 · new session accesses Exchange Online\nKnown device: FIN-023 · last activity 09:52',
        'An unfamiliar IP alone is not proof. Correlate identity activity with mailbox changes and user verification.',
      ),
      e(
        'Microsoft 365',
        'Mailbox audit',
        '10:09 · New-InboxRule: Invoice Archive\nForwardTo: invoices@external.example\nDeleteMessage: true\n10:12 · Sent: Updated bank details\nMailbox owner denies both changes over a known phone number.',
        'Unauthorized forwarding and payment messages corroborate the identity alert. Preserve rule details before removal.',
      ),
      e(
        'Blackpoint MDR',
        'Response handoff',
        'Incident BP-204 · CONFIRMED account takeover\nSOC action: none yet; customer response requested\nScope: one identity confirmed; other recipients not yet assessed\nPayment due in 30 minutes.',
        'Read what MDR already did. Avoid assuming an alert means the account has been contained.',
      ),
    ],
    actions: [
      a(
        'contain',
        'Disable account + revoke sessions',
        'Entra ID',
        'Contain the compromised identity under the client plan; revocation can have propagation delays.',
        { contain: true },
      ),
      a(
        'clean',
        'Reset credentials; remove rogue rules and consent',
        'Microsoft 365',
        'Preserve audit evidence, remove persistence, review MFA methods and app consent, and reset at the authoritative identity source.',
        { requires: 'contain' },
      ),
      a(
        'verify',
        'Trace recipients; hold payment; verify recovery',
        'IR / client',
        'Use a known contact to stop payment, scope mail access and sent messages, coordinate recovery, and monitor for recurrence.',
        { requires: 'clean' },
      ),
      a(
        'trap',
        'Reset password and immediately close',
        'Microsoft 365',
        'A password reset alone does not remove malicious mailbox rules or fully address stolen sessions.',
        { bad: true },
      ),
    ],
    lesson:
      'Contain identity access, remove persistence, assess scope and business impact, then verify recovery. Never send replacement credentials into the compromised mailbox.',
    recap:
      'Walk me through your first 15 minutes of a business email compromise.',
    source: 2,
  },
  {
    id: 'travel',
    title: 'Two cities, one analyst',
    skill: 'Identity',
    severity: 'Medium',
    host: 'LAP-041',
    brief:
      'An impossible-travel alert flags a project manager. The client needs remote access for a scheduled presentation.',
    truth: 'Benign activity',
    evidence: [
      e(
        'Entra ID',
        'Authentication context',
        '09:11 · Denver · compliant LAP-041 · strong MFA\n09:14 · Chicago · same device ID and session\nIP: 203.0.113.40 · corporate VPN egress',
        'Geolocation describes an IP, not a person. Device and session context matters.',
      ),
      e(
        'Blackpoint MDR',
        'Correlated activity',
        'No new app consent or inbox rule changes.\nNo abnormal file downloads.\nSOC requests validation of VPN egress ownership.',
        'A lack of further anomalies helps but does not prove innocence.',
      ),
      e(
        'Service desk',
        'Known-channel verification',
        'Network inventory confirms 203.0.113.40 is the corporate VPN.\nManager confirms approved VPN use via directory phone number.\nTravel ticket and sign-in timestamps match.',
        'Independent verification and known infrastructure explain the alert.',
      ),
    ],
    actions: [
      a(
        'validate',
        'Correlate device, VPN and user verification',
        'Entra ID',
        'Validate the benign explanation with independent context.',
        { contain: true },
      ),
      a(
        'record',
        'Document benign result; narrowly tune detection',
        'Blackpoint MDR',
        'Record why the event is benign and request narrowly scoped tuning, preserving other identity detections.',
        { requires: 'validate' },
      ),
      a(
        'trap',
        'Disable every remote account',
        'Entra ID',
        'Unnecessary broad containment interrupts client operations without evidence.',
        { bad: true },
      ),
      a(
        'trap2',
        'Allowlist all foreign sign-ins',
        'Blackpoint MDR',
        'A blanket exclusion hides real future compromise.',
        { bad: true },
      ),
    ],
    lesson:
      'Impossible travel is a lead, not a verdict. Validate device, VPN, user and mailbox context before disruptive action.',
    recap:
      'How do you distinguish a false positive from a real identity compromise?',
    source: 4,
  },
  {
    id: 'ransom',
    title: 'The file server is whispering',
    skill: 'Endpoint',
    severity: 'Critical',
    host: 'WS-019',
    brief:
      'SentinelOne detects a document spawning a suspicious process on a workstation. The user reports renamed files. Endpoint containment is preauthorized by the client incident plan.',
    truth: 'Confirmed compromise',
    evidence: [
      e(
        'SentinelOne',
        'Storyline / process tree',
        'OUTLOOK.EXE → WINWORD.EXE → powershell.exe\nUnsigned child process modifies 230 documents\nConnection: 198.51.100.66:443\nThreat state: detected · response pending',
        'Parent-child relationships and file behavior matter more than a process name alone.',
      ),
      e(
        'SentinelOne',
        'Endpoint status',
        'WS-019 · Windows 11 · agent online\nNetwork quarantine: OFF\nFile server share open\nRollback eligibility: not yet verified',
        'Detection is not containment. Network isolation limits spread; rollback support and recovery data must be checked.',
      ),
      e(
        'Blackpoint MDR',
        'Scope and authority',
        'Client playbook authorizes immediate workstation isolation.\nNo server containment yet.\nCheck adjacent endpoints and file-share activity.\nDo not assume only the alerted host is affected.',
        'Coordinate response and broaden the scope without indiscriminately disconnecting business systems.',
      ),
    ],
    actions: [
      a(
        'isolate',
        'Network-isolate the affected workstation',
        'SentinelOne',
        'Isolate the infected host under the response plan while maintaining the management channel.',
        { contain: true },
      ),
      a(
        'clean',
        'Preserve telemetry; kill and remediate threat',
        'SentinelOne',
        'Collect relevant evidence and coordinate mitigation before destructive recovery.',
        { requires: 'isolate' },
      ),
      a(
        'recover',
        'Scope peers; validate backups and clean recovery',
        'IR / recovery',
        'Confirm eradication, recovery options and business function before reconnecting. Rollback is not a universal guarantee.',
        { requires: 'clean' },
      ),
      a(
        'trap',
        'Reboot and reconnect immediately',
        'Windows',
        'Rebooting can lose volatile evidence and reconnecting can enable spread.',
        { bad: true },
      ),
    ],
    lesson:
      'Detection, containment, eradication and recovery are different states. An alert disappearing is not proof of a clean endpoint.',
    recap:
      'When would you isolate an endpoint, and how would you decide it is safe to reconnect?',
    source: 3,
  },
  {
    id: 'admin',
    title: 'PowerShell after hours',
    skill: 'Endpoint',
    severity: 'Medium',
    host: 'SRV-012',
    brief:
      'A Windows Server 2019 endpoint triggers a script alert during an approved maintenance window.',
    truth: 'Benign activity',
    evidence: [
      e(
        'SentinelOne',
        'Process context',
        'Parent: approved management agent\nChild: powershell.exe\nScript: signed inventory collection\nHash matches the change record\nNo persistence or unusual network traffic',
        'PowerShell is dual-use. Context distinguishes legitimate administration from abuse.',
      ),
      e(
        'Change desk',
        'Maintenance authorization',
        'CHG-884 · inventory audit · approved\nOwner: infrastructure team\nScope: SRV-012\nWindow: matches execution time',
        'Match the actual host, hash, owner and time to the approved work.',
      ),
      e(
        'Windows Server',
        'Execution results',
        'Script exit: 0\nOutput: hardware inventory\nSigner: approved vendor\nInfrastructure engineer confirms execution on known channel.',
        'A signature is supporting evidence, not a reason to ignore behavior.',
      ),
    ],
    actions: [
      a(
        'validate',
        'Validate hash, scope and approved change',
        'SentinelOne',
        'Verify execution matches the authorized operation.',
        { contain: true },
      ),
      a(
        'record',
        'Record evidence; scope any exclusion narrowly',
        'Service desk',
        'Document the legitimate activity; avoid excluding the entire interpreter.',
        { requires: 'validate' },
      ),
      a(
        'trap',
        'Exclude all PowerShell from detection',
        'SentinelOne',
        'Broad exclusions create a major detection blind spot.',
        { bad: true },
      ),
      a(
        'trap2',
        'Isolate all production servers',
        'SentinelOne',
        'The evidence supports an approved script; broad isolation causes avoidable outage.',
        { bad: true },
      ),
    ],
    lesson:
      'Do not classify a command solely by its executable name. Correlate behavior, signer, hash, ownership and change records.',
    recap:
      'An EDR tool flags PowerShell on a production server. What do you check?',
    source: 3,
  },
  {
    id: 'phish',
    title: 'A shared document, urgently',
    skill: 'Email',
    severity: 'High',
    host: 'MAIL-008',
    brief:
      'A user reports a document-sharing email using the Phish Alert Button. They say they entered their password.',
    truth: 'Confirmed compromise',
    evidence: [
      e(
        'KnowBe4 / reported mail',
        'Message headers',
        'From: Project Team <share@documents-review.example>\nReply-To: help@external.example\nSPF: pass for documents-review.example\nLink text: Microsoft SharePoint\nActual host: signin.documents-review.example',
        'SPF pass authenticates the sending domain; it does not prove that the sender is Microsoft.',
      ),
      e(
        'Microsoft 365',
        'Click and identity review',
        'User entered credentials on the linked page.\nNew unmanaged sign-in appears 3 minutes later.\nMessage trace finds 8 recipients.',
        'Credential entry plus subsequent anomalous authentication requires identity response, not just message deletion.',
      ),
      e(
        'Service desk',
        'User report',
        'User contacted security immediately.\nNo attachment opened.\nIncident plan allows compromised-account containment.\nOther recipients have not yet been contacted.',
        'Thank the reporter and investigate scope without blame.',
      ),
    ],
    actions: [
      a(
        'contain',
        'Contain the exposed identity and revoke sessions',
        'Entra ID',
        'Treat the credentials and new session as compromised; follow the identity incident plan.',
        { contain: true },
      ),
      a(
        'purge',
        'Preserve sample; remove matching mail and block URL',
        'Microsoft 365',
        'Scope recipients and use authorized search/remediation; avoid clicking the live link.',
        { requires: 'contain' },
      ),
      a(
        'recover',
        'Reset credentials; check persistence; coach users',
        'IR / KnowBe4',
        'Review MFA, consent and mailbox rules, verify recovery, and reinforce reporting.',
        { requires: 'purge' },
      ),
      a(
        'trap',
        'Trust the email because SPF passed',
        'Mail review',
        'An attacker-controlled domain can pass SPF. Evaluate the actual destination and behavior.',
        { bad: true },
      ),
    ],
    lesson:
      'Mail authentication is only one signal. If credentials were entered, investigate identity compromise as well as the message.',
    recap: 'What does SPF pass tell you, and what does it not tell you?',
    source: 5,
  },
  {
    id: 'training',
    title: 'The suspicious safety drill',
    skill: 'Email',
    severity: 'Low',
    host: 'MAIL-013',
    brief:
      'A reported password-expiry message appears to imitate IT. Nobody reports entering credentials.',
    truth: 'Benign activity',
    evidence: [
      e(
        'KnowBe4',
        'Campaign correlation',
        'Message ID matches approved campaign SIM-419.\nRecipient and delivery timestamp match campaign logs.\nReporting event successfully recorded.',
        'Verify through the training platform, not through branding in the email.',
      ),
      e(
        'Microsoft 365',
        'Message and sign-in review',
        'Simulation link matches the approved campaign configuration.\nNo credential entry reported; no related sign-in anomaly.\nNo other malicious messages found in this scoped review.',
        'A confirmed simulation can look convincing. Check its source independently.',
      ),
      e(
        'Service desk',
        'Program owner verification',
        'Security awareness owner confirms SIM-419 is scheduled.\nPolicy: thank reporters and provide short feedback.',
        'Positive reinforcement builds a useful reporting culture.',
      ),
    ],
    actions: [
      a(
        'validate',
        'Match campaign ID, recipient and timestamp',
        'KnowBe4',
        'Validate the reported message against actual campaign records.',
        { contain: true },
      ),
      a(
        'coach',
        'Credit the report and explain the indicators',
        'KnowBe4',
        'Close as an authorized simulation and reinforce good reporting.',
        { requires: 'validate' },
      ),
      a(
        'trap',
        'Punish the user for raising a false alarm',
        'Service desk',
        'Blame suppresses future reporting and damages trust.',
        { bad: true },
      ),
      a(
        'trap2',
        'Disable the entire tenant',
        'Entra ID',
        'A verified exercise does not justify broad disruption.',
        { bad: true },
      ),
    ],
    lesson:
      'Recognize approved simulations through records, and reward the behavior you want users to repeat.',
    recap:
      'How would you respond to an employee who repeatedly reports suspicious emails?',
    source: 5,
  },
];
scenarios.push(
  {
    id: 'vuln',
    title: 'The highest score is not first',
    skill: 'Vulnerability',
    severity: 'High',
    host: 'EDGE-001',
    brief:
      'A scan returns multiple findings. Choose what to fix first without causing an unplanned outage. Findings are fictional training records, not real CVEs.',
    truth: 'Configuration risk',
    evidence: [
      e(
        'Vulnerability scanner',
        'Findings',
        'A · CVSS 9.8 · lab server · isolated segment · no known exploitation\nB · CVSS 8.1 · internet-facing gateway · active exploitation reported\nC · CVSS 7.5 · internal kiosk · compensating controls',
        'Severity scores alone do not determine priority. Exposure, exploitation and business impact change urgency.',
      ),
      e(
        'Asset inventory',
        'Service dependencies',
        'Gateway B provides remote access for all three sites.\nApproved mitigation available: restrict exposed admin interface.\nPatch requires maintenance and rollback plan.',
        'Mitigate immediate exposure while coordinating a safe permanent fix.',
      ),
      e(
        'Change desk',
        'Validation plan',
        'Owner confirms affected version on B.\nConfig backup available.\nTest group and rollback criteria defined.\nRescan must use authenticated checks where supported.',
        'Validate applicability and verify remediation after the change.',
      ),
    ],
    actions: [
      a(
        'mitigate',
        'Prioritize B; restrict exposed management access',
        'Network controls',
        'Address the known exploited, exposed gateway using the authorized temporary mitigation.',
        { contain: true },
      ),
      a(
        'patch',
        'Schedule tested patch with owner and rollback',
        'Change desk',
        'Apply a validated patch with business coordination and a recovery plan.',
        { requires: 'mitigate' },
      ),
      a(
        'verify',
        'Rescan and verify service functionality',
        'Vulnerability scanner',
        'Confirm the vulnerability is remediated and remote access still works.',
        { requires: 'patch' },
      ),
      a(
        'trap',
        'Patch isolated A first solely for its CVSS',
        'Vulnerability scanner',
        'A higher raw score can be lower practical risk than an actively exploited perimeter flaw.',
        { bad: true },
      ),
    ],
    lesson:
      'Prioritize using exploit activity, exposure, asset criticality and controls; rescan after remediation.',
    recap: 'How would you prioritize 100 vulnerability findings?',
    source: 7,
  },
  {
    id: 'scan',
    title: 'A suspiciously clean scan',
    skill: 'Vulnerability',
    severity: 'Medium',
    host: 'SRV-033',
    brief:
      'A Windows Server scan reports no critical findings. The security lead questions whether the result is trustworthy.',
    truth: 'Configuration risk',
    evidence: [
      e(
        'Vulnerability scanner',
        'Scan quality',
        'Authenticated checks: FAILED\nCredential error: access denied\nReachable hosts: 3 of expected 24\nJob status: completed',
        'Job completion does not mean full coverage or successful authentication.',
      ),
      e(
        'Windows Server',
        'Access review',
        'Service account expired yesterday.\nScan source is missing from approved management ACL.\nInventory lists 24 in-scope servers.',
        'Fix scan access within least-privilege requirements and the approved scope.',
      ),
      e(
        'Change desk',
        'Assessment authorization',
        'Approved internal assessment only.\nNo third-party or out-of-scope systems.\nMaintenance window available for a controlled rescan.',
        'Validate scope and impact before running an assessment.',
      ),
    ],
    actions: [
      a(
        'scope',
        'Reconcile inventory, scope and scan coverage',
        'Vulnerability scanner',
        'Treat this as a coverage gap, not evidence of low risk.',
        { contain: true },
      ),
      a(
        'access',
        'Restore approved credentials and scoped ACL',
        'Windows Server',
        'Use the authorized account and network path; do not disable security controls globally.',
        { requires: 'scope' },
      ),
      a(
        'verify',
        'Rescan; confirm authentication and host coverage',
        'Vulnerability scanner',
        'Verify both coverage and authenticated checks before publishing risk results.',
        { requires: 'access' },
      ),
      a(
        'trap',
        'Report zero critical risk to the client',
        'Reporting',
        'Incomplete telemetry cannot support a clean bill of health.',
        { bad: true },
      ),
    ],
    lesson:
      'Validate the quality of the assessment itself. Track authentication, reachability, exclusions and inventory coverage.',
    recap: 'What would make you distrust a vulnerability scan result?',
    source: 7,
  },
  {
    id: 'ztna',
    title: 'Access denied, deadline approaching',
    skill: 'Network',
    severity: 'Medium',
    host: 'MAC-017',
    brief:
      'A contractor on macOS cannot reach a project app through Timus. Their manager requests an urgent exception.',
    truth: 'Configuration risk',
    evidence: [
      e(
        'Timus',
        'Access decision',
        'Identity: contractor · correct app group\nMFA: passed\nDevice posture: disk encryption disabled\nPolicy result: deny app access',
        'Authentication and authorization are different. A valid identity does not guarantee a compliant device.',
      ),
      e(
        'Intune / macOS',
        'Device compliance',
        'MAC-017 is enrolled.\nDisk encryption remediation is pending user action.\nManaged compliant loan device is available.',
        'Restore compliance or use an approved alternative; avoid weakening global posture requirements.',
      ),
      e(
        'Client ticket',
        'Business constraints',
        'App contains confidential client documents.\nManager can approve a loan device.\nGlobal posture bypass is not authorized.',
        'Consider a safe route to productivity while preserving the security requirement.',
      ),
    ],
    actions: [
      a(
        'route',
        'Offer approved compliant loan device',
        'Service desk',
        'Provide continuity without exposing the app to a noncompliant device.',
        { contain: true },
      ),
      a(
        'fix',
        'Remediate encryption; sync and recheck posture',
        'Intune / Timus',
        'Coordinate the macOS fix, verify compliance reporting and retry scoped access.',
        { requires: 'route' },
      ),
      a(
        'trap',
        'Disable posture checks for every user',
        'Timus',
        'A global bypass weakens controls far beyond this ticket.',
        { bad: true },
      ),
      a(
        'trap2',
        'Grant contractor tenant administrator',
        'Entra ID',
        'Administrative privileges do not solve device posture and violate least privilege.',
        { bad: true },
      ),
    ],
    lesson:
      'Zero trust combines identity, device health and resource policy. Troubleshoot the failed condition rather than weakening the entire policy.',
    recap:
      'A valid user passes MFA but cannot access an app. What would you investigate?',
    source: 6,
  },
  {
    id: 'firewall',
    title: 'The emergency any-any rule',
    skill: 'Network',
    severity: 'High',
    host: 'FW-002',
    brief:
      'A vendor asks to open access to a server. You have authority to prepare a change; implementation requires the named owner’s approval.',
    truth: 'Configuration risk',
    evidence: [
      e(
        'Firewall',
        'Requested rule',
        'Vendor request: ANY source → server subnet → ANY port\nActual need: 203.0.113.18 → 10.20.4.12 TCP/443\nDuration: 2 hours\nDefault deny rule follows',
        'Translate a business need into exact source, destination, service and duration.',
      ),
      e(
        'Network inventory',
        'Routing and segmentation',
        'Server 10.20.4.12 is in application VLAN 40.\nManagement VLAN 10 is unrelated.\nReturn route and application listener verified.',
        'Opening a firewall is not a substitute for checking routing and the destination service.',
      ),
      e(
        'Change desk',
        'Approval and rollback',
        'Owner: infrastructure lead\nApproval pending for a scoped plan\nRequired: config backup, test source, rule expiry and rollback on failed health checks',
        'Changes need authorization, validation and an exit plan.',
      ),
    ],
    actions: [
      a(
        'plan',
        'Prepare scoped TCP/443 rule with expiry',
        'Firewall',
        'Limit the rule to the verified vendor and application, and include rollback steps.',
        { contain: true },
      ),
      a(
        'approve',
        'Obtain owner approval; back up configuration',
        'Change desk',
        'In this simulation the owner now approves the scoped plan. Approval is not implied by urgency.',
        { requires: 'plan' },
      ),
      a(
        'apply',
        'Apply; test permitted and denied traffic; log change',
        'Firewall',
        'Verify the expected path and continued segmentation, then track rule expiry.',
        { requires: 'approve' },
      ),
      a(
        'trap',
        'Apply the vendor’s ANY-to-ANY request',
        'Firewall',
        'A broad rule exposes unrelated systems and exceeds the approved need.',
        { bad: true },
      ),
    ],
    lesson:
      'A good change is scoped, approved, testable, time-bounded where appropriate, and reversible.',
    recap: 'How do you safely handle an urgent firewall change?',
    source: 0,
  },
  {
    id: 'dns',
    title: 'Online, but nothing resolves',
    skill: 'Network',
    severity: 'Medium',
    host: 'WS-052',
    brief:
      'A Windows workstation has network connectivity but cannot open internal applications after a network change.',
    truth: 'Configuration risk',
    evidence: [
      e(
        'Windows console',
        'ipconfig /all',
        'IPv4: 10.20.4.52 /24\nGateway: 10.20.4.1\nDNS servers: 203.0.113.53\nDHCP enabled: yes\nExpected internal resolver: 10.20.0.10',
        'The device has an address; inspect resolver configuration before assuming a general outage.',
      ),
      e(
        'Windows console',
        'Resolution and reachability',
        'Gateway reachable.\nApplication IP reachable on required port.\nnslookup app.client.example → NXDOMAIN\nnslookup app.client.example 10.20.0.10 → 10.20.4.12',
        'Differentiate DNS resolution from IP connectivity using an approved known resolver.',
      ),
      e(
        'Switch / DHCP',
        'Configuration audit',
        'VLAN assignment correct.\nDHCP option 006 changed to an external resolver.\nApproved rollback restores 10.20.0.10.',
        'Fix the source configuration so clients receive the correct setting after renewal.',
      ),
    ],
    actions: [
      a(
        'diagnose',
        'Compare DNS results with IP reachability',
        'Windows',
        'The evidence identifies name resolution rather than an application port block.',
        { contain: true },
      ),
      a(
        'fix',
        'Restore approved DHCP DNS setting; renew lease',
        'DHCP',
        'Correct option 006 under the change plan and refresh client configuration.',
        { requires: 'diagnose' },
      ),
      a(
        'verify',
        'Verify internal resolution and application access',
        'Windows',
        'Validate the user outcome and document the root cause.',
        { requires: 'fix' },
      ),
      a(
        'trap',
        'Disable the firewall and all endpoint security',
        'Windows',
        'The evidence points to DNS. Disabling unrelated controls creates risk without addressing the cause.',
        { bad: true },
      ),
    ],
    lesson:
      'Troubleshoot by layer: address, route, resolver, port and application. Test a specific hypothesis.',
    recap:
      'A user can reach an IP but not a hostname. Walk through your troubleshooting.',
    source: 8,
  },
);
scenarios.push(
  {
    id: 'oauth',
    title: 'The app that asked for too much',
    skill: 'Identity',
    severity: 'High',
    host: 'CLOUD-009',
    brief:
      'Blackpoint escalates a newly consented cloud app with mail permissions. The owner does not recognize the app.',
    truth: 'Confirmed compromise',
    evidence: [
      e(
        'Entra ID',
        'Consent audit',
        'App: Document Productivity Helper\nPublisher: unverified\nPermissions: Mail.Read, offline_access\nConsent followed an external document link\nUser denies intentionally approving the app',
        'Investigate both consent and use; permissions may expose mail independently of a password.',
      ),
      e(
        'Microsoft 365',
        'Activity correlation',
        'New app accessed mailbox after consent.\nNo approved application record.\nNo mailbox forwarding rule created.\nData access extent is still under investigation.',
        'Absence of inbox rules does not exclude cloud persistence or data access.',
      ),
      e(
        'Blackpoint MDR',
        'Response status',
        'SOC confirms unauthorized application access.\nApp not yet blocked.\nClient plan authorizes app and identity containment.\nPreserve consent and access logs.',
        'Determine which actions are complete before coordinating further response.',
      ),
    ],
    actions: [
      a(
        'contain',
        'Disable app access; revoke grant and user sessions',
        'Entra ID',
        'Remove the unauthorized access path and contain the affected identity.',
        { contain: true },
      ),
      a(
        'scope',
        'Preserve audit logs; scope users and accessed data',
        'Microsoft 365',
        'Determine other grants, affected identities and observed mailbox access.',
        { requires: 'contain' },
      ),
      a(
        'recover',
        'Review credentials/MFA; verify approved access',
        'IR',
        'Restore only legitimate access, monitor recurrence and improve consent controls.',
        { requires: 'scope' },
      ),
      a(
        'trap',
        'Only change the mailbox password',
        'Microsoft 365',
        'Password changes alone do not remove unauthorized application consent.',
        { bad: true },
      ),
    ],
    lesson:
      'Cloud persistence can exist in application grants as well as passwords and mailbox rules.',
    recap:
      'How can a malicious OAuth application retain access after a password change?',
    source: 2,
  },
  {
    id: 'mac',
    title: 'The update that was not an update',
    skill: 'Endpoint',
    severity: 'High',
    host: 'MAC-025',
    brief:
      'A macOS user installed a browser update from a pop-up. EDR observes persistence and outbound traffic.',
    truth: 'Confirmed compromise',
    evidence: [
      e(
        'SentinelOne',
        'macOS process activity',
        'Browser → downloaded installer → unsigned executable\nNew LaunchAgent entry\nRepeated connection to 198.51.100.81\nNetwork isolation: off',
        'Correlate the user’s action with execution, persistence and network behavior.',
      ),
      e(
        'macOS',
        'Host context',
        'MAC-025 · managed endpoint\nUser confirms unapproved install\nRelevant execution logs available\nNo validated Windows-style rollback capability for this host',
        'Do not assume a Windows recovery mechanism applies to macOS.',
      ),
      e(
        'Blackpoint MDR',
        'Incident scope',
        'Client playbook authorizes host isolation.\nNo other endpoints confirmed.\nPreserve installer hash and LaunchAgent details; hunt for matches.',
        'Preserve and scope before destructive recovery.',
      ),
    ],
    actions: [
      a(
        'isolate',
        'Isolate affected Mac under the response plan',
        'SentinelOne',
        'Contain outbound access and potential spread.',
        { contain: true },
      ),
      a(
        'clean',
        'Preserve evidence; remediate process and persistence',
        'SentinelOne / macOS',
        'Coordinate removal of the malicious components and investigate credential exposure.',
        { requires: 'isolate' },
      ),
      a(
        'recover',
        'Validate clean recovery or approved reimage',
        'IR',
        'Use supported recovery options, verify business function and monitor before reconnecting.',
        { requires: 'clean' },
      ),
      a(
        'trap',
        'Assume Windows rollback restores this Mac',
        'SentinelOne',
        'Platform-specific recovery features cannot be assumed to exist on another OS.',
        { bad: true },
      ),
    ],
    lesson:
      'Carry the incident-response process across operating systems, but verify each platform’s telemetry and recovery capabilities.',
    recap:
      'What changes when investigating malware on macOS instead of Windows?',
    source: 3,
  },
  {
    id: 'handoff',
    title: 'Resolved is not documented',
    skill: 'Communication',
    severity: 'Medium',
    host: 'TICKET-062',
    brief:
      'A teammate contained an incident near the end of the shift. Their ticket says only fixed. The next analyst needs a defensible handoff.',
    truth: 'Documentation gap',
    evidence: [
      e(
        'Ticket history',
        'Current record',
        'Ticket: endpoint malware on WS-062\nComment: fixed\nNo timeline, scope, containment result or recovery validation\nClient update missing',
        'A resolution claim without evidence cannot support a safe handoff.',
      ),
      e(
        'SentinelOne / MDR',
        'Actual response state',
        '11:02 UTC · WS-062 isolated\n11:06 UTC · threat remediation completed\n11:09 UTC · peer review not yet complete\nRecovery and reconnect approval: pending',
        'Distinguish actions taken from outcomes verified and work still pending.',
      ),
      e(
        'Client ticket',
        'Business impact',
        'One user is working on a loan device.\nNext owner: evening analyst\nNext client update due at 12:00 UTC\nClient asks whether other devices are affected',
        'Communicate what is known, unknown and being done next. Do not invent assurances.',
      ),
    ],
    actions: [
      a(
        'verify',
        'Reconstruct evidence, scope and UTC timeline',
        'Ticket desk',
        'Verify the record against actual tool outcomes.',
        { contain: true },
      ),
      a(
        'handoff',
        'Assign owner, pending checks and next update',
        'Ticket desk',
        'Keep recovery and scope review open with explicit accountability.',
        { requires: 'verify' },
      ),
      a(
        'kb',
        'Write reusable SOP with scope and verification',
        'Knowledge base',
        'Capture prerequisites, authority, evidence, steps, rollback/escalation and validation.',
        { requires: 'handoff' },
      ),
      a(
        'trap',
        'Tell the client no data was lost',
        'Client comms',
        'The available evidence does not establish the absence of data loss.',
        { bad: true },
      ),
    ],
    lesson:
      'A strong handoff includes timeline, affected assets, evidence, actions and outcomes, unknowns, owner and next update.',
    recap:
      'Give a nontechnical client update for an incident that is contained but still being investigated.',
    source: 1,
  },
);
export const skills = [...new Set(scenarios.map((s) => s.skill))];
export type CaseState = {
  template: string;
  client: number;
  id: string;
  reads: number[];
  done: string[];
  mistakes: number;
  pressure: number;
  closed: boolean;
  score: number;
  result?: string;
  notes?: string;
  communication?: number;
  clientUpdate?: string;
  clientUpdateWhy?: string;
  clientUpdateVersion?: number;
};
export type Run = {
  seed: number;
  mode: string;
  role: string;
  totalScore: number;
  totalClosed: number;
  cases: CaseState[];
  selected: number;
  turn: number;
  trust: number;
  credits: number;
  upgrade: string;
  phase: 'play' | 'reward' | 'finished';
  wave: number;
  log: string[];
};
export type ShiftQueue = Pick<Run, 'seed' | 'mode' | 'wave'> & {
  cases: Pick<CaseState, 'template'>[];
};
export function rng(seed: number) {
  let x = seed >>> 0;
  return () => {
    x = (Math.imul(1664525, x) + 1013904223) >>> 0;
    return x / 4294967296;
  };
}
function drawScenarios(seed: number, wave: number, focus = 'All') {
  const random = rng(seed + wave * 19);
  const order = scenarios.filter((s) => focus === 'All' || s.skill === focus);
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  return { random, order };
}
// Keep the unique slots in place; replace repeats without consuming another
// slot's scenario. Used for both new queues and untouched legacy incidents.
export function deduplicateRun(
  run: Run,
  history: ShiftQueue[],
  protect: (c: CaseState) => boolean = () => false,
): Run {
  if (!['Guided', 'Veteran'].includes(run.mode) || run.wave < 2 || run.wave > 3)
    return run;
  const seen = new Set(history
    .filter(h => h.seed === run.seed && h.mode === run.mode && h.wave < run.wave)
    .flatMap(h => h.cases.map(c => c.template)));
  const reserved = new Set(run.cases.map(c => c.template));
  const candidates = drawScenarios(run.seed, run.wave).order;
  let changed = false;
  const cases = run.cases.map((c, index) => {
    if (!seen.has(c.template) || protect(c)) {
      seen.add(c.template);
      return c;
    }
    const replacement = candidates.find(s => !seen.has(s.id) && !reserved.has(s.id));
    if (!replacement) return c;
    seen.add(replacement.id);
    changed = true;
    // Give the replacement its own identity so an older backup cannot attach
    // the repeated scenario's notes or answers to this different incident.
    return { ...c, id: `${run.seed}-${run.wave}-${replacement.id}-${index}`, template: replacement.id };
  });
  return changed ? { ...run, cases } : run;
}
export function newRun(
  seed: number,
  mode: string,
  role: string,
  focus = 'All',
  wave = 1,
  history: ShiftQueue[] = [],
): Run {
  // A previous Practice selection must not narrow a full campaign's pool.
  if (mode !== 'Practice') focus = 'All';
  const draw = drawScenarios(seed, wave, focus), r = draw.random;
  let order = draw.order;
  if (mode === 'Guided' && wave === 1 && focus === 'All')
    order = [scenarios[0], scenarios[5], scenarios[8], scenarios[10]];
  const run: Run = {
    seed,
    mode,
    role,
    totalScore: 0,
    totalClosed: 0,
    cases: Array.from({ length: mode === 'Practice' ? 1 : 4 }, (_, i) => ({
      template: order[i % order.length].id,
      client: Math.floor(r() * 3),
      id: `${seed}-${wave}-${i}`,
      reads: [],
      done: [],
      mistakes: 0,
      pressure: 10 + Math.floor(r() * 15),
      closed: false,
      score: 0,
    })),
    selected: 0,
    turn: 0,
    trust: 100,
    credits: 0,
    upgrade: '',
    phase: 'play',
    wave,
    log: ['Shift started. Review evidence before making a call.'],
  };
  if (focus !== 'All' || !['Guided', 'Veteran'].includes(mode) || wave < 2 || wave > 3)
    return run;
  const previous = Array.from({ length: wave - 1 }, (_, i) =>
    history.find(h => h.seed === seed && h.mode === mode && h.wave === i + 1)
      || newRun(seed, mode, role, focus, i + 1, history));
  return deduplicateRun(run, previous);
}
export const clients = [
  {
    name: 'Summit Architecture',
    tag: 'DESIGN / 84 USERS',
    impact: 'Project deadlines depend on file and remote access.',
  },
  {
    name: 'Aspen Legal',
    tag: 'LEGAL / 46 USERS',
    impact:
      'Confidential client matters require careful scope and preservation.',
  },
  {
    name: 'Bridgeway Community',
    tag: 'NONPROFIT / 62 USERS',
    impact: 'Keep service delivery running with minimal interruption.',
  },
];
export function template(c: CaseState) {
  return scenarios.find((s) => s.id === c.template)!;
}
export function tick(run: Run, index: number, free = false): Run {
  if (free || run.mode === 'Practice') return run;
  let trust = run.trust;
  const cases = run.cases.map((c, i) => {
    if (
      c.closed ||
      c.done.some((id) => template(c).actions.find((a) => a.id === id)?.contain)
    )
      return c;
    const speed = run.mode === 'Veteran' ? 7 : 4;
    const growth = i === index ? speed : speed - 1;
    const pressure = Math.min(
      100,
      c.pressure + growth - (run.upgrade === 'watch' ? 1 : 0),
    );
    if (pressure >= 85) trust -= 2;
    return { ...c, pressure };
  });
  return { ...run, turn: run.turn + 1, cases, trust: Math.max(0, trust) };
}
export function readEvidence(run: Run, index: number): Run {
  const c = run.cases[run.selected];
  if (c.closed || c.reads.includes(index) || !template(c).evidence[index])
    return run;
  const free = run.role === 'Investigator' && c.reads.length === 0;
  const next = {
    ...run,
    cases: run.cases.map((x, i) =>
      i === run.selected ? { ...x, reads: [...x.reads, index] } : x,
    ),
  };
  return tick(next, run.selected, free);
}
export function perform(run: Run, id: string): Run {
  const c = run.cases[run.selected],
    s = template(c),
    a = s.actions.find((a) => a.id === id);
  if (!a || c.closed || c.done.includes(id)) return run;
  let message = '',
    mistake = false;
  if (a.requires && !c.done.includes(a.requires)) {
    message = `Sequence issue: ${a.label}. Complete ${s.actions.find((x) => x.id === a.requires)?.label} first. No change applied.`;
    mistake = true;
  } else if (a.bad) {
    message = `Unsafe decision: ${a.why}`;
    mistake = true;
  } else if (c.reads.length < 2) {
    message =
      'Insufficient context: review at least two evidence sources before applying a response. No change applied.';
    mistake = true;
  } else {
    message = `Completed: ${a.label}. ${a.why}`;
  }
  const penalty = run.role === 'Communicator' ? 5 : 8;
  const next = {
    ...run,
    trust: Math.max(0, run.trust - (mistake ? penalty : 0)),
    log: [message, ...run.log].slice(0, 18),
    cases: run.cases.map((x, i) =>
      i === run.selected
        ? {
            ...x,
            mistakes: x.mistakes + (mistake ? 1 : 0),
            done: mistake ? x.done : [...x.done, id],
            pressure:
              !mistake && a.contain ? Math.max(0, x.pressure - 25) : x.pressure,
          }
        : x,
    ),
  };
  return tick(
    next,
    run.selected,
    run.role === 'Responder' && !mistake && !!a.contain,
  );
}
export function closeCase(
  run: Run,
  disposition: string,
  comms: number,
  note: string,
): Run {
  const c = run.cases[run.selected];
  if (c.closed) return run;
  const s = template(c),
    required = s.actions.filter((a) => !a.bad),
    coverage =
      required.filter((a) => c.done.includes(a.id)).length / required.length;
  const score = Math.max(
    0,
    Math.round(
      coverage * 45 +
        (c.reads.length / 3) * 20 +
        (disposition === s.truth ? 20 : 0) +
        (comms === 0 ? 15 : 0) -
        c.mistakes * 8,
    ),
  );
  const next = {
    ...run,
    totalScore: run.totalScore + score,
    totalClosed: run.totalClosed + 1,
    trust: Math.max(
      0,
      run.trust - (score < 60 ? 12 : 0) - (comms === 0 ? 0 : 8),
    ),
    credits: run.credits + Math.floor(score / 20),
    cases: run.cases.map((x, i) =>
      i === run.selected
        ? {
            ...x,
            closed: true,
            score,
            result: disposition,
            notes: note,
            communication: comms === 0 ? 15 : 0,
            clientUpdate:clientUpdates(c,required.map(a=>a.id))[comms]?.text,
            clientUpdateWhy:clientUpdates(c,required.map(a=>a.id))[comms]?.why,
            clientUpdateVersion:2,
          }
        : x,
    ),
    log: [
      `Case closed: ${score}/100. ${disposition === s.truth ? 'Classification correct.' : 'Classification missed: ' + s.truth + '.'} ${comms === 0 ? 'Client update fits the incident evidence and response state.' : 'Avoid blame or unsupported certainty in client updates.'}`,
      ...run.log,
    ].slice(0, 18),
  };
  return {
    ...next,
    phase: next.cases.every((x) => x.closed)
      ? run.wave === 3 || run.mode === 'Practice'
        ? 'finished'
        : 'reward'
      : 'play',
  } as Run;
}

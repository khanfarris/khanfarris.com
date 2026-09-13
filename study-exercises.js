/* Small, local learning models. No customer data, external calls, or saved answers. */
((root) => {
  'use strict';
  const ipText = n => [24,16,8,0].map(bits=>Math.floor(n / 2 ** bits) % 256).join('.');
  const cases={
    triage:[
      {id:'maintenance',title:'A scheduled inventory script',evidence:['Device: IT-LAB-04 · 13:00 UTC','Recorded script hash and command match approved change CHG-104.','The owner confirms the exact task and time; reviewed activity stays within that scope.'],question:'Which disposition is best supported?',options:[
        {id:'malicious',label:'Confirmed malicious activity',why:'The reviewed evidence matches authorized work. The suspicious tool name alone does not support a malicious classification.'},
        {id:'benign',label:'Document as authorized activity',why:'The specific command, hash, device, time, and approval agree. Record those checks and use the platform’s benign or expected-activity classification.'},
        {id:'ignore',label:'Ignore all future script alerts',why:'One verified maintenance task does not justify suppressing every script alert. Any tuning should be narrowly scoped and reviewed.'}],answer:'benign'},
      {id:'encryption',title:'Files are changing right now',evidence:['Device: BILLING-02 · 13:06 UTC','EDR records rapid file encryption by an unapproved executable.','Staff cannot open invoices. No containment action has completed.'],question:'What takes priority?',options:[
        {id:'respond',label:'Escalate active harm and begin authorized containment',why:'Current encryption and business impact justify urgent response through the incident procedure. Record action results and investigate scope in parallel.'},
        {id:'routine',label:'Leave it for the next routine scan',why:'The evidence describes active harm. Waiting for routine scanning leaves the affected service and possibly other systems exposed.'},
        {id:'closed',label:'Close because the EDR detected it',why:'Detection did not establish that the behavior stopped. There is no completed containment result in this record.'}],answer:'respond'},
      {id:'offline',title:'A request with no confirmation',evidence:['Device: SALES-08 · 13:12 UTC','Suspicious execution was recorded just before sensor contact stopped.','Isolation status: pending. Execution scope has not been established.'],question:'What can you responsibly conclude?',options:[
        {id:'safe',label:'The offline device is safe',why:'Loss of telemetry is an information gap. The device could still be active on another network.'},
        {id:'false',label:'The alert is a false positive',why:'No evidence here disproves the suspicious execution. Missing follow-up telemetry is not a benign explanation.'},
        {id:'unverified',label:'Containment is unverified; arrange follow-up',why:'Record the last contact and pending isolation. Escalate alternate containment through the response owner and continue the scope review.'}],answer:'unverified'}
    ],
    incident:[
      {id:'active',title:'09:10 · Active activity',evidence:['One laptop is running a confirmed malicious process.','Network communication continues.','The response plan authorizes the responder to isolate this laptop.'],question:'What is the next priority?',options:[
        {id:'contain',label:'Limit the ongoing activity',why:'Use the authorized containment process and verify its result. Preserve relevant evidence and investigate scope alongside the response.'},
        {id:'close',label:'Close the incident',why:'The malicious activity is still running and no containment or recovery evidence exists.'},
        {id:'wait',label:'Wait until every affected asset is known',why:'Perfect scope certainty is not a prerequisite for already-authorized containment of active harm.'}],answer:'contain'},
      {id:'isolated',title:'09:18 · Containment confirmed',evidence:['EDR reports that the laptop’s network isolation completed.','The initial execution timeline has been preserved.','Persistence, affected credentials, and wider scope are still being checked.'],question:'What should happen next?',options:[
        {id:'restore',label:'Reconnect immediately',why:'Containment does not establish that the system is trustworthy or that attacker access has been removed.'},
        {id:'remediate',label:'Continue investigation and remediation',why:'Isolation limits a path. The team still needs to establish scope, remove footholds, and protect any affected access before recovery.'},
        {id:'close',label:'Close because isolation succeeded',why:'The containment action is complete; the incident’s investigation and recovery are not.'}],answer:'remediate'},
      {id:'rebuilt',title:'11:40 · Rebuild completed',evidence:['The scoped laptop was rebuilt and the entry weakness addressed.','Affected credentials were secured; the scope review is documented.','The business application and monitoring checks have not yet run.'],question:'What remains before closure?',options:[
        {id:'done',label:'Nothing; the rebuild is enough',why:'A completed rebuild does not demonstrate that the restored service and monitoring work.'},
        {id:'erase',label:'Delete the investigation record',why:'Keep the evidence and decision record according to the retention procedure. Deleting it is not recovery validation.'},
        {id:'validate',label:'Validate recovery and service operation',why:'Run the agreed health, application, and monitoring checks and obtain the appropriate service-owner confirmation.'}],answer:'validate'},
      {id:'validated',title:'13:20 · Agreed checks complete',evidence:['Investigation scope, remediation, and monitoring results are documented.','The service owner confirms the restored workflow works.','Closure criteria are met; improvement tasks have named owners and dates.'],question:'What is supported now?',options:[
        {id:'closure',label:'Submit for closure under the incident process',why:'This record supports closure review because the agreed evidence and recovery criteria are met. It does not promise that future incidents are impossible.'},
        {id:'never',label:'Keep it open forever because certainty is impossible',why:'Closure uses defined, evidence-based criteria. It does not require proving that no future security event could ever occur.'},
        {id:'invent',label:'Report that no information was ever accessed',why:'The record supports completed criteria, not this separate universal claim about information access.'}],answer:'closure'}
    ],
    phishing:[
      {id:'bank',title:'An authenticated supplier request',evidence:['An established supplier mailbox requests new payment details.','SPF, DKIM, and DMARC pass.','No independent verification of the bank change has occurred.'],question:'What should Finance do next?',options:[
        {id:'pay',label:'Approve because authentication passed',why:'Domain authentication does not establish that the payment instruction is legitimate. A real mailbox can be compromised.'},
        {id:'verify',label:'Verify using the established supplier contact',why:'Use a known independent channel and the payment-change process. Do not rely on the new contact details in the message.'},
        {id:'reply',label:'Ask the same sender whether it is genuine',why:'That reply goes back to the potentially compromised channel and is not independent verification.'}],answer:'verify'},
      {id:'entered',title:'A user reports entering a password',evidence:['The user opened an unexpected payroll link.','They entered their work password on a page later assessed as a credential-harvesting site.','No account-response actions have yet been confirmed.'],question:'What is the appropriate next step?',options:[
        {id:'account',label:'Escalate for prompt account protection and review',why:'Credential submission establishes a concrete exposure. Follow the account-response process, review sessions and authentication, and record completed actions. Password changes alone may not address every existing session.'},
        {id:'delete',label:'Delete the email and finish',why:'Mail removal does not address the submitted credential or possible account access.'},
        {id:'all',label:'Announce that every mailbox is compromised',why:'The record supports exposure of one user’s credentials, not compromise of every account.'}],answer:'account'},
      {id:'unopened',title:'An unexpected QR sign-in request',evidence:['The employee receives an unfamiliar message asking for immediate sign-in through a QR code.','They have not scanned it or entered information.','The request has not been verified through a trusted channel.'],question:'What should the employee do?',options:[
        {id:'scan',label:'Scan it on a personal phone to check',why:'Moving to a personal device does not make an untrusted destination safe and complicates the organization’s investigation.'},
        {id:'compromised',label:'Report a confirmed infection',why:'Receipt alone does not prove that malware executed or an account was compromised.'},
        {id:'report',label:'Report it through the approved channel',why:'Preserve and report the message without interacting with the destination. The analyst can investigate while accurately recording no reported interaction so far.'}],answer:'report'}
    ],
    vulnerability:[
      {id:'exposed',title:'An exposed gateway and a lab finding',evidence:['A · Gateway: affected version, internet exposed, evidence of exploitation in the wild; fictional base score 8.1.','B · Test server: fictional base score 9.8; powered off on an isolated lab network with no production data.','C · Staff laptop: fictional base score 6.5; exploitation needs local access; regular patch work is scheduled.'],question:'Which finding deserves first attention in this snapshot?',options:[
        {id:'lab',label:'B · Always choose the highest base score',why:'Base severity alone misses exposure and threat evidence. Keep B tracked, but A presents the immediate reachable, exploited weakness in this scenario.'},
        {id:'gateway',label:'A · Validate and address the exposed gateway',why:'The affected, reachable gateway and known exploitation make A the strongest immediate priority in this snapshot. Check for exploitation as well as planning remediation.'},
        {id:'laptop',label:'C · Choose the easiest patch',why:'Ease of remediation can affect scheduling, but it does not outweigh the current evidence of urgent risk on A.'}],answer:'gateway'},
      {id:'changed',title:'The environment has changed',evidence:['A · Gateway: vendor remediation applied, running version verified, and post-change checks pass.','B · Former test server: now hosts the production booking service, internet reachable and confirmed affected; fictional base score 9.8.','C · Staff laptop: unchanged; regular patch work remains scheduled.'],question:'Where should the priority move?',options:[
        {id:'server',label:'B · The now-exposed production server',why:'Exposure and business importance changed while A’s remediation was verified. Reassess B promptly, assign ownership, and verify the eventual fix.'},
        {id:'gateway',label:'A · Keep the original ranking forever',why:'A ranking should change when the evidence changes. Monitor A appropriately, but its verified fix changes the current comparison.'},
        {id:'none',label:'None · The last report was already reviewed',why:'A prior review does not cover a newly exposed production service. Vulnerability management is a continuing process.'}],answer:'server'}
    ]
  };
  function caseResult(type,id,choice=null){
    const item=cases[type].find(c=>c.id===id);if(!item)throw Error('Choose a known case.');
    const selected=choice===null?null:item.options.find(o=>o.id===choice);if(choice!==null&&!selected)throw Error('Choose an available decision.');
    return {...item,selected,correct:selected?selected.id===item.answer:null};
  }

  // OSI describes responsibilities; modern Internet protocols do not map one-to-one.
  const osiLayers=[
    {number:1,name:'Physical',verb:'Carry a signal',unit:'Bits carried as signals',address:'Physical interface / medium',internet:'TCP/IP: link',icon:'cable',
      explanation:'The physical layer moves bits across a medium: electrical signals on copper, light in fiber, or radio waves through the air. Before a switch can read a frame, its interface must receive a usable signal.',
      hardware:'Patch cable → network jack → switch interface. A network interface card (NIC), fiber transceiver, antenna, and the physical part of a Wi-Fi access point all belong in this picture.',
      visual:['Laptop NIC','Copper / fiber / radio','Switch jack 4'],
      protocols:[['1000BASE-T','An Ethernet physical standard for 1 Gb/s over suitable twisted-pair copper cabling.'],['10GBASE-SR','A 10 Gb/s Ethernet physical standard using short-range optics and multimode fiber.'],['Wi-Fi radio / PHY','Channel, signal quality, interference, and radio capabilities. IEEE 802.11 also defines link-layer behavior; Wi-Fi spans layers.']],
      ports:'Port 4 here is a physical connector/interface. It is not TCP port 4. Link LEDs, negotiated speed, media type, and interface counters describe this connection.',
      example:'A workstation loses connectivity after a desk move. Its Ethernet adapter reports “media disconnected,” and the expected switch interface has no link.',
      checks:['Trace the cable and confirm the expected wall jack and switch interface.','Inspect link state, adapter status, and negotiated speed; compare with a known-good cable or port under the support procedure.','For Wi-Fi, check association and signal/interference before assuming the cable-oriented example applies.'],
      limit:'A link light means a physical link exists. It does not prove the VLAN, IP address, DNS, or application works.',links:['switching','troubleshooting']},
    {number:2,name:'Data link',verb:'Deliver on the local link',unit:'Frame',address:'MAC address + VLAN context',internet:'TCP/IP: link',icon:'switch',
      explanation:'A frame is a package for local delivery. Ethernet uses source and destination MAC addresses. A switch learns which source MAC lives behind each interface in a VLAN, then looks up the destination MAC to decide where to forward.',
      hardware:'The switching function of a managed switch, a bridge, the bridging function of an access point, and the MAC function of a NIC. One physical device can perform several layers’ jobs.',
      visual:['Port 4 · laptop','VLAN 10 · MAC table','Port 24 · uplink'],
      protocols:[['Ethernet / IEEE 802.3','Ethernet framing and addressing; the standard also includes physical-layer specifications.'],['802.1Q / VLANs','VLAN identification and bridging. Access and trunk configuration determine where frames can travel.'],['STP / RSTP','Spanning Tree protocols control redundant forwarding paths to help prevent Layer 2 loops.'],['ARP · boundary case','Resolves an IPv4 next-hop address to a link-layer address. ARP is carried directly in Ethernet, without TCP or UDP. Think of it as the bridge between IP and local delivery.']],
      ports:'Switch interface 4 can be configured as an access port in VLAN 10. Interface 24 might be an access port or a trunk. Those are physical/logical switch interfaces, not application service ports.',
      example:'A replacement laptop is plugged into interface 4. Link is up, but the interface is accidentally assigned to the guest VLAN instead of the staff VLAN.',
      checks:['Find the laptop’s MAC in the switch table and verify the interface and VLAN.','Check access/trunk settings, expected allowed VLANs, STP state, and interface errors.','Compare the endpoint’s ARP cache with the expected next hop; ARP and a switch MAC table answer different questions.'],
      limit:'Being on the same switch does not mean being in the same VLAN. IPv6 uses Neighbor Discovery over ICMPv6, not ARP.',links:['switching','vlans','arp']},
    {number:3,name:'Network',verb:'Choose a path between networks',unit:'IP packet',address:'IPv4 / IPv6 address + prefix',internet:'TCP/IP: internet',icon:'router',
      explanation:'IP gives a packet a source and destination address. Routing chooses the next hop toward the destination network. Your laptop uses its subnet and route table to decide whether to deliver locally or send toward a gateway.',
      hardware:'A router, the routing function of a Layer 3 switch, or the routed interfaces of a firewall. A switch can both switch frames and route packets when configured for those functions.',
      visual:['10.20.10.0/24','Router · route table','192.0.2.0/24'],
      protocols:[['IPv4 / IPv6','Addressing and routed delivery. Routers examine the destination and select a matching route.'],['ICMP / ICMPv6','Control and diagnostic messages, including echo requests and some delivery errors. Ping normally uses ICMP, not TCP.'],['IP protocol numbers','Examples: 1 = ICMP, 6 = TCP, 17 = UDP, 58 = ICMPv6. These identify the carried protocol; they are not port numbers.']],
      ports:'There are no TCP/UDP port fields in an IP header. A “Layer 3 port” usually means a routed interface with an IP configuration. TCP destination port 443 is inside the transport header carried by an IP packet.',
      example:'Staff can reach their local printer but cannot reach a server in another subnet. The workstation’s default gateway is wrong.',
      checks:['Compare IP address, prefix/subnet mask, and default gateway with the intended network.','Inspect the route table and next hop; check both the outward and return paths.','Use ping or a route trace as evidence, while allowing for devices that filter or limit diagnostic responses.'],
      limit:'A route provides a possible path, not permission to use it. A failed ping does not prove that the host is down.',links:['subnetting','routing','private-addressing']},
    {number:4,name:'Transport',verb:'Deliver to a service endpoint',unit:'TCP segment / UDP datagram',address:'TCP or UDP source + destination ports',internet:'TCP/IP: transport',icon:'socket',
      explanation:'A host runs many network services at once. Transport ports help the operating system deliver received data to the appropriate socket. TCP supplies an ordered, reliable byte stream; UDP sends datagrams without providing that same delivery guarantee.',
      hardware:'TCP and UDP run in endpoint network stacks. Stateful firewalls and load balancers often inspect transport flows; those products can also perform work at other layers.',
      visual:['Client TCP 51514','Connection / flow','Server TCP 443'],
      protocols:[['TCP','Connection establishment, sequence numbers, acknowledgments, retransmission, and flow control. A SYN starts a connection attempt; a reset is a different result from silence.'],['UDP','Independent datagrams. Applications may add their own reliability; QUIC builds secure, reliable streams over UDP.'],['A typical five-tuple','Source IP, destination IP, transport protocol, source port, destination port. TCP 53 and UDP 53 are different transport endpoints.']],
      ports:'The client commonly chooses a temporary source port, such as 51514, and contacts a service port, such as TCP 443. These numbers are software identifiers, not holes in a switch. The reference below lists application protocols and their usual transport endpoints.',
      example:'A file server is reachable by IP, but an approved test to TCP 445 fails and a matching firewall deny log records that flow.',
      checks:['Confirm the intended service, destination IP, transport, and port.','Compare listener state and firewall/connection logs for that specific flow.','A Windows Test-NetConnection check can test a TCP port; it does not perform a full login or a generic UDP service test.'],
      limit:'An open TCP connection does not prove that TLS, authentication, file permissions, or the application works. A port number alone does not prove which application is using it.',links:['tcp','firewalls','file-shares']},
    {number:5,name:'Session',verb:'Manage an ongoing conversation',unit:'Session-related data / state',address:'Session context, not a universal port',internet:'TCP/IP: usually application',icon:'session',
      explanation:'The session layer describes managing a dialogue: starting it, keeping context, coordinating exchanges, and ending or resuming it. In modern applications, these responsibilities are often implemented inside the application or its libraries.',
      hardware:'There is no required “Layer 5 box.” Client and server software hold conversation state. An application session can outlive one TCP connection, and a working TCP connection does not mean the login session is still valid.',
      visual:['Signed-in client','Session context','Application server'],
      protocols:[['SMB session · example of the responsibility','A client establishes authenticated context for file access. SMB is an application protocol; this session function does not reclassify all of SMB as Layer 5.'],['RPC conversations','Remote Procedure Call lets software request work from another system. Implementations manage conversation context; actual protocol and port behavior depends on the implementation.'],['Web session tokens','A server may use a token or cookie to recognize a continuing session. This is a modern analogy to session responsibilities, not a separate mandatory OSI header.']],
      ports:'There is no universal session-layer port. For a Windows SMB session, the SMB traffic commonly uses TCP 445 at Layer 4. A web session may travel inside HTTPS. Look up the actual application and transport.',
      example:'The portal still loads over a working TLS connection, but the server records “session expired” and asks the employee to sign in again.',
      checks:['Check the exact application error and session expiration/revocation records.','Distinguish a dropped network connection from an expired login or lost application context.','Use the supported reauthentication or reconnect flow; record whether the user’s work can resume.'],
      limit:'This is a responsibility-based lens. In a packet capture, you will not necessarily see a separate item labeled “OSI Layer 5.”',links:['identity','file-shares']},
    {number:6,name:'Presentation',verb:'Represent and protect data',unit:'Encoded / transformed data',address:'Format, encoding, cryptographic context',internet:'TCP/IP: usually application',icon:'lock',
      explanation:'Presentation asks whether both sides can interpret the data: its encoding, structure, compression, and protection. For example, text must use an agreed encoding, and encrypted bytes need the correct cryptographic processing before an application can read them.',
      hardware:'Usually software libraries in the endpoints; proxies and security appliances may also transform or terminate protected traffic. These are functions, not a dedicated category of Layer 6 hardware.',
      visual:['Readable content','Encode / protect','Transmitted bytes'],
      protocols:[['UTF-8 / JSON / JPEG','Examples of encoding, structured data, and image representation. These are formats, not all transport protocols.'],['TLS · a useful analogy','TLS protects application data and authenticates peers as configured. It illustrates presentation-like work but is an Internet protocol, not a literal one-to-one implementation of OSI Layer 6.'],['Encryption can appear elsewhere','MACsec protects link-layer traffic; IPsec protects IP traffic. “Encrypted” does not automatically mean Layer 6.']],
      ports:'TLS does not have one universal port. HTTPS commonly uses TCP 443; syslog over TLS commonly uses TCP 6514. With HTTP/3, TLS is integrated into QUIC over UDP. The application and transport determine the endpoint.',
      example:'The TCP connection to a portal succeeds, but certificate validation reports a hostname mismatch. Replacing the switch cable will not fix that mismatch.',
      checks:['Read the exact TLS/certificate error and confirm the hostname, system time, trust chain, and certificate validity.','For unreadable content, compare expected encoding or format with what was received.','Use the approved certificate/configuration fix; do not teach users to bypass certificate warnings.'],
      limit:'TLS limits what a passive network capture can reveal. Metadata and endpoint logs may still help, but encryption is not proof that the destination or content is safe.',links:['tls','syslog']},
    {number:7,name:'Application',verb:'Request a network service',unit:'Application message / data',address:'Names and service-specific identifiers',internet:'TCP/IP: application',icon:'app',
      explanation:'Application protocols define what clients and services say to each other: ask DNS for an address, request a web page, transfer a file, or send a log. This layer is the network service interface, not simply whatever is visible on your screen.',
      hardware:'Client and server software: a DNS service on Windows Server, a web service, an SMB file service, a mail service, or a log collector. One server may host several application protocols.',
      visual:['Client request','Protocol meaning','Service response'],
      protocols:[['DNS / DHCP','DNS resolves names and other records; DHCP leases network configuration. Both are application protocols even though they help a network operate.'],['HTTP / SMB / SMTP','Web requests, Windows file sharing, and email transfer. Successful transport does not guarantee successful authorization or a valid application response.'],['LDAP / Kerberos / RDP / SSH','Directory queries, authentication, remote desktop, and secure remote access. Recognize their purpose before memorizing their port numbers.'],['Syslog / SNMP / NTP','Log messages, device monitoring, and time synchronization. These support everyday investigation and troubleshooting.']],
      ports:'Use the service reference below. The protocol’s meaning belongs here; its TCP/UDP port numbers belong to Layer 4. “DNS uses port 53” is shorthand, not a claim that DNS is a Layer 4 protocol.',
      example:'The payroll site returns HTTP 403 after a successful TCP/TLS connection. The employee reached the web service; the next check concerns the response and authorization path.',
      checks:['Read the application response or error, using the exact time, user, and requested resource.','Separate name-resolution failures, service failures, authentication failures, and permission denials.','Correlate endpoint, server, identity, and security logs; a suspicious domain or successful login alone is not a complete incident story.'],
      limit:'Healthy lower layers do not guarantee the requested business task succeeds. Application errors can also reflect dependencies on other systems.',links:['dns','dhcp','windows-domain','syslog']}
  ];
  const osiServices=[
    {id:'dns',group:'core',name:'DNS',endpoint:'UDP + TCP 53',use:'Name resolution. TCP is also needed; DNS is not UDP-only.'},
    {id:'dhcp',group:'core',name:'DHCPv4',endpoint:'UDP 67 server / 68 client',use:'Lease an IPv4 address and options such as gateway and DNS servers.'},
    {id:'http',group:'core',name:'HTTP',endpoint:'TCP 80',use:'Conventional unencrypted web traffic; a site may redirect to HTTPS.'},
    {id:'https',group:'core',name:'HTTPS',endpoint:'TCP 443 / UDP 443 for HTTP/3',use:'HTTP/1.1 or HTTP/2 commonly uses TLS over TCP. HTTP/3 uses QUIC over UDP.'},
    {id:'smb',group:'core',name:'SMB',endpoint:'TCP 445',use:'Windows file sharing. Reachability and share/file permissions are separate checks.'},
    {id:'rdp',group:'core',name:'RDP',endpoint:'TCP + UDP 3389',use:'Remote Desktop. Confirm the configured transport and approved access path.'},
    {id:'kerberos',group:'windows',name:'Kerberos',endpoint:'TCP + UDP 88',use:'Ticket-based authentication, including Active Directory environments.'},
    {id:'ldap',group:'windows',name:'LDAP / CLDAP',endpoint:'TCP 389 / UDP 389 for CLDAP',use:'Directory access. Windows also uses connectionless LDAP for domain-controller discovery.'},
    {id:'ldaps',group:'windows',name:'LDAPS',endpoint:'TCP 636',use:'LDAP with TLS from connection start; LDAP can also upgrade with StartTLS on 389.'},
    {id:'rpc',group:'windows',name:'Windows RPC',endpoint:'TCP 135 + negotiated service ports',use:'135 is the endpoint mapper, not the whole conversation. Modern Windows commonly uses dynamic TCP 49152–65535; follow the service-specific requirements.'},
    {id:'winrm',group:'windows',name:'WinRM',endpoint:'TCP 5985 HTTP / 5986 HTTPS',use:'Windows remote management. Use the organization’s configured authentication and access policy.'},
    {id:'ssh',group:'operations',name:'SSH',endpoint:'TCP 22',use:'Secure remote shell and related services, including many network-device management sessions.'},
    {id:'snmp',group:'operations',name:'SNMP',endpoint:'Usually UDP 161 / 162',use:'161 for queries; 162 for notifications. Version and security settings matter; recognize SNMPv3.'},
    {id:'ntp',group:'operations',name:'NTP',endpoint:'UDP 123',use:'Time synchronization. Clock errors can confuse authentication and event timelines.'},
    {id:'syslog',group:'operations',name:'Syslog',endpoint:'UDP 514 / TLS over TCP 6514',use:'Device/application logs. Confirm the actual transport and collector configuration.'},
    {id:'smtp',group:'operations',name:'SMTP',endpoint:'TCP 25 / 587 / 465',use:'25 commonly transfers mail between servers; 587 is submission; 465 is submission with implicit TLS.'}
  ];
  const osiTickets=[
    {id:'cable',title:'Desk move: no connection',evidence:'The laptop reports media disconnected. The expected switch interface has no link. Other staff remain connected.',answer:1,why:'Start at Physical: trace the connection and check cable, interface, and adapter state. There is specific evidence of a missing link; changing DNS would not establish one.'},
    {id:'vlan',title:'New laptop: wrong network',evidence:'Link is up. The MAC table places the laptop on interface 4, which is configured in guest VLAN 20 instead of the approved staff VLAN 10.',answer:2,why:'Start at Data link: the observed VLAN assignment differs from the intended configuration. Confirm the change and recovery plan before correcting it. An address problem can originate in Layer 2 configuration.'},
    {id:'gateway',title:'Printer works, remote subnet fails',evidence:'A staff laptop reaches its local printer. Its configured default gateway does not match the approved gateway, and no more-specific route covers the remote server.',answer:3,why:'Start at Network: compare the address, prefix, and route configuration with the intended next hop. Local delivery can work while routed delivery fails.'},
    {id:'deny',title:'File service blocked',evidence:'The server address is confirmed. A firewall log records a deny for this laptop’s TCP connection to destination port 445 at the exact test time.',answer:4,why:'Start with the transport-specific policy: verify the TCP 445 flow and intended access rule. The matching deny is useful evidence. It does not yet establish whether the user has permission to read a file.'},
    {id:'session',title:'Portal asks for sign-in again',evidence:'TCP and TLS work. The application log explicitly says the existing user session expired; the sign-in page loads normally.',answer:5,why:'The session-management responsibility is the useful lens: check expiration and the supported reauthentication flow. The actual implementation is in the application, so Layer 7 is also a valid implementation-level description.',also:[7]},
    {id:'certificate',title:'Certificate warning',evidence:'TCP 443 connects, but TLS validation reports that the certificate hostname does not match the requested portal name.',answer:6,why:'Presentation-like protection is the useful lens: investigate hostname and certificate configuration. TLS is not a literal dedicated OSI Layer 6 protocol; grouping it with the Internet application stack is also reasonable. Do not bypass validation.',also:[7]},
    {id:'dns',title:'Name lookup fails',evidence:'A test to the known server IP and TCP port succeeds. An explicit query to the configured DNS resolver returns SERVFAIL for the portal name.',answer:7,why:'Start at the DNS application service: inspect the resolver response, configuration, and upstream dependencies. DNS has a networking purpose but is an application protocol. The response narrows the investigation; it does not identify the final root cause.'}
  ];
  const osiSteps=[
    {layer:7,place:0,title:'The application makes a request',text:'The browser creates an HTTP request for /portal. Any existing login-session context is handled by the application. We begin after DNS and ARP resolution and a successful TCP/TLS setup.',wrappers:['HTTP request · GET /portal'],stage:'application'},
    {layer:6,place:0,title:'TLS protects the application bytes',text:'TLS turns readable application data into protected records. This is presentation-like work, not a separate mandatory OSI Layer 6 header. A record and a TCP segment do not have to line up one-to-one.',wrappers:['TLS record · protected HTTP bytes'],stage:'tls'},
    {layer:4,place:0,title:'TCP identifies the connection',text:'The operating system sends part of the TCP byte stream in a segment. In this direction the source port is the client’s temporary 51514 and the destination is the service’s 443.',wrappers:['TCP · 51514 → 443','Protected application bytes'],stage:'transport'},
    {layer:3,place:0,title:'IP identifies the endpoints',text:'An IPv4 header identifies 10.20.10.25 as the source and 192.0.2.80 as the destination. The route selects gateway 10.20.10.1, but that gateway does not replace the packet’s destination IP.',wrappers:['IPv4 · laptop → server','TCP · 51514 → 443','Protected application bytes'],stage:'network'},
    {layer:2,place:0,title:'Ethernet addresses the next hop',text:'The server is in another subnet, so the local frame is addressed to the router’s inside MAC, not the server’s MAC. This lab uses untagged access links in VLAN 10 between laptop, switch, and router.',wrappers:['Ethernet · laptop MAC → gateway MAC','IPv4 · laptop → server','TCP · 51514 → 443','Protected application bytes'],stage:'link'},
    {layer:1,place:1,title:'The frame travels as signals',text:'The NIC transmits the frame as signals over the Ethernet link into physical switch interface 4. Bits/signals are how the frame travels; they are not an extra “Layer 1 header.”',wrappers:['Signals carry the Ethernet frame','IPv4 · laptop → server','TCP · 51514 → 443','Protected application bytes'],stage:'wire'},
    {layer:2,place:1,title:'The switch forwards within VLAN 10',text:'The switch already knows the gateway MAC is behind interface 24. It forwards this same-VLAN frame from interface 4 to 24. In this ordinary switching example, IP addresses, TCP ports, and endpoint MAC addresses stay the same.',wrappers:['Ethernet · laptop MAC → gateway MAC','IPv4 · laptop → server','TCP · 51514 → 443','Protected application bytes'],stage:'switch'},
    {layer:3,place:2,title:'The router builds a new local frame',text:'The router removes the incoming Ethernet framing, chooses its connected server network, and decrements IPv4 TTL from 64 to 63. It sends a new Ethernet frame from its outside MAC to the server MAC. No NAT is used, so endpoint IP addresses and TCP ports remain unchanged.',wrappers:['New Ethernet · router outside MAC → server MAC','IPv4 · same endpoints · TTL 63','TCP · same ports 51514 → 443','Protected application bytes'],stage:'router'},
    {layer:7,place:3,title:'The server unwraps and processes',text:'The server receives the frame, processes IP and TCP, and reassembles the byte stream as needed. TLS verifies and decrypts the records, then HTTP handles the request using the application’s session context. A response travels back in the opposite direction.',wrappers:['HTTP receives the verified, decrypted request'],stage:'receive'}
  ];
  const osi={
    layers:osiLayers,services:osiServices,tickets:osiTickets,steps:osiSteps,
    layer(number){const item=osiLayers.find(l=>l.number===number);if(!item)throw Error('Choose a layer from 1 to 7.');return item;},
    serviceGroup(group){if(!['core','windows','operations','all'].includes(group))throw Error('Choose a service group.');return osiServices.filter(s=>group==='all'||s.group===group);},
    packet(index){
      if(!Number.isInteger(index)||index<0||index>=osiSteps.length)throw Error('Choose a packet step.');
      const step=osiSteps[index],routed=index>=7;
      return {...step,index,sourceIP:'10.20.10.25',destinationIP:'192.0.2.80',sourcePort:51514,destinationPort:443,protocol:'TCP',ttl:routed?63:64,
        sourceMAC:routed?'02:00:00:00:02:01':'02:00:00:00:10:25',destinationMAC:routed?'02:00:00:00:02:80':'02:00:00:00:10:01',
        showTransport:index>=2&&index<8,showIP:index>=3&&index<8,showFrame:index>=4&&index<8};
    },
    diagnose(id,number){const item=osiTickets.find(t=>t.id===id);if(!item)throw Error('Choose a known ticket.');osi.layer(number);return {...item,correct:number===item.answer||Boolean(item.also?.includes(number)),primary:number===item.answer};}
  };

  const models = {
    osi,
    cases,
    triage(id,choice=null){return caseResult('triage',id,choice);},
    incident(id,choice=null){return caseResult('incident',id,choice);},
    phishing(id,choice=null){return caseResult('phishing',id,choice);},
    vulnerability(id,choice=null){return caseResult('vulnerability',id,choice);},
    firewall(source,service,specificFirst=true){
      if(!['staff','guest'].includes(source)||!['smb','https'].includes(service))throw Error('Choose a known source and service.');
      const specific={id:'staff-smb',label:'Staff → file server · TCP 445',action:'Allow',matches:source==='staff'&&service==='smb'};
      const broad={id:'deny-server',label:'Any source → file server · any service',action:'Deny',matches:true};
      const rules=specificFirst?[specific,broad]:[broad,specific];let match=null;
      const evaluated=rules.map(rule=>{const stage=match?'skipped':rule.matches?'selected':'miss';if(stage==='selected')match=rule;return {...rule,stage};});
      return {sourceIP:source==='staff'?'10.20.10.25':'10.20.20.25',port:service==='smb'?445:443,allowed:match.action==='Allow',match:match.id,rules:evaluated};
    },
    routing(destination,specific=true,defaultRoute=true){
      models.subnet(destination,32);
      const routes=[{prefix:24,network:'10.20.30.0',name:'Server link',hop:'10.99.0.2',enabled:specific},{prefix:16,network:'10.20.0.0',name:'Branch router',hop:'10.99.0.3',enabled:true},{prefix:0,network:'0.0.0.0',name:'Upstream router',hop:'10.99.0.1',enabled:defaultRoute}].map(r=>({...r,matches:r.enabled&&models.subnet(destination,r.prefix).network===r.network}));
      const chosen=routes.filter(r=>r.matches).sort((a,b)=>b.prefix-a.prefix)[0]||null;
      return {destination,routes,chosen};
    },
    switching(table,source,destination){
      const devices=[{id:'laptop',label:'Staff laptop',mac:'02:00:00:00:00:11',port:1,vlan:10},{id:'printer',label:'Printer',mac:'02:00:00:00:00:22',port:2,vlan:10},{id:'desktop',label:'Staff desktop',mac:'02:00:00:00:00:33',port:3,vlan:10},{id:'guest',label:'Guest laptop',mac:'02:00:00:00:00:44',port:4,vlan:20}];
      const sender=devices.find(d=>d.id===source),receiver=devices.find(d=>d.id===destination);
      if(!sender||!receiver)throw Error('Choose known devices.');
      const learned={...table,[sender.vlan+':'+sender.mac]:sender.port},known=learned[sender.vlan+':'+receiver.mac];
      const egress=known?(known===sender.port?[]:[known]):devices.filter(d=>d.vlan===sender.vlan&&d.port!==sender.port).map(d=>d.port);
      return {devices,sender,receiver,table:learned,egress,mode:known?(known===sender.port?'filtered':'unicast'):'flood'};
    },
    arp(destination,cacheHit=false,replies=true){
      if(!['printer','website'].includes(destination))throw Error('Choose the printer or website.');
      const local=destination==='printer',ip=local?'10.20.10.50':'192.0.2.80',hop=local?'10.20.10.50':'10.20.10.1',mac=local?'02:00:00:00:00:50':'02:00:00:00:00:01';
      const steps=[{id:'route',title:'Choose the next hop',text:`Destination ${ip} is ${local?'inside':'outside'} the laptop’s 10.20.10.0/24 subnet. ${local?'Deliver directly to the printer.':'The default route selects the gateway.'} Look for ${hop} in the ARP cache.`}];
      if(cacheHit)steps.push({id:'cache',title:'Use the cached mapping',text:`The laptop already knows ${hop} → ${mac}. No new ARP request is needed in this example.`});
      else{
        steps.push({id:'request',title:'Broadcast an ARP request',text:`Who has ${hop}? Tell 10.20.10.25. The switch distributes this request in VLAN 10; it does not forward it into the remote network.`});
        steps.push(replies?{id:'reply',title:'Receive a reply and cache it',text:`The ${local?'printer':'gateway'} replies directly: ${hop} is at ${mac}. The laptop stores that mapping.`}:{id:'unanswered',title:'No reply: the mapping is unresolved',text:`The laptop cannot yet address the data frame to ${hop}. It may retry ARP and eventually report failure. Check the next hop, VLAN, and link; this observation alone does not identify the cause.`});
      }
      if(cacheHit||replies)steps.push({id:'frame',title:'Send the IPv4 packet in an Ethernet frame',text:`Ethernet destination: ${mac}. IP destination inside: ${ip}. ${local?'The frame goes directly to the printer.':'The frame goes to the gateway for onward routing, not directly to the website.'} This demonstrates local delivery preparation, not successful application access.`});
      return {local,ip,hop,mac,steps};
    },
    subnet(address, prefix) {
      if (!/^\d{1,3}(\.\d{1,3}){3}$/.test(address)) throw Error('Enter four numbers separated by dots, such as 192.168.204.30.');
      const octets=address.split('.').map(Number);
      if(octets.some(n=>n>255)) throw Error('Each address number must be between 0 and 255.');
      if(!Number.isInteger(prefix)||prefix<0||prefix>32) throw Error('Choose a prefix from 0 to 32.');
      const value=octets.reduce((sum,n)=>sum*256+n,0),total=2**(32-prefix);
      const low=Math.floor(value/total)*total, high=low+total-1;
      return {prefix,total,hostBits:32-prefix,network:ipText(low),broadcast:prefix<31?ipText(high):null,
        first:ipText(prefix<31?low+1:low),last:ipText(prefix<31?high-1:high),
        usable:prefix<31?total-2:total,mask:ipText(2**32-total),
        binary:octets.map(n=>n.toString(2).padStart(8,'0')).join(''),
        increment:prefix>0&&prefix%8!==0?2**(8-prefix%8):null,
        octet:Math.ceil(prefix/8)};
    },
    vlan(vlan,route,allow) {
      if(vlan===30)return {allowed:true,code:'same',title:'Same VLAN: switched directly',reason:'The guest now shares VLAN 30 with the server. This path bypasses the inter-VLAN rule. Host and share permissions still apply.'};
      if(!route)return {allowed:false,code:'no-route',title:'Different VLANs: no routed path',reason:'The switch keeps the VLANs separate. Without an inter-VLAN route, this guest has no path to VLAN 30.'};
      if(!allow)return {allowed:false,code:'denied',title:'Routed path: policy denies TCP 445',reason:'Routing provides a path, but the guest-to-server rule denies the SMB connection. Other permitted destinations can still work.'};
      return {allowed:true,code:'routed',title:'Routed path: policy permits TCP 445',reason:'Separate VLANs still communicate when routing and policy allow it. Reaching TCP 445 does not grant permission to read the share.'};
    },
    syslog(severity,threshold){return severity<=threshold;},
    access(finance,mfa,compliant){return {allowed:finance&&mfa&&compliant,policyAllowed:mfa&&compliant,missing:[!finance&&'Finance group permission on the SharePoint resource',!mfa&&'Completed MFA',!compliant&&'Compliant device'].filter(Boolean)};},
    tcp(optionBytes){const padding=(4-(optionBytes%4))%4;return {padding,header:20+optionBytes+padding,offset:(20+optionBytes+padding)/4};}
  };
  root.StudyModels=models;
  if(typeof document==='undefined')return;
  const esc = text=>String(text).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const fmt=n=>n.toLocaleString('en-US');
  const by=(box,selector)=>box.querySelector(selector);
  const on=(box,selector,event,fn)=>by(box,selector).addEventListener(event,fn);
  const checkbox=(id,label,checked=true)=>`<label class="exercise-check" for="${id}"><input id="${id}" type="checkbox" ${checked?'checked':''}><span>${label}</span></label>`;
  const status=(title,text,good=false)=>`<div class="result-label">${good?'●':'◇'} ${esc(title)}</div><p>${esc(text)}</p>`;
  function decisionExercise(box,type){
    box.innerHTML=`<div class="exercise-controls"><label for="case-${type}">Evidence snapshot<select id="case-${type}">${cases[type].map((c,i)=>`<option value="${c.id}">${i+1} · ${esc(c.title)}</option>`).join('')}</select></label></div><div class="case-evidence"></div><fieldset class="case-decisions"><legend></legend><div class="case-options"></div></fieldset><div class="exercise-result" role="status" aria-live="polite"></div><p class="exercise-caption">Fictional learning cases. Each decision depends on the evidence shown. No live actions are performed and no answers are saved.</p>`;
    const render=()=>{
      const item=models[type](by(box,'select').value);
      by(box,'.case-evidence').innerHTML=`<span class="eyebrow">CASE RECORD / ${esc(item.id.toUpperCase())}</span><h3>${esc(item.title)}</h3><ul>${item.evidence.map(line=>`<li>${esc(line)}</li>`).join('')}</ul>`;
      by(box,'legend').textContent=item.question;
      by(box,'.case-options').innerHTML=item.options.map((o,i)=>`<button type="button" data-choice="${o.id}" aria-pressed="false"><span aria-hidden="true">0${i+1}</span>${esc(o.label)}</button>`).join('');
      delete by(box,'.exercise-result').dataset.outcome;
      by(box,'.exercise-result').innerHTML=status('Make a decision','Read the record, choose an action, and compare the explanation. You can try every option.');
    };
    on(box,'select','change',render);
    on(box,'.case-options','click',event=>{
      const button=event.target.closest('[data-choice]');if(!button)return;
      const result=models[type](by(box,'select').value,button.dataset.choice);
      box.querySelectorAll('[data-choice]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
      by(box,'.exercise-result').dataset.outcome=result.correct?'supported':'reconsider';
      by(box,'.exercise-result').innerHTML=status(result.correct?'Supported by this record':'Reconsider this conclusion',result.selected.why,result.correct);
    });render();
  }
  let osiInstance=0;
  const setups={
    osi(box){
      const prefix='osi-'+(++osiInstance),ordered=[...osi.layers].reverse();
      let selectedLayer=1,packetStep=0,serviceGroup='core';
      const icon=kind=>{
        const paths={
          cable:'<path d="M16 33h19v22H16zM61 33h19v22H61zM35 44h26M21 27v6m6-6v6m41-6v6m6-6v6M21 55v6m6-6v6m41-6v6m6-6v6"/>',
          switch:'<rect x="10" y="26" width="76" height="38" rx="5"/><path d="M19 39h9v12h-9zm16 0h9v12h-9zm16 0h9v12h-9zm16 0h9v12h-9zM25 64v10m45-10v10"/>',
          router:'<ellipse cx="48" cy="47" rx="34" ry="24"/><path d="M25 47h16m-6-6 6 6-6 6m36-6H55m6-6-6 6 6 6M48 24v15m-6-6 6 6 6-6m-6 37V55m-6 6 6-6 6 6"/>',
          socket:'<rect x="9" y="25" width="24" height="40" rx="4"/><rect x="63" y="25" width="24" height="40" rx="4"/><path d="M33 38h30m-6-6 6 6-6 6M63 54H33m6-6-6 6 6 6"/>',
          session:'<path d="M15 23h48v29H38L25 64V52H15zM63 35h18v31H68L55 77V66H43V52"/><path d="M25 34h28m-28 8h18"/>',
          lock:'<rect x="23" y="38" width="50" height="35" rx="5"/><path d="M33 38V27a15 15 0 0 1 30 0v11M48 49v13"/>',
          app:'<rect x="12" y="18" width="72" height="56" rx="5"/><path d="M12 32h72M20 25h2m6 0h2m6 0h2M34 44l-9 8 9 8m28-16 9 8-9 8m-9-18-10 24"/>'
        };
        return `<svg viewBox="0 0 96 88" aria-hidden="true" focusable="false">${paths[kind]}</svg>`;
      };
      box.innerHTML=`<div class="osi-introline"><span>01 / LAYER EXPLORER</span><span>Seven responsibilities. One conversation.</span></div>
        <div class="osi-explorer"><div class="osi-stack" role="tablist" aria-label="OSI layers, application to physical" aria-orientation="vertical">${ordered.map(l=>`<button type="button" role="tab" id="${prefix}-layer-${l.number}" aria-controls="${prefix}-panel" aria-selected="${l.number===1}" tabindex="${l.number===1?0:-1}" data-layer="${l.number}"><span class="osi-number">0${l.number}</span><span><strong>${esc(l.name)}</strong><small>${esc(l.verb)}</small></span><span class="osi-tab-arrow" aria-hidden="true">↗</span></button>`).join('')}<p class="osi-stack-hint">Start at 1 and work upward.<br>Use ↑ / ↓ to explore with a keyboard.</p></div><div class="osi-panel" id="${prefix}-panel" role="tabpanel" tabindex="0" aria-labelledby="${prefix}-layer-1"></div></div>
        <div class="osi-live" role="status" aria-live="polite"></div>
        <section class="osi-packet" aria-label="Follow an HTTPS packet"><div class="osi-introline"><span>02 / PACKET WALKTHROUGH</span><span>Fictional office network</span></div><h3>Follow one HTTPS request</h3><p>Use Next to add the headers and follow delivery. This isolated, routed lab has <strong>no NAT</strong>. DNS, ARP, and TCP/TLS setup have already succeeded. We simplify one representative data packet; real requests can span many packets and TLS records.</p>
        <div class="osi-topology" aria-label="Laptop connects through switch and router to a lab server">${[['Laptop','10.20.10.25/24','Source TCP 51514','app'],['Switch','VLAN 10','In 4 → out 24','switch'],['Router','10.20.10.1/24','Outside: 192.0.2.1/24','router'],['Lab server','192.0.2.80/24','Destination TCP 443','app']].map((node,i)=>`<div class="osi-device" data-device="${i}">${icon(node[3])}<strong>${esc(node[0])}</strong><code>${esc(node[1])}</code><small>${esc(node[2])}</small><span class="osi-device-state"></span></div>`).join('')}</div>
        <div class="osi-packet-toolbar"><button type="button" class="quiet-button" data-packet="previous" aria-label="Previous packet step">← Previous</button><span class="osi-step-count"></span><button type="button" data-packet="next" aria-label="Next packet step">Next →</button><button type="button" class="quiet-button" data-packet="reset">Restart</button></div>
        <progress class="osi-progress" max="9" value="1" aria-label="Packet walkthrough progress"></progress>
        <div class="osi-step-copy" aria-live="polite" aria-atomic="true"></div>
        <div class="osi-packet-inspect"><div><span class="eyebrow">WHAT IS BEING CARRIED</span><div class="osi-envelopes"></div></div><div><span class="eyebrow">HEADER INSPECTOR / OUTBOUND DATA</span><dl class="osi-fields"></dl></div></div>
        <p class="exercise-caption">Physical switch interfaces 4 and 24 are untagged access ports in VLAN 10. The router’s outside interface connects directly to the lab server subnet. Locally administered MAC addresses and documentation-only server addresses are fictional. Retransmissions, fragmentation, and full handshake details are omitted.</p></section>
        <section class="osi-diagnosis" aria-label="OSI troubleshooting practice"><div class="osi-introline"><span>03 / SUPPORT DESK</span><span>Find the next useful check</span></div><h3>Which responsibility would you inspect?</h3><p>Choose a fictional ticket, read the evidence, then select a layer. These are starting points for investigation, not proof that every symptom has exactly one layer or one cause.</p><div class="exercise-controls"><label for="${prefix}-ticket">Support ticket<select id="${prefix}-ticket" data-osi-ticket>${osi.tickets.map((t,i)=>`<option value="${t.id}">${i+1} · ${esc(t.title)}</option>`).join('')}</select></label></div><div class="case-evidence osi-ticket-evidence"></div><fieldset class="osi-answers"><legend>Where would you start?</legend><div>${osi.layers.map(l=>`<button type="button" class="quiet-button" data-answer="${l.number}" aria-pressed="false"><b>${l.number}</b> ${esc(l.name)}</button>`).join('')}</div></fieldset><div class="exercise-result osi-feedback" role="status" aria-live="polite"></div><p class="exercise-caption">You can try every answer. Nothing is saved, and no real network or customer system is contacted.</p></section>`;
      const renderServices=()=>{
        const target=by(box,'.osi-services');if(!target)return;
        target.innerHTML=osi.serviceGroup(serviceGroup).map(s=>`<div class="osi-service"><strong>${esc(s.name)}</strong><code>${esc(s.endpoint)}</code><p>${esc(s.use)}</p></div>`).join('');
      };
      const renderLayer=()=>{
        const l=osi.layer(selectedLayer),panel=by(box,'.osi-panel');
        box.querySelectorAll('[data-layer]').forEach(b=>{const active=Number(b.dataset.layer)===selectedLayer;b.setAttribute('aria-selected',String(active));b.tabIndex=active?0:-1;});
        panel.setAttribute('aria-labelledby',`${prefix}-layer-${l.number}`);
        panel.innerHTML=`<div class="osi-layer-heading"><div><span class="eyebrow">LAYER ${l.number} / ${esc(l.internet)}</span><h3>${esc(l.name)}</h3><p>${esc(l.verb)}</p></div><span class="osi-layer-glyph">${icon(l.icon)}</span></div><p>${esc(l.explanation)}</p><div class="osi-facts"><div><span>DATA UNIT</span><strong>${esc(l.unit)}</strong></div><div><span>WHAT TO RECOGNIZE</span><strong>${esc(l.address)}</strong></div></div><h4>What this looks like</h4><div class="osi-visual-strip">${l.visual.map(s=>`<span>${esc(s)}</span>`).join('')}</div><p>${esc(l.hardware)}</p><h4>Protocols, standards & examples</h4><dl class="osi-protocols">${l.protocols.map(([name,text])=>`<div><dt>${esc(name)}</dt><dd>${esc(text)}</dd></div>`).join('')}</dl><div class="osi-port-note"><span class="eyebrow">PORT CHECK</span><p>${esc(l.ports)}</p></div><h4>A support or security example</h4><p>${esc(l.example)}</p><ol class="osi-checks">${l.checks.map(s=>`<li>${esc(s)}</li>`).join('')}</ol><p class="osi-limit"><strong>Keep in mind:</strong> ${esc(l.limit)}</p>${[4,7].includes(l.number)?`<div class="osi-service-reference"><h4>Service & transport reference</h4><p>These are common defaults to recognize, not a blanket firewall allowlist. Confirm the configured service, direction, and policy.</p><label for="${prefix}-services">Reference group<select id="${prefix}-services" data-services><option value="core">Everyday networking</option><option value="windows">Windows & identity</option><option value="operations">Management, logs & mail</option><option value="all">All services</option></select></label><div class="osi-services"></div><p class="exercise-caption">Application protocol names are shown beside their Layer 4 TCP/UDP endpoints. Custom configuration can use other ports.</p></div>`:''}<nav class="osi-links" aria-label="Study this layer in more detail">${l.links.map(slug=>`<a href="#note-${slug}">${esc(({ 'private-addressing':'Private IPv4 & NAT','windows-domain':'Active Directory','file-shares':'File shares'})[slug]||slug.replace(/-/g,' '))} ↗</a>`).join('')}</nav>`;
        const select=by(box,'[data-services]');if(select){select.value=serviceGroup;select.addEventListener('change',()=>{serviceGroup=select.value;renderServices();});renderServices();}
      };
      const selectLayer=(number,focus=false)=>{selectedLayer=number;renderLayer();if(focus)by(box,`[data-layer="${number}"]`).focus();by(box,'.osi-live').textContent=`Layer ${number}: ${osi.layer(number).name}. Details updated.`;};
      on(box,'.osi-stack','click',event=>{const button=event.target.closest('[data-layer]');if(button)selectLayer(Number(button.dataset.layer));});
      on(box,'.osi-stack','keydown',event=>{
        if(!event.target.closest('[data-layer]'))return;
        const position=ordered.findIndex(l=>l.number===selectedLayer);
        const next=event.key==='ArrowDown'?(position+1)%7:event.key==='ArrowUp'?(position+6)%7:event.key==='Home'?0:event.key==='End'?6:null;
        if(next!==null){event.preventDefault();selectLayer(ordered[next].number,true);}
      });
      const renderPacket=()=>{
        const p=osi.packet(packetStep);
        by(box,'.osi-step-count').textContent=`${packetStep+1} / ${osi.steps.length}`;
        by(box,'.osi-progress').value=packetStep+1;
        by(box,'[data-packet="previous"]').disabled=packetStep===0;by(box,'[data-packet="next"]').disabled=packetStep===osi.steps.length-1;
        box.querySelectorAll('[data-device]').forEach(node=>{const active=Number(node.dataset.device)===p.place;node.dataset.active=String(active);node.querySelector('.osi-device-state').textContent=active?'CURRENT STEP':'';});
        by(box,'.osi-step-copy').innerHTML=`<span class="eyebrow">STEP ${packetStep+1} / LAYER ${p.layer}${[5,6].includes(p.layer)?' RESPONSIBILITY':''}</span><h4>${esc(p.title)}</h4><p>${esc(p.text)}</p>`;
        by(box,'.osi-envelopes').innerHTML=p.wrappers.map((text,i)=>`<div style="--envelope-inset:${i*9}px"><span>${i===0?'OUTER':'INSIDE'}</span><strong>${esc(text)}</strong></div>`).join('');
        const fields=[['Ethernet source MAC',p.showFrame?p.sourceMAC:'Not shown at this step'],['Ethernet destination MAC',p.showFrame?p.destinationMAC:'Not shown at this step'],['IP source → destination',p.showIP?`${p.sourceIP} → ${p.destinationIP}`:'Not shown at this step'],['IPv4 TTL',p.showIP?String(p.ttl):'Not shown at this step'],['TCP source → destination',p.showTransport?`${p.sourcePort} → ${p.destinationPort}`:'Not shown at this step']];
        by(box,'.osi-fields').innerHTML=fields.map(([name,value],i)=>`<div${packetStep===7&&(i<2||i===3)?' data-changed="true"':''}><dt>${esc(name)}${packetStep===7&&(i<2||i===3)?' · CHANGED':''}</dt><dd>${esc(value)}</dd></div>`).join('');
      };
      on(box,'.osi-packet-toolbar','click',event=>{const button=event.target.closest('[data-packet]');if(!button||button.disabled)return;packetStep=button.dataset.packet==='reset'?0:Math.max(0,Math.min(osi.steps.length-1,packetStep+(button.dataset.packet==='next'?1:-1)));renderPacket();});
      const renderTicket=()=>{
        const ticket=osi.tickets.find(t=>t.id===by(box,'[data-osi-ticket]').value);
        by(box,'.osi-ticket-evidence').innerHTML=`<span class="eyebrow">OBSERVED IN THIS FICTIONAL TICKET</span><p>${esc(ticket.evidence)}</p>`;
        box.querySelectorAll('[data-answer]').forEach(b=>b.setAttribute('aria-pressed','false'));
        by(box,'.osi-feedback').innerHTML=status('Choose a starting point','Use the specific evidence, then compare the explanation.');delete by(box,'.osi-feedback').dataset.outcome;
      };
      on(box,'[data-osi-ticket]','change',renderTicket);
      on(box,'.osi-answers','click',event=>{
        const button=event.target.closest('[data-answer]');if(!button)return;
        const result=osi.diagnose(by(box,'[data-osi-ticket]').value,Number(button.dataset.answer));
        box.querySelectorAll('[data-answer]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
        by(box,'.osi-feedback').dataset.outcome=result.correct?'supported':'reconsider';
        by(box,'.osi-feedback').innerHTML=status(result.correct?(result.primary?'A useful starting point':'A valid implementation-level view'):'Look again at the evidence',(result.correct?'':`For the responsibility this ticket highlights, start with Layer ${result.answer}, ${osi.layer(result.answer).name}. `)+result.why,result.correct);
      });
      renderLayer();renderPacket();renderTicket();
    },
    triage(box){decisionExercise(box,'triage');},
    incident(box){decisionExercise(box,'incident');},
    phishing(box){decisionExercise(box,'phishing');},
    vulnerability(box){decisionExercise(box,'vulnerability');},
    firewall(box){
      box.innerHTML=`<div class="exercise-controls"><label for="fw-source">Connection source<select id="fw-source"><option value="staff">Staff · 10.20.10.25</option><option value="guest">Guest · 10.20.20.25</option></select></label><label for="fw-service">Server service<select id="fw-service"><option value="smb">SMB · TCP 445</option><option value="https">HTTPS · TCP 443</option></select></label></div>${checkbox('fw-first','Place the specific staff allow above the broad deny')}<div class="flow-strip"><div><small>SOURCE</small><strong data-flow-source></strong></div><span aria-hidden="true">→</span><div><small>FIREWALL</small><strong data-flow-action></strong></div><span aria-hidden="true">→</span><div><small>DESTINATION</small><strong>10.20.30.10</strong></div></div><ol class="policy-ladder" aria-label="Rules evaluated from top to bottom"></ol><div class="exercise-result" role="status"></div><p class="exercise-caption">Two fictional first-match rules, one destination, and a new TCP connection. Routing, NAT, existing connection state, and additional policies are omitted. The interface does not modify a real firewall.</p>`;
      const update=()=>{
        const r=models.firewall(by(box,'#fw-source').value,by(box,'#fw-service').value,by(box,'#fw-first').checked);
        by(box,'[data-flow-source]').textContent=r.sourceIP;by(box,'[data-flow-action]').textContent=(r.allowed?'ALLOW':'DENY')+' · '+r.port;
        by(box,'.policy-ladder').innerHTML=r.rules.map((rule,i)=>`<li data-stage="${rule.stage}"><span class="rule-position">0${i+1}</span><div><strong>${esc(rule.action)}</strong><p>${esc(rule.label)}</p><small>${rule.stage==='selected'?'FIRST MATCH · decision made here':rule.stage==='miss'?'NO MATCH · continue':'NOT EVALUATED · earlier rule already matched'}</small></div></li>`).join('');
        by(box,'.exercise-result').innerHTML=status(r.allowed?'This policy permits the connection':'This policy denies the connection',r.allowed?'Staff SMB matches the specific allow before the broad deny. This is a policy decision only; the server, return path, and file permissions still need to work.':r.rules[0].id==='deny-server'?'The broad deny matches first. The later staff rule cannot override it. Try putting the specific allow first and test both staff and guest traffic.':'The specific staff SMB rule does not match this request. The next rule denies it. A rule for TCP 445 does not also allow TCP 443.',r.allowed);
      };box.querySelectorAll('input,select').forEach(el=>el.addEventListener('change',update));update();
    },
    routing(box){
      box.innerHTML=`<div class="exercise-controls"><label for="route-destination">Packet destination<select id="route-destination"><option>10.20.30.10</option><option>10.20.40.10</option><option>192.0.2.80</option></select></label><div class="exercise-checks">${checkbox('route-specific','Install the server /24 route')}${checkbox('route-default','Install the default route')}</div></div><div class="route-table table-scroll"></div><div class="flow-strip"><div><small>DESTINATION IP</small><strong data-route-ip></strong></div><span aria-hidden="true">→</span><div><small>SELECTED NEXT HOP</small><strong data-route-hop></strong></div></div><div class="exercise-result" role="status"></div><p class="exercise-caption">A fictional IPv4 router with three possible routes, reachable next hops on 10.99.0.0/24, and no policy routing. This exercise models one forwarding decision, not end-to-end reachability.</p>`;
      const update=()=>{
        const r=models.routing(by(box,'select').value,by(box,'#route-specific').checked,by(box,'#route-default').checked);
        by(box,'.route-table').innerHTML=`<table><caption>Installed routes and matching prefixes</caption><thead><tr><th scope="col">Destination</th><th scope="col">Path</th><th scope="col">Decision</th></tr></thead><tbody>${r.routes.map(route=>`<tr data-selected="${r.chosen===route}"><td><code>${route.network}/${route.prefix}</code></td><td>${esc(route.name)}</td><td>${!route.enabled?'Not installed':r.chosen===route?'SELECTED · longest match':route.matches?'Matches · less specific':'Does not match'}</td></tr>`).join('')}</tbody></table>`;
        by(box,'[data-route-ip]').textContent=r.destination;by(box,'[data-route-hop]').textContent=r.chosen?r.chosen.hop:'No matching route';
        by(box,'.exercise-result').innerHTML=status(r.chosen?'Use '+r.chosen.network+'/'+r.chosen.prefix:'Cannot forward: no matching route',r.chosen?`The /${r.chosen.prefix} route is the most specific installed match. Send toward ${r.chosen.name.toLowerCase()} at ${r.chosen.hop}. ${r.chosen.prefix===0?'The default is a fallback, not evidence that the upstream router can deliver this packet.':'Other hops and the return path still need valid routes.'}`:'This destination matches none of the installed routes. There is no default fallback. Inspect the missing route rather than changing an unrelated application permission.',!!r.chosen);
      };box.querySelectorAll('input,select').forEach(el=>el.addEventListener('change',update));update();
    },
    switching(box){
      box.innerHTML=`<div class="exercise-controls"><label for="switch-flow">Send a unicast frame<select id="switch-flow"><option value="laptop,printer">Staff laptop → printer</option><option value="printer,laptop">Printer → staff laptop</option><option value="desktop,printer">Staff desktop → printer</option><option value="guest,printer">Guest → printer MAC (different VLAN)</option></select></label></div><div class="switch-panel"><div class="switch-chassis-label"><span>SW-01 / LEARNING BRIDGE</span><small>4 ACCESS PORTS</small></div><div class="switch-ports"></div></div><div class="exercise-actions"><button type="button" id="switch-send">Send frame →</button><button type="button" class="quiet-button" id="switch-clear">Clear fictional MAC table</button></div><div class="switch-table table-scroll"></div><div class="exercise-result" role="status"></div><p class="exercise-caption">Four access ports, no trunks, no aging, no port-security restrictions, and all ports in forwarding state. The cross-VLAN choice deliberately supplies a destination MAC; the switch does not route it. A normally configured IP client uses its route and next hop instead.</p>`;
      let table={};
      const show=(r,sent)=>{
        by(box,'.switch-ports').innerHTML=r.devices.map(d=>`<div data-state="${sent&&d.port===r.sender.port?'ingress':sent&&r.egress.includes(d.port)?'egress':'idle'}"><span class="port-jack" aria-hidden="true">${d.port}</span><strong>${esc(d.label)}</strong><small>VLAN ${d.vlan} · MAC :${d.mac.slice(-2)}</small><b>${!sent?'Ready':d.port===r.sender.port?'INCOMING':r.egress.includes(d.port)?'COPY SENT HERE':'NO COPY'}</b></div>`).join('');
        by(box,'.switch-table').innerHTML=`<table><caption>MAC forwarding table · learned source locations</caption><thead><tr><th scope="col">VLAN</th><th scope="col">MAC address</th><th scope="col">Port</th></tr></thead><tbody>${Object.entries(table).map(([key,port])=>`<tr><td>${key.split(':')[0]}</td><td><code>${key.slice(key.indexOf(':')+1)}</code></td><td>${port}</td></tr>`).join('')||'<tr><td colspan="3">No sources learned yet.</td></tr>'}</tbody></table>`;
      };
      const current=()=>{const [s,d]=by(box,'select').value.split(',');return models.switching(table,s,d);};
      const ready=()=>{show(current(),false);by(box,'.exercise-result').innerHTML=status('Predict the outgoing ports','Start with laptop → printer, send the printer reply, then send laptop → printer again. Which destination locations has the switch actually learned?');};
      on(box,'#switch-send','click',()=>{
        const r=current();table=r.table;show(r,true);
        const result=r.egress.length?'Port'+(r.egress.length>1?'s ':' ')+r.egress.join(', '):'No eligible egress ports';
        by(box,'.exercise-result').innerHTML=status(r.mode==='unicast'?'Known destination · '+result:r.mode==='flood'?'Unknown unicast · '+result:'Destination behind incoming port',`Learned ${r.sender.mac} on port ${r.sender.port} in VLAN ${r.sender.vlan}. `+(r.mode==='unicast'?'The destination MAC is already known in this VLAN, so the switch forwards only to its learned port.':r.mode==='flood'?'The destination MAC is unknown in this VLAN. Copies go only to other eligible ports in this same VLAN. A guessed MAC cannot cross the VLAN boundary.':'The destination is behind the incoming port, so this switch does not forward the frame back there.'),r.mode==='unicast');
      });on(box,'#switch-clear','click',()=>{table={};ready();});on(box,'select','change',ready);ready();
    },
    arp(box){
      box.innerHTML=`<div class="exercise-controls"><label for="arp-destination">Send an IPv4 packet to<select id="arp-destination"><option value="printer">Local printer · 10.20.10.50</option><option value="website">Remote website · 192.0.2.80</option></select></label>${checkbox('arp-replies','Next hop answers ARP')}</div><div class="arp-topology" aria-label="Laptop, printer, and gateway share VLAN 10. The website is outside this subnet."><div class="arp-lan"><span class="arp-zone">VLAN 10 · 10.20.10.0/24 · ONE SWITCH</span><div class="arp-devices"><div class="arp-device" data-arp-node="laptop"><span>YOUR LAPTOP</span><strong>10.20.10.25</strong><small>MAC ends in :25</small></div><div class="arp-device" data-arp-node="printer"><span>PRINTER</span><strong>10.20.10.50</strong><small>MAC ends in :50</small></div><div class="arp-device" data-arp-node="gateway"><span>GATEWAY</span><strong>10.20.10.1</strong><small>MAC ends in :01</small></div></div><div class="arp-wire" aria-hidden="true"></div></div><div class="arp-outside"><span aria-hidden="true">↓ Routed path</span><strong>Remote website · 192.0.2.80</strong><small>Outside this VLAN; never receives the laptop’s ARP broadcast</small></div></div><div class="arp-phase" aria-hidden="true"><span>01 / ROUTE</span><span>02 / RESOLVE</span><span>03 / DELIVER</span></div><div class="exercise-result" role="status"></div><div class="arp-frame" hidden><div><span>ETHERNET DESTINATION · NEXT HOP</span><strong id="arp-frame-mac"></strong></div><div><span>IP DESTINATION · FINAL TARGET</span><strong id="arp-frame-ip"></strong></div></div><div class="arp-cache"><span>LAPTOP ARP CACHE · IPv4 → MAC</span><ul id="arp-cache-list"></ul></div><div class="exercise-actions"><button type="button" id="arp-next">Start delivery →</button><button type="button" class="quiet-button" id="arp-clear">Clear fictional cache</button></div><p class="exercise-caption">A fixed /24 network with a default route, no proxy ARP, and no cache expiry during the exercise. MAC addresses are abbreviated in the diagram. Clear the cache to test an unanswered lookup. Nothing is sent on your actual network.</p>`;
      const cache=new Map();let plan,step=-1;
      const reset=()=>{
        const destination=by(box,'#arp-destination').value,hop=destination==='printer'?'10.20.10.50':'10.20.10.1';
        plan=models.arp(destination,cache.has(hop),by(box,'#arp-replies').checked);step=-1;
        by(box,'.arp-topology').dataset.phase='ready';by(box,'.arp-topology').dataset.target=plan.local?'printer':'gateway';
        by(box,'.arp-frame').hidden=true;by(box,'#arp-next').textContent='Start delivery →';
        by(box,'.exercise-result').innerHTML=status('Predict the next hop',`The final destination is ${plan.ip}. Should the laptop resolve the printer’s MAC or the gateway’s MAC?`);
        by(box,'#arp-cache-list').innerHTML=cache.size?[...cache].map(([ip,mac])=>`<li><code>${ip}</code><span>→</span><code>${mac}</code></li>`).join(''):'<li>No mappings learned yet.</li>';
      };
      on(box,'#arp-next','click',()=>{
        if(step===plan.steps.length-1)reset();
        const current=plan.steps[++step];
        by(box,'.arp-topology').dataset.phase=current.id;
        by(box,'.exercise-result').innerHTML=status(current.title,current.text,current.id==='frame');
        if(current.id==='reply'){
          cache.set(plan.hop,plan.mac);
          by(box,'#arp-cache-list').innerHTML=[...cache].map(([ip,mac])=>`<li><code>${ip}</code><span>→</span><code>${mac}</code></li>`).join('');
        }
        by(box,'.arp-frame').hidden=current.id!=='frame';
        if(current.id==='frame'){by(box,'#arp-frame-mac').textContent=plan.mac;by(box,'#arp-frame-ip').textContent=plan.ip;}
        by(box,'#arp-next').textContent=step===plan.steps.length-1?'Send again →':'Next step →';
      });
      on(box,'#arp-clear','click',()=>{cache.clear();reset();});
      on(box,'#arp-destination','change',reset);on(box,'#arp-replies','change',reset);reset();
    },
    subnet(box){
      box.innerHTML=`<div class="exercise-controls"><label for="subnet-ip">IPv4 address<input id="subnet-ip" type="text" inputmode="decimal" value="192.168.204.30" autocomplete="off" spellcheck="false" aria-describedby="subnet-error"></label><label for="subnet-prefix">Network prefix <output id="subnet-prefix-label" for="subnet-prefix">/28</output><input id="subnet-prefix" type="range" min="0" max="32" value="28"></label></div><p id="subnet-error" class="exercise-error" role="status"></p><div class="bit-legend"><span><i class="net-key"></i> Network bits</span><span><i class="host-key"></i> Host bits</span></div><div class="bit-strip" aria-label="IPv4 address split into network and host bits"></div><div class="exercise-actions"><button type="button" id="subnet-reveal">Reveal calculation →</button><button type="button" class="quiet-button" id="subnet-reset">Reset example</button></div><div class="subnet-result" role="status" hidden></div>`;
      let result=null;
      const update=()=>{
        by(box,'.subnet-result').hidden=true;
        const prefix=Number(by(box,'#subnet-prefix').value);
        by(box,'#subnet-prefix-label').textContent='/'+prefix;
        try {
          result=models.subnet(by(box,'#subnet-ip').value.trim(),prefix);
          by(box,'#subnet-error').textContent='';
          by(box,'#subnet-ip').setAttribute('aria-invalid','false');
          by(box,'#subnet-reveal').disabled=false;
          by(box,'.bit-strip').innerHTML=Array.from({length:4},(_,oct)=>`<div class="bit-octet">${result.binary.slice(oct*8,oct*8+8).split('').map((bit,i)=>`<span class="${oct*8+i<prefix?'network-bit':'host-bit'}">${bit}</span>`).join('')}<small>OCTET ${oct+1}</small></div>`).join('');
          by(box,'.bit-strip').setAttribute('aria-label',`${prefix} network bits and ${32-prefix} host bits. Binary address ${result.binary.match(/.{8}/g).join(' . ')}`);
        } catch(error){
          result=null;by(box,'#subnet-error').textContent=error.message;
          by(box,'#subnet-ip').setAttribute('aria-invalid','true');by(box,'#subnet-reveal').disabled=true;
          by(box,'.bit-strip').innerHTML='';
        }
      };
      on(box,'#subnet-ip','input',update);on(box,'#subnet-prefix','input',update);
      on(box,'#subnet-reveal','click',()=>{
        if(!result)return;
        const a=result;
        by(box,'.subnet-result').innerHTML=`<div class="metric-grid"><div><span>Network / prefix</span><strong>${a.network}/${a.prefix}</strong></div><div><span>Broadcast</span><strong>${a.broadcast||'Not used'}</strong></div><div><span>Subnet mask</span><strong>${a.mask}</strong></div><div><span>${a.prefix<31?'Ordinary usable addresses':'Addresses'}</span><strong>${fmt(a.usable)}</strong></div></div><p><strong>${a.hostBits} host bits</strong> → 2<sup>${a.hostBits}</sup> = ${fmt(a.total)} total addresses.${a.prefix<31?' Reserve the network and broadcast: '+fmt(a.total)+' − 2 = '+fmt(a.usable)+'.':a.prefix===31?' A /31 point-to-point link can use both addresses.':' A /32 identifies one address.'}</p><p>Usable range: <code>${a.first}–${a.last}</code>.</p>${a.increment?`<p>Increment in octet ${a.octet}: <strong>${a.increment}</strong>. The entire subnet has ${fmt(a.total)} addresses.</p>`:''}<p class="exercise-caption">Ordinary IPv4 calculation. Cloud-platform reservations are not included.</p>`;
        by(box,'.subnet-result').hidden=false;
      });
      on(box,'#subnet-reset','click',()=>{by(box,'#subnet-ip').value='192.168.204.30';by(box,'#subnet-prefix').value='28';update();});update();
    },
    vlan(box){
      box.innerHTML=`<div class="exercise-controls"><label for="vlan-guest">Guest laptop’s switch port<select id="vlan-guest"><option value="20">VLAN 20 · Guests</option><option value="30">VLAN 30 · Servers</option></select></label><div class="exercise-checks">${checkbox('vlan-route','Inter-VLAN routing enabled')}${checkbox('vlan-allow','Allow guest → server TCP 445',false)}</div></div>
      <div class="network-stage"><svg viewBox="0 0 760 350" role="img" aria-labelledby="vlan-svg-title vlan-svg-desc"><title id="vlan-svg-title">Four devices on one managed switch</title><desc id="vlan-svg-desc">Staff devices occupy VLAN 10, the guest normally uses VLAN 20, and the file server occupies VLAN 30. Controls change guest membership and the routed path.</desc>
      <g class="network-cables"><path d="M105 106V185H140M285 106V185H300M475 106V185H460M655 106V185H620"/></g>
      <g class="device-node staff-node"><rect x="30" y="24" width="150" height="82" rx="8"/><text x="105" y="55">Staff laptop</text><text class="node-sub" x="105" y="81">VLAN 10</text></g>
      <g class="device-node staff-node"><rect x="210" y="24" width="150" height="82" rx="8"/><text x="285" y="55">Staff printer</text><text class="node-sub" x="285" y="81">VLAN 10</text></g>
      <g class="device-node guest-node"><rect x="400" y="24" width="150" height="82" rx="8"/><text x="475" y="55">Guest laptop</text><text class="node-sub" id="vlan-node-label" x="475" y="81">VLAN 20</text></g>
      <g class="device-node server-node"><rect x="580" y="24" width="150" height="82" rx="8"/><text x="655" y="55">File server</text><text class="node-sub" x="655" y="81">VLAN 30</text></g>
      <rect class="switch-chassis" x="40" y="160" width="680" height="70" rx="8"/><text class="switch-label" x="62" y="216">MANAGED SWITCH</text>
      <g class="switch-ports"><circle cx="140" cy="183" r="8"/><circle cx="300" cy="183" r="8"/><circle id="vlan-guest-port" cx="460" cy="183" r="8"/><circle class="server-port" cx="620" cy="183" r="8"/></g>
      <path class="vlan-direct" d="M475 106V183H655V106"/>
      <path class="vlan-routed" d="M475 106V260H460"/><path class="vlan-routed vlan-to-server" d="M560 300H655V106"/>
      <g class="policy-node"><rect x="315" y="256" width="270" height="77" rx="8"/><text x="450" y="284">Router / firewall</text><text class="node-sub" id="vlan-policy-label" x="450" y="310">Guest → server: DENY</text></g></svg></div>
      <div class="network-legend"><span class="staff-legend">● VLAN 10 / Staff</span><span class="guest-legend">● VLAN 20 / Guests</span><span class="server-legend">● VLAN 30 / Servers</span></div><div class="exercise-actions"><button type="button" id="vlan-test">Test guest → server</button><button type="button" id="vlan-reset" class="quiet-button">Reset network</button></div><div class="exercise-result" role="status">Choose the port and policy, then test TCP 445. Assume correctly addressed devices, a listening server, and no other network filters.</div>`;
      const update=()=>{
        const vlan=Number(by(box,'#vlan-guest').value),route=by(box,'#vlan-route').checked,allow=by(box,'#vlan-allow').checked;
        by(box,'#vlan-node-label').textContent='VLAN '+vlan;
        by(box,'.network-stage').dataset.guest=String(vlan);
        by(box,'.network-stage').dataset.path='idle';
        by(box,'.exercise-result').removeAttribute('data-outcome');
        by(box,'#vlan-policy-label').textContent=!route?'Routing disabled':'Guest → server: '+(allow?'ALLOW 445':'DENY 445');
        by(box,'#vlan-allow').disabled=!route||vlan===30;
        by(box,'#vlan-route').disabled=vlan===30;
        by(box,'.exercise-result').innerHTML=status('Ready to test',vlan===30?'The guest has been placed in the server VLAN. Predict whether an inter-VLAN deny will protect this path.':'The devices are in different VLANs. Predict whether routing and the rule will allow the connection.');
      };
      ['#vlan-guest','#vlan-route','#vlan-allow'].forEach(s=>on(box,s,'change',update));
      on(box,'#vlan-test','click',()=>{
        const result=models.vlan(Number(by(box,'#vlan-guest').value),by(box,'#vlan-route').checked,by(box,'#vlan-allow').checked);
        by(box,'.network-stage').dataset.path=result.code;
        by(box,'.exercise-result').dataset.outcome=result.allowed?'allow':'deny';
        by(box,'.exercise-result').innerHTML=status(result.title,result.reason,result.allowed);
      });
      on(box,'#vlan-reset','click',()=>{by(box,'#vlan-guest').value='20';by(box,'#vlan-route').checked=true;by(box,'#vlan-allow').checked=false;by(box,'.exercise-result').removeAttribute('data-outcome');update();});update();
    },
    syslog(box){
      const names=['Emergency','Alert','Critical','Error','Warning','Notice','Informational','Debug'];
      const messages=[{s:2,device:'srv-01',text:'Storage unavailable'},{s:4,device:'sw-01',text:'Uplink errors above threshold'},{s:6,device:'fw-01',text:'Blocked TCP 445 to file server'},{s:7,device:'app-01',text:'Detailed connection trace'}];
      box.innerHTML=`<div class="exercise-controls"><label for="syslog-threshold">Forward this level and more urgent<select id="syslog-threshold">${names.map((name,i)=>`<option value="${i}" ${i===4?'selected':''}>${i} · ${name}</option>`).join('')}</select></label><div class="collector-count" aria-hidden="true"><strong id="syslog-count">2 / 4</strong><span>messages forwarded</span></div></div><div class="log-feed">${messages.map((m,i)=>`<div class="log-row" data-log="${i}"><span class="severity-tag">${m.s} / ${names[m.s]}</span><div><strong>${m.device}</strong><span>${m.text}</span></div><span class="delivery-state"></span></div>`).join('')}</div><div class="exercise-result" role="status"></div>`;
      const update=()=>{
        const t=Number(by(box,'#syslog-threshold').value);let count=0;
        messages.forEach((m,i)=>{const passes=models.syslog(m.s,t),row=by(box,`[data-log="${i}"]`);if(passes)count++;row.dataset.delivered=String(passes);by(row,'.delivery-state').textContent=passes?'→ Forwarded':'× Filtered out';});
        by(box,'#syslog-count').textContent=count+' / 4';
        by(box,'.exercise-result').innerHTML=status(count+' of 4 messages forwarded',`Threshold ${t} includes severities 0 through ${t}. `+(t>=6?'The informational firewall deny reaches the collector. It can now be searched, but is not automatically an alert.':'The informational firewall deny is filtered out before collection. An empty search would not prove the connection never happened.'));
      };on(box,'#syslog-threshold','change',update);update();
    },
    dhcp(box){
      const steps=[['Discover','Client → local broadcast','“Is a DHCP server available?” The laptop has no lease for this network.'],['Offer','Server → client','“I can offer 10.20.30.50/24, gateway .1, and DNS .10.” This is an offer, not yet a confirmed lease.'],['Request','Client → servers','“I would like the offered address from this server.” The client identifies the selected offer.'],['Acknowledge','Server → client','“Lease confirmed.” The client can apply the address and options after its normal checks.']];
      box.innerHTML=`<div class="exercise-controls">${checkbox('dhcp-server','DHCP server reachable')}<span class="exercise-caption">Initial DHCPv4 lease · same subnet</span></div><div class="dora-track" aria-label="DHCP message sequence">${steps.map((s,i)=>`<div data-dora="${i}"><span>${s[0][0]}</span><strong>${s[0]}</strong></div>`).join('')}</div><div class="message-flight"><span>LAPTOP</span><span class="flight-arrow" aria-hidden="true">→ → →</span><span>DHCP SERVER</span></div><div class="lease-card"><span>CLIENT ADDRESS</span><strong id="lease-address">No lease yet</strong><p id="lease-options">Waiting for an offer.</p></div><div class="exercise-actions"><button type="button" id="dhcp-next">Send Discover →</button><button type="button" id="dhcp-reset" class="quiet-button">Start again</button></div><div class="exercise-result" role="status"></div>`;
      let step=-1;
      const reset=()=>{step=-1;box.querySelectorAll('[data-dora]').forEach(el=>el.dataset.state='waiting');by(box,'#lease-address').textContent='No lease yet';by(box,'#lease-options').textContent='Waiting for an offer.';by(box,'#dhcp-next').disabled=false;by(box,'#dhcp-next').textContent='Send Discover →';by(box,'.message-flight').dataset.direction='right';by(box,'.exercise-result').innerHTML=status('Ready','The laptop needs an address, mask, gateway, and DNS settings. Predict the first message.');};
      on(box,'#dhcp-next','click',()=>{
        if(step===0&&!by(box,'#dhcp-server').checked){by(box,'.exercise-result').innerHTML=status('No offer received','The client retries because the server cannot be reached. A Windows client may later use a 169.254 link-local address; it has not received a usable DHCP lease for this network.');by(box,'#dhcp-next').disabled=true;by(box,'#dhcp-next').textContent='Waiting for server';return;}
        step++;
        box.querySelectorAll('[data-dora]').forEach((el,i)=>el.dataset.state=i===step?'active':i<step?'done':'waiting');
        by(box,'.message-flight').dataset.direction=step%2===0?'right':'left';
        by(box,'.exercise-result').innerHTML=status(steps[step][0]+' · '+steps[step][1],steps[step][2],step===3);
        if(step===1){by(box,'#lease-address').textContent='10.20.30.50 offered';by(box,'#lease-options').textContent='The server has offered this address; the client has not yet received an acknowledgement.';}
        if(step===3){by(box,'#lease-address').textContent='10.20.30.50 /24';by(box,'#lease-options').textContent='Gateway 10.20.30.1 · DNS 10.20.30.10 · Lease 8 hours (example)';by(box,'#dhcp-next').textContent='Lease obtained';by(box,'#dhcp-next').disabled=true;}
        else by(box,'#dhcp-next').textContent='Next: '+steps[step+1][0]+' →';
      });on(box,'#dhcp-reset','click',reset);on(box,'#dhcp-server','change',reset);reset();
    },
    response(box){
      const steps=[
        {role:'Endpoint / EDR',title:'A suspicious program starts',detail:'The endpoint agent observes an attachment launching a script. It records the process chain and raises a detection. A supported policy may stop the process.',evidence:'Attachment → script → new executable',task:'Check the actual action result, not just the detection label.'},
        {role:'Cross-source / XDR',title:'Related signals add context',detail:'When the relevant sources are integrated, the platform can associate the endpoint activity with the delivered email and the same user’s sign-in activity.',evidence:'Email + endpoint + identity signals',task:'Determine whether these signals belong to the same incident.'},
        {role:'People / MDR',title:'The managed team investigates',detail:'The MDR analyst evaluates the alert and available context. Under the agreed authority, they may isolate the endpoint and communicate the evidence and outstanding tasks.',evidence:'Investigation + response + service handoff',task:'Read what the provider already did and verify containment.'},
        {role:'Customer team',title:'Finish remediation and recovery',detail:'The customer’s incident owner coordinates the remaining account review, cleanup, recovery, and communication. Ownership and scope depend on the service agreement.',evidence:'Validated recovery + documented decisions',task:'Verify restoration criteria before reconnecting the device.'}
      ];
      box.innerHTML=`<div class="response-track" role="group" aria-label="Explore investigation roles">${steps.map((s,i)=>`<button type="button" data-response="${i}" aria-pressed="${i===0}"><span>0${i+1}</span>${s.role}</button>`).join('')}</div><div class="response-detail" role="status"></div><p class="exercise-caption">One teaching sequence. In real incidents, these activities can overlap; XDR is not a prerequisite for MDR.</p>`;
      const show=i=>{const s=steps[i];box.querySelectorAll('[data-response]').forEach((b,j)=>b.setAttribute('aria-pressed',String(i===j)));by(box,'.response-detail').innerHTML=`<span class="evidence-strip">${esc(s.evidence)}</span><h3>${esc(s.title)}</h3><p>${esc(s.detail)}</p><div class="analyst-prompt"><span>YOUR NEXT QUESTION</span><p>${esc(s.task)}</p></div>`;};
      box.querySelectorAll('[data-response]').forEach((b,i)=>b.addEventListener('click',()=>show(i)));show(0);
    },
    m365(box){
      box.innerHTML=`<div class="access-signals">${checkbox('access-finance','User belongs to Finance')}${checkbox('access-mfa','MFA requirement satisfied')}${checkbox('access-compliance','Device marked compliant',false)}</div><div class="access-map"><div><span>IDENTITY</span><strong>Entra ID</strong><p>User, groups & authentication</p></div><div><span>DEVICE</span><strong>Intune</strong><p>Compliance result</p></div><div class="access-policy"><span>SIGN-IN POLICY</span><strong>Conditional Access</strong><p>MFA + compliant device</p><p id="access-policy-result"></p></div><div class="access-resource"><span>RESOURCE PERMISSION</span><strong>SharePoint · Finance files</strong><p>Finance group membership required</p><p id="access-decision">Blocked</p></div></div><div class="exercise-result" role="status"></div><p class="exercise-caption">Fictional model: one Conditional Access policy applies to all users; SharePoint separately grants the Finance group access to these files. Other policies and session behavior are omitted.</p>`;
      const update=()=>{const r=models.access(by(box,'#access-finance').checked,by(box,'#access-mfa').checked,by(box,'#access-compliance').checked);by(box,'.access-map').dataset.allowed=String(r.allowed);by(box,'#access-policy-result').textContent=r.policyAllowed?'Sign-in requirements satisfied':'Sign-in requirements not met';by(box,'#access-decision').textContent=r.allowed?'Files accessible':r.policyAllowed?'SharePoint permission missing':'Sign-in blocked';by(box,'.exercise-result').innerHTML=status(r.allowed?'Sign-in and file permissions satisfied':'Access requirement not met',r.allowed?'The sign-in policy passes, and SharePoint grants the Finance group access to these files.':'Missing: '+r.missing.join('; ')+'. '+(!by(box,'#access-compliance').checked?'Inspect compliance details in Intune and the policy result in Entra.':!by(box,'#access-mfa').checked?'Review authentication details in Entra.':'The sign-in policy passes. Check group membership and the resource’s SharePoint permissions.'),r.allowed);};
      box.querySelectorAll('input').forEach(input=>input.addEventListener('change',update));update();
    },
    tcp(box){
      box.innerHTML=`<div class="exercise-controls"><label for="tcp-options">Option bytes before final padding <output id="tcp-option-count" for="tcp-options">10</output><input id="tcp-options" type="range" min="0" max="40" value="10"></label><div class="collector-count"><strong id="tcp-header-count">32 bytes</strong><span>total header length</span></div></div><div class="byte-legend"><span>■ Base header</span><span>■ Options</span><span>■ Padding</span></div><div class="tcp-byte-grid" aria-label="TCP header in rows of four bytes"></div><div class="payload-start">APPLICATION DATA BEGINS HERE ↓</div><div class="exercise-result" role="status"></div><p class="exercise-caption">Each square is one byte; each row is four bytes. This is a size model, not a valid option encoding. TCP headers range from 20 to 60 bytes.</p>`;
      const update=()=>{const n=Number(by(box,'#tcp-options').value),r=models.tcp(n);by(box,'#tcp-option-count').textContent=n;by(box,'#tcp-header-count').textContent=r.header+' bytes';by(box,'.tcp-byte-grid').innerHTML=Array.from({length:r.header},(_,i)=>`<span class="tcp-byte ${i<20?'base-byte':i<20+n?'option-byte':'padding-byte'}" aria-hidden="true">${i<20?'HDR':i<20+n?'OPT':'PAD'}</span>`).join('');by(box,'.tcp-byte-grid').setAttribute('aria-label',`20 base bytes, ${n} option bytes, ${r.padding} padding bytes. ${r.header} bytes total.`);by(box,'.exercise-result').innerHTML=status('Data Offset = '+r.offset,`20 + ${n} + ${r.padding} = ${r.header} header bytes. Divide by 4: the TCP Data Offset field stores ${r.offset}. The next byte is the start of the payload, ${r.header} bytes from the beginning of this TCP header.`,true);};on(box,'#tcp-options','input',update);update();
    }
  };
  const mounted=new WeakSet();
  function mount(container=document){
    container.querySelectorAll('[data-exercise]').forEach(section=>{
      const setup=setups[section.dataset.exercise],box=section.querySelector('.exercise-mount');
      if(!setup||!box||mounted.has(box))return;
      setup(box);mounted.add(box);
      box.querySelectorAll('.network-stage').forEach(stage=>{stage.tabIndex=0;stage.setAttribute('role','region');stage.setAttribute('aria-label','Interactive network diagram; scroll horizontally on small screens.');});
    });
  }
  root.StudyExercises={mount};
  mount();
})(globalThis);

(() => {
  'use strict';
  const pages = [
    {name:'Vulnerability scanning lab',url:'vulnerability-scan.html',type:'Lab',keywords:'tenable nessus azure windows vulnerability scan remediation patching stig'},
    {name:'Azure honeypot lab',url:'soc-honeypot.html',type:'Lab',keywords:'soc azure sentinel windows ama failed logins 4625 honeypot'},
    {name:'pwning my light bulbs',url:'lifx-pentest.html',type:'Lab',keywords:'lifx iot udp 56700'},
    {name:'whoami',url:'index.html#about',type:'About',keywords:'farris khan certifications security azure'},
    {name:'home lab',url:'index.html',type:'Home',keywords:'map home'},
    {name:'knowledge base',url:'index.html#knowledge',type:'Knowledge constellation',keywords:'notes study review'}
  ].concat(window.knowledgePages || []);
  const $ = selector => document.querySelector(selector);
  if ($('#year')) $('#year').textContent = new Date().getFullYear();
  // A schematic derived from active labs; never contacts lab devices.
  const nodes = {
    bulb:['DEVICE 01 / LIFX','A light bulb with an open door.','A local control protocol. No credentials required. Follow the packets from discovery to control.','lifx-pentest.html','Read the LIFX lab'],
    host:['WORKBENCH / KALI LINUX','Start with the right questions.','Discover the host. Identify the service. Understand the protocol. Follow the reasoning in the study archive.','index.html#knowledge','Explore the study notes']
  };
  document.querySelectorAll('[data-node]').forEach(button => button.addEventListener('click', () => {
    document.querySelectorAll('[data-node]').forEach(node => node.setAttribute('aria-pressed',String(node === button)));
    const [tag,title,copy,url,label] = nodes[button.dataset.node];
    $('#node-tag').textContent=tag; $('#node-title').textContent=title; $('#node-copy').textContent=copy;
    $('#node-link').href=url; $('#node-link').setAttribute('aria-label',label);
  }));
  // Native dialog supplies modal focus containment and Escape handling.
  let dialog = $('#command-dialog');
  if (!dialog) {
    dialog=document.createElement('dialog'); dialog.id='command-dialog'; dialog.setAttribute('aria-labelledby','command-title');
    dialog.innerHTML='<div class="command-heading"><h2 id="command-title">Where to?</h2><button id="close-command" aria-label="Close command menu">Esc</button></div><label class="sr-only" for="command-search">Search pages</label><input id="command-search" type="search" placeholder="Search labs and study notes…" autocomplete="off"><div id="command-results"></div><p class="command-help">↑ ↓ navigate <span>↵ open</span><span>esc close</span></p>';
    document.body.append(dialog);
  }
  let selected=0;
  const results=$('#command-results'), search=$('#command-search');
  function highlight(){results.querySelectorAll('a').forEach((a,i)=>{a.classList.toggle('selected',i===selected);if(i===selected)a.setAttribute('aria-current','true');else a.removeAttribute('aria-current');});}
  function renderResults(){
    selected=0;results.replaceChildren();
    const query=search.value.trim().toLowerCase();
    pages.filter(page => (page.name+' '+page.keywords+' '+page.type).toLowerCase().includes(query)).forEach(page=>{
      const a=document.createElement('a');a.href=page.url;
      const name=document.createElement('span');name.textContent=page.name;
      const kind=document.createElement('small');kind.textContent=page.type+' ↗';
      a.append(name,kind);a.addEventListener('click',()=>dialog.close());results.append(a);
    });
    if(!results.children.length){const p=document.createElement('p');p.textContent='No matches. Try “DNS”, “Timus”, or “LIFX”.';results.append(p);}
    highlight();
  }
  function openCommands(){search.value='';renderResults();dialog.showModal();search.focus();}
  document.querySelectorAll('[data-command]').forEach(button=>button.addEventListener('click',openCommands));
  $('#close-command').addEventListener('click',()=>dialog.close());
  dialog.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();}});
  search.addEventListener('input',renderResults);
  search.addEventListener('keydown',event=>{
    const links=results.querySelectorAll('a');if(!links.length)return;
    if(event.key==='ArrowDown'||event.key==='ArrowUp'){event.preventDefault();selected=(selected+(event.key==='ArrowDown'?1:-1)+links.length)%links.length;highlight();links[selected].scrollIntoView({block:'nearest'});}
    if(event.key==='Enter'){event.preventDefault();links[selected].click();}
  });
  document.addEventListener('keydown',event=>{if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='k'){event.preventDefault();dialog.open?dialog.close():openCommands();}});
  let catEnabled=false, catLoaded=false;
  function toggleCat(){
    catEnabled=!catEnabled;
    if(catEnabled&&!catLoaded){const script=document.createElement('script');script.src='oneko.js';script.addEventListener('load',()=>{if($('#oneko'))$('#oneko').style.display=catEnabled?'block':'none';});document.body.append(script);catLoaded=true;}
    if($('#oneko'))$('#oneko').style.display=catEnabled?'block':'none';
    return catEnabled?'Not the cat you were expecting?':'Meow.';
  }
  if($('#terminal-form')){
    const output=$('#terminal-output'),input=$('#terminal-input'),history=[];let historyIndex=0;
    const print=text=>{const p=document.createElement('p');p.textContent=text;output.append(p);while(output.children.length>50)output.firstElementChild.remove();output.scrollTop=output.scrollHeight;};
    $('#terminal-form').addEventListener('submit',event=>{
      event.preventDefault();const value=input.value.trim();if(!value)return;history.push(value);historyIndex=history.length;input.value='';print('visitor:~$ '+value);
      const command=value.toLowerCase();
      if(command==='clear'){output.replaceChildren();return;}
      if(command==='help')print('help       available commands\nls         browse the site\nwhoami     meet Farris\nopen dns   open a study note\ncat        toggle the companion\nclear      clear this terminal\nTip: use ↑ / ↓ for command history.');
      else if(command==='whoami')print('Farris Khan\nsecurity / ops tinkerer\nMicrosoft Certified: Security Operations Analyst Associate (SC-200) · In Progress\nMicrosoft Certified: Azure Administrator Associate (AZ-104) · In Progress');
      else if(command==='ls'){pages.forEach(page=>{const p=document.createElement('p'),a=document.createElement('a');a.href=page.url;a.textContent=page.name+' ↗';p.append(a);output.append(p);});}
      else if(command==='cat')print(toggleCat());
      else if(command.startsWith('open ')){const name=command.slice(5).trim();const page=pages.find(p=>p.name.toLowerCase()===name||p.slug===name||p.url.replace('.html','')===name);if(page)window.location.assign(page.url);else print('Page not found. Use ls to see the available names.');}
      else print('Unknown command. Type help to see what this shell can do.');
      output.scrollTop=output.scrollHeight;
    });
    input.addEventListener('keydown',event=>{if(event.key==='ArrowUp'||event.key==='ArrowDown'){event.preventDefault();historyIndex=Math.max(0,Math.min(history.length,historyIndex+(event.key==='ArrowUp'?-1:1)));input.value=history[historyIndex]||'';}});
  }
})();

// An educational replay of the observations in the original writeups.
(() => {
  const map=document.querySelector('.topology');if(!map)return;
  const traces={
    bulb:[['01 / DISCOVER','Host discovery identifies a Lifi Labs device on the LAN.'],['02 / WRONG TRANSPORT','All TCP ports are closed. That does not tell us about UDP.'],['03 / ASK DIFFERENTLY','UDP 56700 reports open|filtered. Silence alone is inconclusive.'],['04 / SPEAK THE PROTOCOL','A correctly formed LIFX request discovers and controls the bulb without credentials.']],
    host:[['01 / ORIENT','Confirm the local interface and subnet before investigating.'],['02 / DISCOVER','Find the devices on your own network.'],['03 / ENUMERATE','Identify services and distinguish TCP from UDP.'],['04 / DOCUMENT','Record what you observed, what remains uncertain, and what you would test next.']]
  };
  let device='bulb',step=-1;
  const replay=document.createElement('div');replay.className='discovery-replay';
  const output=document.createElement('p');output.setAttribute('aria-live','polite');output.textContent='Follow the discovery, one observation at a time.';
  const button=document.createElement('button');button.textContent='Replay discovery →';
  replay.append(output,button);map.querySelector('.panel-bottom').before(replay);
  button.addEventListener('click',()=>{step=(step+1)%4;const [label,text]=traces[device][step];output.replaceChildren();const strong=document.createElement('strong');strong.textContent=label;output.append(strong,document.createTextNode(text));button.textContent=step===3?'Replay again ↺':'Next observation →';});
  map.querySelectorAll('[data-node]').forEach(node=>node.addEventListener('click',()=>{device=node.dataset.node;step=-1;output.textContent='Follow the discovery, one observation at a time.';button.textContent='Replay discovery →';}));
})();

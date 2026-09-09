(() => {
  'use strict';
  const notes = window.KHAN_NOTES || [];
  const root = document.querySelector('#khanos-root');
  if (!notes.length) { root.insertAdjacentHTML('afterbegin','<p>The desktop could not load. The study links below remain available.</p>'); return; }
  const esc = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const bySlug = new Map(notes.map((note, i) => [note.slug, {...note, index:i}]));
  const categories = [...new Set(notes.map(n => n.category))];
  let palette=window.KhanThemes.initial;
  const categoryOrder=['Networking','Security operations','Identity & access','Cloud & telemetry','IT operations'];
  const colorsOf = () => Object.fromEntries(categoryOrder.map((c,i)=>[c,palette.categories[i]||palette.ink]));
  let colors=colorsOf();
  const colorOf = n => colors[n.category] || palette.accent;
  const searchText = n => `${n.title} ${n.category} ${n.principle} ${n.keywords||''}`.toLowerCase();
  const shortCategories = {'Networking':'Networks', 'Security operations':'Security', 'Identity & access':'Identity', 'Cloud & telemetry':'Telemetry', 'IT operations':'IT operations'};
  const mobile = matchMedia('(max-width:760px)');
  const reduced = matchMedia('(prefers-reduced-motion:reduce)');
  const thumbnail = new URLSearchParams(location.search).has('thumbnail');
  document.body.classList.toggle('in-preview', thumbnail);
  document.body.classList.toggle('reduced-motion', reduced.matches);
  const state = {selected:bySlug.has('subnetting') ? 'subnetting' : notes[0].slug, category:'All', query:'', mode:'map', trace:false, active:'shell', z:10, motion:!reduced.matches, reader:null};
  const userIcon = '<svg class="user-icon" xmlns="http://www.w3.org/2000/svg" width="25" height="25" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><circle cx="12" cy="7" r="4"/><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/></svg>';
  // Reuse Shiftrun's Lucide shield; currentColor follows the dock's palette accent.
  const shiftrunIcon = '<svg xmlns="http://www.w3.org/2000/svg" width="25" height="25" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/></svg>';
  const windowHTML = (id, title, icon, content, hidden=false) => `<section id="app-${id}" class="hybrid-window window-${id}" data-window="${id}" role="region" aria-labelledby="title-${id}" tabindex="-1" ${hidden?'hidden':''}>
    <header class="window-bar"><span class="window-caption" id="title-${id}"><i aria-hidden="true">${icon}</i>${title}</span><div class="window-controls"><button type="button" data-minimize aria-label="Minimize ${title}" title="Minimize">−</button><button type="button" data-maximize aria-label="Maximize ${title}" title="Maximize">□</button><button type="button" data-close aria-label="Close ${title}" title="Close">×</button></div></header>${content}<svg class="window-tracer" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false"><rect pathLength="1000"/></svg><button type="button" class="resize-grip" aria-label="Resize ${title} with arrow keys" title="Drag to resize; arrow keys when focused">◢</button></section>`;
  root.innerHTML = `<header class="hybrid-top"><div><a class="hybrid-brand" href="index.html">Khan<span>OS</span></a><span class="edition">PERSONAL WORKSPACE</span></div><div><details class="palette-menu"><summary aria-label="Choose color palette"><i class="current-swatch" aria-hidden="true"></i><span class="current-palette">${palette.name}</span><span aria-hidden="true">⌄</span></summary><div class="palette-options"><span class="eyebrow">COLOR / ATMOSPHERE</span>${window.KhanThemes.list.map(p=>`<button data-palette="${p.id}" aria-pressed="${p.id===palette.id}"><span class="palette-dots" aria-hidden="true">${p.swatches.map(c=>`<i style="background:${c}"></i>`).join('')}</span><span>${p.name}<small>${p.subtitle}</small></span><b aria-hidden="true">${p.id===palette.id?'✓':'↗'}</b></button>`).join('')}</div></details><button data-reset>Reset layout</button><button data-motion aria-pressed="${state.motion}">${state.motion?'Pause motion':'Enable motion'}</button></div></header>
    <main id="main" class="hybrid-workspace" tabindex="-1" aria-label="Farris Khan’s interactive desktop"><canvas id="signal-backdrop" aria-hidden="true"></canvas><div class="ambient-vignette"></div><span class="ambient-wordmark" aria-hidden="true">k/f</span>
    ${windowHTML('profile','Whoami',userIcon,`<div class="window-content identity-card"><div class="identity-monogram" aria-hidden="true">k/f</div><h1>Farris Khan<span>.</span></h1><p class="role">security / ops tinkerer</p><div class="identity-studies identity-education"><small>EDUCATION</small><div><strong>Bachelor of Science in Cybersecurity</strong><span>University of South Florida</span></div></div><div class="identity-studies"><small>CERTIFICATIONS</small><div><strong>Security Operations Analyst Associate</strong><span>SC-200 · In Progress</span></div><div><strong>Azure Administrator Associate</strong><span>AZ-104 · In Progress</span></div></div></div>`)}
    ${windowHTML('featured','Featured item',shiftrunIcon,`<div class="window-content featured-content"><span class="featured-category">SECURITY OPERATIONS / GAME</span><h2>Shiftrun<span aria-hidden="true">.</span></h2><p>Work a simulated security shift. Investigate incidents, weigh the evidence, and practice response decisions.</p><a class="featured-launch" href="shiftrun/">Launch Shiftrun <span aria-hidden="true">↗</span></a></div>`)}
    ${windowHTML('shell','Local shell','>_',`<div class="shell-surface"><div class="shell-session"><span><i aria-hidden="true"></i>visitor@khanfarris</span><span>~/ personal lab</span></div><div class="shell-scroll" id="terminal-output" role="log" aria-label="Terminal output" aria-relevant="additions text"><div class="shell-welcome"><span class="shell-overline"><span class="shell-brand-name">KHAN</span>OS / LOCAL SHELL</span><h2>Welcome, visitor<span>.</span></h2><p>A tiny shell for a curious mind.<br>Try <strong>help</strong>, <strong>ls</strong>, <strong>whoami</strong>, or <strong>cat</strong>.</p><div class="shell-starters" aria-label="Try a command"><button data-command="help"><span>01</span>help <b>↵</b></button><button data-command="ls"><span>02</span>ls <b>↵</b></button><button data-command="open knowledge"><span>03</span>Open knowledge base <b>↵</b></button></div></div></div><form id="terminal-form" autocomplete="off"><label for="terminal-input"><span>visitor:~$</span><span class="sr-only">Enter a site command</span></label><input id="terminal-input" name="command" placeholder="help" spellcheck="false" autocapitalize="off" maxlength="120"><button type="submit" aria-label="Run command">↵</button></form><div class="shell-footer"><span>Site navigation only. Commands run in your browser.</span><span>↑ ↓ HISTORY</span></div></div>`)}
    ${windowHTML('knowledge','Knowledge / Constellation','⌘',`<div class="knowledge-tools"><label class="knowledge-search"><span aria-hidden="true">⌕</span><input id="knowledge-query" type="search" aria-label="Filter study notes" placeholder="Find a concept…" autocomplete="off"></label><div class="map-mode" role="group" aria-label="Knowledge display"><button data-mode="map" aria-pressed="true">Map</button><button data-mode="list" aria-pressed="false">List</button></div></div>
      <div class="knowledge-categories" role="group" aria-label="Filter by subject"><button data-category="All" aria-pressed="true">All subjects</button>${categories.map(c=>`<button data-category="${esc(c)}" aria-pressed="false" aria-label="${esc(c)}"><i style="--chip:${colors[c]||'#b7f4ab'}" aria-hidden="true"></i>${esc(shortCategories[c]||c)}</button>`).join('')}</div>
      <div class="knowledge-body"><div class="graph-frame" aria-label="Connected study notes"><div class="graph-space"><svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"></svg><div class="graph-nodes"></div></div><p class="graph-empty" hidden>No matching concepts.<br>Try a different search or subject.</p><div class="graph-caption"><span>SELECT TO EXPLORE · DOUBLE-CLICK TO OPEN</span><b>${notes.length} NOTES</b></div></div><div class="knowledge-list" aria-label="Study note list" hidden></div><aside class="knowledge-detail" aria-label="Selected study note"></aside></div>
      <footer class="knowledge-footer"><span id="knowledge-count" aria-live="polite"></span><button data-trace aria-pressed="false">Trace connections</button></footer>`,true)}
    ${windowHTML('cases','Labs','▣','<div class="window-content case-content"></div>',true)}
    ${windowHTML('note','Study note','≡','<article class="window-content note-sheet"></article>',true)}
    ${windowHTML('search','Search the archive','⌕','<div class="window-content search-body"><input class="command-search" aria-label="Search all study notes" type="search" placeholder="What are you exploring?" autocomplete="off"><span class="eyebrow">STUDY NOTES</span><div class="command-results"></div></div>',true)}
    <div class="desktop-line"><b>KHANFARRIS</b><span>PERSONAL LAB / ${notes.length} NOTES</span></div><span class="desktop-label">© ${new Date().getFullYear()} KHANFARRIS</span>
    <nav class="hybrid-dock" aria-label="Desktop apps">${[['profile',userIcon,'Whoami'],['knowledge','⌘','Knowledge'],['note','≡','Reader'],['cases','▣','Labs'],['featured',shiftrunIcon,'Shiftrun'],['shell','>_','Shell'],['search','⌕','Search']].map(([id,icon,label])=>{const button=`<button data-app="${id}" aria-controls="app-${id}" ${id==='note'?'hidden':''} ${id==='featured'?'aria-describedby="shiftrun-dock-hint"':''}><b aria-hidden="true">${icon}</b><span>${label}</span></button>`;return id==='featured'?`<div class="dock-shiftrun">${button}<div class="dock-launch-menu"><a href="shiftrun/">Launch Shiftrun <span aria-hidden="true">↗</span></a></div><span id="shiftrun-dock-hint" class="sr-only">Double-click to launch Shiftrun. Press Arrow Up for the launch link.</span></div>`:button;}).join('')}</nav><span class="sr-only" id="desktop-status" role="status"></span></main>`;
  const $ = selector => root.querySelector(selector);
  const $$ = selector => [...root.querySelectorAll(selector)];
  const workspace = $('.hybrid-workspace');
  const windows = new Map($$('[data-window]').map(el => [el.dataset.window, el]));
  const restores = new Map();
  const manuallySized = new Set();
  const manuallyPlaced = new Set();
  function fitFeatured() {
    const el=windows.get('featured'), profile=windows.get('profile');
    if(mobile.matches||el.hidden||el.classList.contains('maximized')||manuallyPlaced.has('featured')||manuallySized.has('featured'))return;
    if(profile.hidden||profile.classList.contains('maximized')){constrain(el);return;}
    const top=profile.offsetTop+profile.offsetHeight+18;
    el.style.width=profile.offsetWidth+'px';
    el.style.height='auto';
    const desired=Math.ceil(el.querySelector('.featured-content').scrollHeight+el.querySelector('.window-bar').offsetHeight+2);
    const remaining=workspace.clientHeight-top-110;
    applyGeometry(el,fitted(el,{x:profile.offsetLeft,y:top,w:profile.offsetWidth,h:Math.min(desired,Math.max(200,remaining))}));
  }
  function fitProfile() {
    const el=windows.get('profile');
    if(mobile.matches||el.hidden||el.classList.contains('maximized')||manuallySized.has('profile'))return;
    const card=el.querySelector('.identity-card');
    // Measure at its natural height, including education and certifications, after the fonts have settled.
    el.style.height='auto';
    const desired=Math.ceil(card.scrollHeight+el.querySelector('.window-bar').offsetHeight+2);
    applyGeometry(el,fitted(el,{...geometry(el),h:desired}));
    card.scrollTop=0;
    fitFeatured();
  }
  const announce = message => { $('#desktop-status').textContent = message; };
  function updateDock() {
    $$('.hybrid-dock [data-app]').forEach(button => {
      const open = !windows.get(button.dataset.app).hidden;
      const running = button.dataset.app==='note' ? Boolean(state.reader) : open;
      button.hidden=button.dataset.app==='note'&&!running;
      button.classList.toggle('is-open', running);
      button.setAttribute('aria-expanded', String(open));
      if (state.active === button.dataset.app && open) button.setAttribute('aria-current', 'true');
      else button.removeAttribute('aria-current');
    });
    $('.hybrid-dock').style.setProperty('--dock-count',String($$('.hybrid-dock [data-app]').filter(button=>!button.hidden).length));
  }
  function activate(id, focus=false) {
    const el = windows.get(id);
    if (!el || el.hidden) return;
    state.active = id;
    windows.forEach(w => {w.classList.toggle('active-window', w===el); w.classList.toggle('mobile-current', w===el);});
    // Keep the dock and global controls above the windows, even after many selections.
    const ordered = [...windows.values()].filter(w=>w!==el).sort((a,b)=>(+a.style.zIndex||5)-(+b.style.zIndex||5));
    ordered.forEach((w,i)=>w.style.zIndex=String(i+3));
    el.style.zIndex='10';
    updateDock();
    if (signalWidth) paintSignalOnce();
    if (focus) el.focus({preventScroll:true});
  }
  function showWindow(id, focus=true) {
    const el = windows.get(id);
    if (!el) return;
    if (id==='note' && !state.reader) renderReader(state.selected);
    const wasHidden=el.hidden;
    el.hidden=false;
    if (wasHidden) {el.classList.remove('is-opening'); void el.offsetWidth; el.classList.add('is-opening');}
    if (!mobile.matches) constrain(el);
    if(id==='profile'&&wasHidden){manuallySized.delete('profile');fitProfile();}
    if(id==='featured'&&wasHidden)fitFeatured();
    activate(id,focus);
    if (id==='search' && focus) $('.command-search').focus({preventScroll:true});
    if (id==='shell' && focus) $('#terminal-input').focus({preventScroll:true});
  }
  function clearReader() {
    state.reader=null;
    $('.note-sheet').replaceChildren();
    $('#title-note').innerHTML='<i aria-hidden="true">≡</i>Study note';
    if(location.hash.startsWith('#note-')){
      const url=new URL(location.href);url.hash='';history.replaceState(null,'',url);
    }
  }
  function hideWindow(id, close=false) {
    const el = windows.get(id);
    el.hidden=true;
    if(id==='note'&&close)clearReader();
    if (id===state.active) {
      const next=[...windows.entries()].filter(([,w])=>!w.hidden).sort((a,b)=>(+b[1].style.zIndex||0)-(+a[1].style.zIndex||0))[0];
      if (next) activate(next[0],true);
      else {state.active=''; windows.forEach(w=>w.classList.remove('mobile-current')); $(`.hybrid-dock [data-app="${id==='note'&&close?'knowledge':id}"]`).focus();}
    }
    updateDock();
    const label=id==='profile'?'Whoami':id==='featured'?'Shiftrun':id==='note'?'Reader':id;
    announce(id==='note'&&close?'Reader closed. Open a study note to launch it again.':`${label} ${close?'closed':'minimized'}. Reopen it from the dock.`);
  }
  function geometry(el) {return {x:el.offsetLeft,y:el.offsetTop,w:el.offsetWidth,h:el.offsetHeight};}
  function applyGeometry(el, box) {
    Object.assign(el.style,{left:box.x+'px',top:box.y+'px',width:box.w+'px',height:box.h+'px'});
  }
  function fitted(el, box) {
    const css=getComputedStyle(el), availableW=Math.max(280,workspace.clientWidth-24), availableH=Math.max(220,workspace.clientHeight-126);
    const minW=Math.min(parseFloat(css.minWidth)||280,availableW), minH=Math.min(parseFloat(css.minHeight)||220,availableH);
    const w=Math.min(availableW,Math.max(minW,box.w)), h=Math.min(availableH,Math.max(minH,box.h));
    return {w,h,x:Math.max(12,Math.min(box.x,workspace.clientWidth-w-12)),y:Math.max(12,Math.min(box.y,workspace.clientHeight-h-110))};
  }
  function constrain(el) {if (!mobile.matches) applyGeometry(el, fitted(el,geometry(el)));}
  function maximize(el) {
    if (mobile.matches) return;
    const id=el.dataset.window;
    if (el.classList.contains('maximized')) {el.classList.remove('maximized'); applyGeometry(el,fitted(el,restores.get(id)||geometry(el)));}
    else {restores.set(id,geometry(el));el.classList.add('maximized');applyGeometry(el,{x:12,y:12,w:workspace.clientWidth-24,h:workspace.clientHeight-126});}
    const button=el.querySelector('[data-maximize]');
    button.textContent=el.classList.contains('maximized')?'▧':'□';
    button.setAttribute('aria-label',`${el.classList.contains('maximized')?'Restore':'Maximize'} ${id} window`);
    button.title=el.classList.contains('maximized')?'Restore':'Maximize';
    activate(id);
  }
  function resetLayout() {
    restores.clear();
    manuallySized.clear();
    manuallyPlaced.clear();
    clearReader();
    windows.forEach((el,id)=>{el.removeAttribute('style');el.classList.remove('maximized','is-moving');el.hidden=!['profile','featured','shell'].includes(id);const b=el.querySelector('[data-maximize]');b.textContent='□';b.setAttribute('aria-label','Maximize '+id+' window');b.title='Maximize';});
    renderCases();
    if (!mobile.matches) windows.forEach(el=>{if (!el.hidden) constrain(el);});
    fitProfile();
    activate('shell'); announce('Desktop layout reset. Whoami, Shiftrun and local shell are open.');
  }
  windows.forEach((el,id)=>{
    el.addEventListener('pointerdown',()=>activate(id));
    el.addEventListener('focusin',()=>activate(id));
    el.querySelector('[data-close]').onclick=()=>hideWindow(id,true);
    el.querySelector('[data-minimize]').onclick=()=>hideWindow(id);
    el.querySelector('[data-maximize]').onclick=()=>maximize(el);
    el.querySelector('.window-bar').addEventListener('dblclick',event=>{if (!event.target.closest('button')) maximize(el);});
    const draggable=(handle,resizing)=>{
      handle.addEventListener('pointerdown',event=>{
        if (mobile.matches || el.classList.contains('maximized') || event.button!==0 || (!resizing && event.target.closest('button'))) return;
        event.preventDefault(); activate(id);
        const start=geometry(el), sx=event.clientX, sy=event.clientY;
        el.classList.add('is-moving'); handle.setPointerCapture(event.pointerId);
        const move=e=>{
          const dx=e.clientX-sx,dy=e.clientY-sy;
          if(resizing)manuallySized.add(id);else manuallyPlaced.add(id);
          applyGeometry(el,fitted(el,resizing?{...start,w:start.w+dx,h:start.h+dy}:{...start,x:start.x+dx,y:start.y+dy}));
        };
        const end=()=>{el.classList.remove('is-moving');handle.removeEventListener('pointermove',move);handle.removeEventListener('pointerup',end);handle.removeEventListener('pointercancel',end);handle.removeEventListener('lostpointercapture',end);};
        handle.addEventListener('pointermove',move);handle.addEventListener('pointerup',end);handle.addEventListener('pointercancel',end);handle.addEventListener('lostpointercapture',end);
      });
    };
    draggable(el.querySelector('.window-bar'),false); draggable(el.querySelector('.resize-grip'),true);
    el.querySelector('.resize-grip').addEventListener('keydown',event=>{
      if (!event.key.startsWith('Arrow') || mobile.matches || el.classList.contains('maximized')) return;
      event.preventDefault(); const box=geometry(el), step=event.shiftKey?40:10;
      manuallySized.add(id);
      box.w+=event.key==='ArrowRight'?step:event.key==='ArrowLeft'?-step:0;
      box.h+=event.key==='ArrowDown'?step:event.key==='ArrowUp'?-step:0;
      applyGeometry(el,fitted(el,box));
    });
  });

  const shellPages=[
    {name:'pwning my light bulbs',slug:'lifx',kind:'case',target:'lifx',aliases:['lifx-pentest']},
    {name:'Azure honeypot lab',slug:'soc',kind:'case',target:'soc',aliases:['soc-honeypot','honeypot','sentinel','azure']},
    {name:'Labs',slug:'labs',kind:'app',target:'cases',aliases:['lab','cases','investigations']},
    {name:'whoami',slug:'whoami',kind:'app',target:'profile',aliases:['about']},
    {name:'home lab',slug:'home',kind:'app',target:'shell',aliases:['index','shell']},
    {name:'knowledge base',slug:'knowledge',kind:'app',target:'knowledge',aliases:['notes']},
    {name:'Shiftrun',slug:'shiftrun',kind:'link',target:'shiftrun/',aliases:[]},
    ...notes.map(n=>({name:n.title,slug:n.slug,kind:'note',target:n.slug,aliases:['kb-'+n.slug]}))
  ];
  const shellHistory=[];let historyIndex=0,shellDraft='',catEnabled=false,catLoaded=false;
  const terminalInput=$('#terminal-input'),terminalOutput=$('#terminal-output');
  // The welcome screen stays above the current terminal session, including after clear.
  const terminalTranscript=document.createElement('div');
  terminalTranscript.className='shell-transcript';
  terminalOutput.append(terminalTranscript);
  let shellPinnedToEnd=false;
  function syncShellViewport() {
    if(!terminalOutput.clientHeight)return;
    const css=getComputedStyle(terminalOutput);
    terminalOutput.style.setProperty('--shell-viewport-height',terminalOutput.clientHeight+'px');
    terminalOutput.style.setProperty('--shell-page-inset',(parseFloat(css.paddingTop)+parseFloat(css.paddingBottom))+'px');
    if(shellPinnedToEnd)terminalOutput.scrollTop=terminalOutput.scrollHeight;
  }
  terminalOutput.addEventListener('scroll',()=>{
    shellPinnedToEnd=terminalOutput.scrollHeight-terminalOutput.clientHeight-terminalOutput.scrollTop<=2;
  },{passive:true});
  const shellViewportObserver=new ResizeObserver(syncShellViewport);
  shellViewportObserver.observe(terminalOutput);
  function clearShell() {
    terminalTranscript.replaceChildren();
    terminalTranscript.classList.add('is-cleared');
    shellPinnedToEnd=true;
    syncShellViewport();
    terminalInput.focus({preventScroll:true});
  }
  function appendShell(content,className='shell-response') {
    const block=document.createElement('div');block.className=className;
    if(typeof content==='string')block.textContent=content;else block.append(content);
    terminalTranscript.append(block);
    while(terminalTranscript.children.length>100)terminalTranscript.firstElementChild.remove();
    shellPinnedToEnd=true;
    terminalOutput.scrollTop=terminalOutput.scrollHeight;
  }
  function toggleCat() {
    catEnabled=!catEnabled;
    if(catEnabled&&!catLoaded){
      catLoaded=true;const script=document.createElement('script');script.src='oneko.js';
      script.addEventListener('load',()=>{const cat=document.querySelector('#oneko');if(cat)cat.style.display=catEnabled?'block':'none';});
      script.addEventListener('error',()=>{catLoaded=false;catEnabled=false;script.remove();appendShell('The companion could not load. Try cat again.');});
      document.body.append(script);
    }
    const cat=document.querySelector('#oneko');if(cat)cat.style.display=catEnabled?'block':'none';
    return catEnabled?'Not the cat you were expecting?':'Meow.';
  }
  function openShellPage(page) {
    if(page.kind==='link'){location.assign(page.target);return;}
    if(page.kind==='note'){openReader(page.target);return;}
    if(page.kind==='app'){showWindow(page.target);return;}
    if(page.kind==='case'){
      showWindow('cases');renderCase(page.target);
      const el=windows.get('cases');
      if(!mobile.matches&&!el.classList.contains('maximized'))applyGeometry(el,fitted(el,{x:workspace.clientWidth*.18,y:workspace.clientHeight*.13,w:600,h:540}));
    }
  }
  function runShell(value) {
    const command=value.trim();if(!command)return;
    shellHistory.push(command);if(shellHistory.length>100)shellHistory.shift();
    historyIndex=shellHistory.length;shellDraft='';terminalInput.value='';
    appendShell('visitor:~$ '+command,'shell-command');
    const result=window.KhanShell.resolve(command,shellPages);
    if(result.kind==='clear'){clearShell();return;}
    if(result.kind==='text'){
      appendShell(result.text);
      const profile=windows.get('profile');
      if(command.toLowerCase()==='whoami'&&(profile.hidden||(mobile.matches&&!profile.classList.contains('mobile-current')))){
        showWindow('profile');return;
      }
    }
    else if(result.kind==='cat')appendShell(toggleCat());
    else if(result.kind==='ls'){
      const list=document.createElement('div');list.className='shell-directory';
      shellPages.forEach((page,i)=>{const button=document.createElement('button');button.type='button';button.dataset.shellPage=String(i);button.textContent=page.name+' ↗';list.append(button);});
      appendShell(list);
    }else if(result.kind==='open'){
      appendShell('Opening '+result.page.name+'…');openShellPage(result.page);return;
    }
    terminalInput.focus({preventScroll:true});
  }
  $('#terminal-form').addEventListener('submit',event=>{event.preventDefault();runShell(terminalInput.value);});
  terminalInput.addEventListener('keydown',event=>{
    if(!['ArrowUp','ArrowDown'].includes(event.key))return;
    event.preventDefault();
    if(historyIndex===shellHistory.length)shellDraft=terminalInput.value;
    historyIndex=Math.max(0,Math.min(shellHistory.length,historyIndex+(event.key==='ArrowUp'?-1:1)));
    terminalInput.value=historyIndex===shellHistory.length?shellDraft:shellHistory[historyIndex];
    terminalInput.setSelectionRange(terminalInput.value.length,terminalInput.value.length);
  });

  // Relationships come from the existing archive, including links listed in either direction.
  const columns=5, rows=Math.ceil(notes.length/columns);
  // Keep a readable row height as the study archive grows; the map can scroll.
  $('.graph-space').style.setProperty('--graph-height',Math.max(370,rows*92)+'px');
  $('.graph-frame').tabIndex=0;
  $('.graph-frame').setAttribute('role','region');
  $('.graph-frame').setAttribute('aria-label','Study constellation. Scroll to explore all notes; select a note and press Enter to open it.');
  const positions=notes.map((n,i)=>({x:11+(i%columns)*19+(Math.floor(i/columns)%2?2:0),y:10+Math.floor(i/columns)*(77/Math.max(1,rows-1))+(i%2?1:0)}));
  const edgeSet=new Set(), edges=[];
  notes.forEach((n,i)=>(n.related||[]).forEach(slug=>{
    const target=bySlug.get(slug); if (!target || target.index===i) return;
    const pair=[i,target.index].sort((a,b)=>a-b), key=pair.join(':');
    if (!edgeSet.has(key)) {edgeSet.add(key);edges.push(pair);}
  }));
  const connections=slug=>{
    const index=bySlug.get(slug).index;
    return edges.filter(pair=>pair.includes(index)).map(([a,b])=>notes[a===index?b:a]);
  };
  $('.graph-space svg').innerHTML=edges.map(([a,b])=>{
    const p=positions[a],q=positions[b];
    return `<path class="graph-edge" data-edge="${a},${b}" d="M${p.x} ${p.y} Q${(p.x+q.x)/2+7} ${(p.y+q.y)/2-7} ${q.x} ${q.y}"/>`;
  }).join('');
  $('.graph-nodes').innerHTML=notes.map((n,i)=>`<button class="graph-node" data-select="${esc(n.slug)}" aria-pressed="false" style="--x:${positions[i].x};--y:${positions[i].y};--node-color:${colorOf(n)}" title="${esc(n.title+' · '+n.category)}">${esc(n.title)}</button>`).join('');
  $('.graph-nodes').addEventListener('dblclick',event=>{const node=event.target.closest('[data-select]');if(node)openReader(node.dataset.select);});
  $('.graph-nodes').addEventListener('keydown',event=>{const node=event.target.closest('[data-select]');if(node&&event.key==='Enter'){event.preventDefault();openReader(node.dataset.select);}});
  function matchingNotes() {
    const query=state.query.trim().toLowerCase();
    return notes.filter(n=>(state.category==='All'||n.category===state.category)&&(!query||searchText(n).includes(query)));
  }
  function renderKnowledge() {
    const matches=matchingNotes(), matching=new Set(matches.map(n=>n.slug));
    const current=bySlug.get(state.selected), related=connections(state.selected), neighbors=new Set(related.map(n=>n.slug));
    const hasSelected=matching.has(current.slug);
    document.documentElement.style.setProperty('--subject',colorOf(current));
    $$('.graph-node').forEach(button=>{
      const slug=button.dataset.select, visible=matching.has(slug);
      button.classList.toggle('filtered-out',!visible);
      button.classList.toggle('neighbor',neighbors.has(slug));
      button.classList.toggle('context-faint',state.trace&&slug!==current.slug&&!neighbors.has(slug));
      button.setAttribute('aria-pressed',String(slug===current.slug));
      button.setAttribute('aria-hidden',String(!visible));
      button.tabIndex=visible?0:-1;
    });
    $$('[data-edge]').forEach(path=>{
      const pair=path.dataset.edge.split(',').map(Number), focused=pair.includes(current.index), visible=pair.every(i=>matching.has(notes[i].slug));
      path.classList.toggle('focused',focused&&visible);
      path.classList.toggle('faint',!visible||(state.trace&&!focused));
    });
    $('.graph-empty').hidden=matches.length>0;
    $('.knowledge-list').innerHTML=matches.length?matches.map(n=>`<button data-select="${esc(n.slug)}" aria-pressed="${n.slug===current.slug}">${esc(n.title)}<span>${esc(shortCategories[n.category]||n.category)}</span></button>`).join(''):'<p class="search-empty">No matching concepts. Try another search or subject.</p>';
    $('.knowledge-detail').innerHTML=hasSelected?`<div class="detail-topline"><span>SELECTED CONCEPT</span><span aria-hidden="true">↗</span></div><div class="selected-number" aria-hidden="true">${String(current.index+1).padStart(2,'0')}</div><span class="detail-category">${esc(current.category.toUpperCase())}</span><h2>${esc(current.title)}</h2><p class="detail-principle">${esc(current.principle)}</p><button class="open-note" data-read="${esc(current.slug)}">Open note <span aria-hidden="true">↗</span></button><div class="related-mini"><span class="eyebrow">${related.length} CONNECTIONS</span>${related.slice(0,4).map(n=>`<button data-related="${esc(n.slug)}">${esc(n.title)}<span aria-hidden="true">↗</span></button>`).join('')}</div>`:'<span class="detail-category">NO RESULTS</span><h2>Another path.</h2><p class="detail-principle">Clear the filters to return to the full constellation.</p><button class="open-note" data-clear-filters>Show all notes ↗</button>';
    $('#knowledge-count').textContent=`${matches.length} / ${notes.length} study notes · ${edges.length} connections`;
    $$('.knowledge-categories button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.category===state.category)));
    $('[data-trace]').setAttribute('aria-pressed',String(state.trace));
  }
  function selectNote(slug, clearFilters=false) {
    if (!bySlug.has(slug)) return;
    if (clearFilters) {state.category='All';state.query='';$('#knowledge-query').value='';}
    state.selected=slug;
    renderKnowledge(); paintSignalOnce();
  }
  function filterKnowledge() {
    const matches=matchingNotes();
    if (matches.length&&!matches.some(n=>n.slug===state.selected)) state.selected=matches[0].slug;
    renderKnowledge(); paintSignalOnce();
  }
  $('#knowledge-query').addEventListener('input',e=>{state.query=e.target.value;filterKnowledge();});
  $$('.knowledge-categories button').forEach(button=>button.onclick=()=>{state.category=button.dataset.category;filterKnowledge();});
  $$('[data-mode]').forEach(button=>button.onclick=()=>{
    state.mode=button.dataset.mode;
    $$('[data-mode]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
    $('.graph-frame').hidden=state.mode!=='map';$('.knowledge-list').hidden=state.mode!=='list';
  });
  $('[data-trace]').onclick=()=>{state.trace=!state.trace;renderKnowledge();};

  function readableBody(note) {
    // Keep the original exercise mounts so the shared learning activities run in this reader.
    const template=document.createElement('template');
    template.innerHTML=note.body||'';
    template.content.querySelectorAll('script,style,iframe,object,embed').forEach(el=>el.remove());
    template.content.querySelectorAll('*').forEach(el=>{
      [...el.attributes].forEach(attr=>{if (/^on/i.test(attr.name)||(/^(href|src)$/i.test(attr.name)&&/^\s*javascript:/i.test(attr.value))) el.removeAttribute(attr.name);});
    });
    template.content.querySelectorAll('a').forEach(link=>{
      const href=link.getAttribute('href')||'', match=href.match(/^#note-([a-z0-9-]+)$/);
      if (match&&bySlug.has(match[1])) {link.dataset.read=match[1];link.href='#note-'+match[1];}
      else if (/^https?:/i.test(href)) {link.target='_blank';link.rel='noopener';}
    });
    return template.innerHTML;
  }
  function renderReader(slug) {
    const n=bySlug.get(slug);if(!n)return;
    state.reader=slug;
    $('.note-sheet').innerHTML=`<span class="eyebrow">${esc(n.category)} / ${esc(n.basis)}</span><h2>${esc(n.title)}</h2><p class="note-principle">${esc(n.principle)}</p><div class="note-body">${readableBody(n)}</div>${n.question?`<section class="note-recall"><span>RECALL / BEFORE REVEALING</span><p>${esc(n.question)}</p><details><summary>Reveal the explanation</summary><p>${esc(n.answer)}</p></details></section>`:''}<h3>Related notes</h3><div class="note-connections">${connections(slug).map(other=>`<button data-read="${esc(other.slug)}">${esc(other.title)} ↗</button>`).join('')}</div>`;
    $('#title-note').innerHTML=`<i aria-hidden="true">≡</i>${esc(n.title)}`;
    if(n.references?.length){const refs=document.createElement('section');refs.className='note-references';refs.innerHTML='<h3>Technical references</h3><ul>'+n.references.map(ref=>`<li><a href="${esc(ref.url)}" target="_blank" rel="noopener">${esc(ref.title)} ↗</a></li>`).join('')+'</ul>';$('.note-connections').previousElementSibling.before(refs);}
    window.StudyExercises.mount($('.note-sheet'));
    $('.note-sheet').scrollTop=0;
  }
  function openReader(slug) {renderReader(slug);selectNote(slug,true);showWindow('note');announce('Opened '+bySlug.get(slug).title+'.');}
  function renderSearch() {
    const query=$('.command-search').value.trim().toLowerCase();
    const matches=notes.filter(n=>searchText(n).includes(query));
    $('.command-results').innerHTML=matches.length?matches.map(n=>`<button class="command-result" data-read="${esc(n.slug)}">${esc(n.title)}<span>${esc(shortCategories[n.category]||n.category)} ↗</span></button>`).join(''):'<p class="search-empty">No matching notes. Try a broader concept.</p>';
  }
  function setPalette(id,updateURL=true) {
    const next=window.KhanThemes.list.find(p=>p.id===id);if(!next)return;
    palette=next;colors=colorsOf();
    document.documentElement.dataset.theme=id;
    document.title=`KhanOS — Farris Khan / ${palette.name}`;
    document.querySelector('meta[name="theme-color"]').content=palette.base;
    $('.current-palette').textContent=palette.name;
    $$('[data-palette]').forEach(button=>{const current=button.dataset.palette===id;button.setAttribute('aria-pressed',String(current));button.querySelector('b').textContent=current?'✓':'↗';});
    $$('.graph-node').forEach(button=>button.style.setProperty('--node-color',colorOf(bySlug.get(button.dataset.select))));
    $$('.knowledge-categories button i').forEach(dot=>dot.style.setProperty('--chip',colors[dot.parentElement.dataset.category]));
    $('.palette-menu').open=false;
    if(updateURL){const url=new URL(location.href);url.searchParams.set('theme',id);history.replaceState(null,'',url);announce(palette.name+' palette selected.');}
    if(activeCase)renderCase(activeCase,caseStep);
    renderKnowledge();paintSignalOnce();
  }
  $('.command-search').addEventListener('input',renderSearch);
  $('.command-search').addEventListener('keydown',e=>{
    if (e.key==='ArrowDown') {e.preventDefault();$('.command-result')?.focus();}
    if (e.key==='Enter') {const first=$('.command-result');if (first) openReader(first.dataset.read);}
  });
  $('.command-results').addEventListener('keydown',e=>{
    if (!['ArrowUp','ArrowDown'].includes(e.key)) return;
    const results=$$('.command-result'),index=results.indexOf(document.activeElement);
    if (index<0)return;e.preventDefault();
    if (e.key==='ArrowUp'&&index===0) $('.command-search').focus();
    else results[Math.max(0,Math.min(results.length-1,index+(e.key==='ArrowDown'?1:-1)))]?.focus();
  });
  const investigations={
    soc:{category:'AZURE / GUIDED PERSONAL LAB',title:'Following failed logins.',device:'SENTINEL',source:'WINDOWS VM',transport:'AMA → workspace',url:'soc-honeypot.html',steps:[
      ['Build','Give the honeypot a home.','I created a resource group, a virtual network with a subnet, and a Windows VM. I deliberately opened its network rules and Windows firewall to observe unsolicited login attempts in this lab.'],
      ['Collect','Connect the logs.','The Windows Security Events via AMA connector configured Azure Monitor Agent and a data collection rule. They sent the VM’s Security events to a Log Analytics workspace connected to Sentinel.'],
      ['Read','Start with event 4625.','Event ID 4625 means a failed login. I used KQL to review accounts, source IPs, and repeated attempts. A saved result also shows event 4740: an account was locked out.'],
      ['Map','Add context to the source IPs.','I adapted a supplied workbook and location dataset. The saved map shows 849 failed logons across four source IP entries. Locations describe IP infrastructure; the map does not establish who was behind the attempts.']
    ]},
    lifx:{category:'IOT / LOCAL CONTROL',title:'A light bulb. An open invitation.',device:'LIFX',transport:'UDP / 56700',steps:[
      ['Discover','Identify the device.','Host discovery identifies a Lifi Labs device on the local network. The lab starts with a known device, its address, and its place on the LAN.'],
      ['Enumerate','A closed TCP port is not the end.','A TCP scan does not describe UDP services. LIFX local control uses UDP, so the next step changes the transport rather than assuming the device has nothing listening.'],
      ['Interpret','Silence has more than one meaning.','An open|filtered UDP result is inconclusive. A protocol-specific request provides better evidence than treating a silent response as a confirmed open service.'],
      ['Demonstrate','Speak the device’s language.','Correctly formed LIFX messages discover and control the bulb on the local network without credentials. The writeup connects service discovery to the device’s actual protocol.']
    ]}
  };
  let activeCase=null,caseStep=0;
  function renderCases() {
    activeCase=null;caseStep=0;
    $('.case-content').innerHTML='<div class="case-launchers"><button data-case="soc"><b aria-hidden="true">⌁</b><span>Azure honeypot</span><small>Windows / Sentinel ↗</small></button><button data-case="lifx"><b aria-hidden="true">◉</b><span>LIFX bulb</span><small>UDP / 56700 ↗</small></button></div>';
  }
  function renderCase(id,step=0) {
    const data=investigations[id];if(!data)return;
    activeCase=id;caseStep=step;
    const current=data.steps[step];
    const source=data.source||'KALI';
    const completeLink=data.url?`<a class="case-back case-complete" href="${data.url}?theme=${palette.id}">Read the complete lab <span aria-hidden="true">↗</span></a>`:'<button class="case-back" type="button" disabled>Read the complete lab</button>';
    $('.case-content').innerHTML=`<article class="case-reading"><span class="eyebrow">${data.category}</span><h2>${data.title}</h2><div class="case-schematic" aria-label="Illustrative connection from ${source} to ${data.device}"><strong>${source}</strong><span>${data.transport}<br>────────→</span><strong>${data.device}</strong></div><div class="case-step-head"><b>${String(step+1).padStart(2,'0')}</b><h3>${current[1]}</h3></div><p>${current[2]}</p><div class="case-step-buttons" role="group" aria-label="Lab stages">${data.steps.map((s,i)=>`<button data-step="${i}" aria-pressed="${i===step}">${s[0]}</button>`).join('')}</div><div class="case-links"><button class="case-back" data-case-back>← All labs</button>${completeLink}</div></article>`;
  }
  root.addEventListener('click',event=>{
    const target=event.target.closest('button,a');if(!target)return;
    if (target.hasAttribute('data-palette')) {setPalette(target.dataset.palette);return;}
    if (target.hasAttribute('data-command')) {runShell(target.dataset.command);return;}
    if (target.hasAttribute('data-shell-page')) {openShellPage(shellPages[+target.dataset.shellPage]);return;}
    if (target.hasAttribute('data-app')) {showWindow(target.dataset.app);return;}
    if (target.hasAttribute('data-select')) {selectNote(target.dataset.select);return;}
    if (target.hasAttribute('data-related')) {selectNote(target.dataset.related,true);return;}
    if (target.hasAttribute('data-read')) {event.preventDefault();openReader(target.dataset.read);return;}
    if (target.hasAttribute('data-clear-filters')) {state.category='All';state.query='';$('#knowledge-query').value='';filterKnowledge();return;}
    if (target.hasAttribute('data-case')) {
      renderCase(target.dataset.case);const el=windows.get('cases');
      if (!mobile.matches&&!el.classList.contains('maximized')) applyGeometry(el,fitted(el,{x:workspace.clientWidth*.18,y:workspace.clientHeight*.13,w:600,h:540}));
      activate('cases',true);return;
    }
    if (target.hasAttribute('data-step')) {const step=+target.dataset.step;renderCase(activeCase,step);$(`.case-step-buttons [data-step="${step}"]`).focus({preventScroll:true});return;}
    if (target.hasAttribute('data-case-back')) {renderCases();return;}
  });
  const shiftrunDock=$('.dock-shiftrun');
  const shiftrunButton=shiftrunDock.querySelector('[data-app="featured"]');
  const shiftrunLaunch=shiftrunDock.querySelector('.dock-launch-menu a');
  shiftrunButton.addEventListener('dblclick',event=>{event.preventDefault();location.assign(shiftrunLaunch.href);});
  shiftrunDock.addEventListener('pointerenter',()=>shiftrunDock.classList.remove('launch-dismissed'));
  shiftrunDock.addEventListener('pointerdown',event=>{
    if(event.pointerType==='touch'){shiftrunDock.classList.remove('launch-dismissed');shiftrunDock.classList.add('launch-open');}
  });
  shiftrunDock.addEventListener('focusout',event=>{
    if(!shiftrunDock.contains(event.relatedTarget))shiftrunDock.classList.remove('launch-dismissed');
  });
  shiftrunDock.addEventListener('keydown',event=>{
    if(event.key==='ArrowUp'&&event.target===shiftrunButton){
      event.preventDefault();shiftrunDock.classList.remove('launch-dismissed');shiftrunLaunch.focus();
    }else if(event.key==='Escape'){
      event.preventDefault();event.stopPropagation();shiftrunDock.classList.remove('launch-open');shiftrunDock.classList.add('launch-dismissed');shiftrunButton.focus();
    }
  });
  $('[data-reset]').onclick=resetLayout;
  document.addEventListener('keydown',event=>{
    if ((event.metaKey||event.ctrlKey)&&event.key.toLowerCase()==='k') {event.preventDefault();showWindow('search');}
    if (event.key==='Escape'&&$('.palette-menu').open) {event.preventDefault();$('.palette-menu').open=false;$('.palette-menu summary').focus();return;}
    if (event.key==='Escape'&&state.active&&!event.defaultPrevented) {event.preventDefault();hideWindow(state.active);}
  });
  document.addEventListener('pointerdown',event=>{
    if(!event.target.closest('.palette-menu'))$('.palette-menu').open=false;
    if(!event.target.closest('.dock-shiftrun'))shiftrunDock.classList.remove('launch-open');
  });

  // Signal's atmosphere is decorative. It never represents real network activity.
  const canvas=$('#signal-backdrop'),ctx=canvas.getContext('2d');
  const points=[];
  for(let u=0;u<44;u++) for(let v=0;v<34;v++) {
    const a=u/44*Math.PI*2,b=v/34*Math.PI*2,r=1.52+.47*Math.cos(b);
    points.push({x:r*Math.cos(a),y:.47*Math.sin(b),z:r*Math.sin(a),band:v/34});
  }
  let signalWidth=0,signalHeight=0,angle=.58,frame=0,lastTime=0,renderTime=0;
  const canAnimate=()=>state.motion&&!reduced.matches&&!thumbnail&&!document.hidden;
  const selectedRGB=()=>{
    const followSubject=palette.signalFollowsSubject!==false&&['knowledge','note'].includes(state.active);
    const hex=(followSubject?colorOf(bySlug.get(state.selected)):palette.signal).slice(1);
    return [0,2,4].map(i=>parseInt(hex.slice(i,i+2),16));
  };
  function paintSignalOnce() {
    if (!ctx || !signalWidth || !signalHeight)return;
    const w=signalWidth,h=signalHeight;
    ctx.clearRect(0,0,w,h);
    const [r,g,b]=selectedRGB(), glow=ctx.createRadialGradient(w*.57,h*.42,20,w*.57,h*.42,Math.min(w*.6,h*.83));
    glow.addColorStop(0,`rgba(${r},${g},${b},0.075)`);glow.addColorStop(.5,`rgba(${r},${g},${b},0.025)`);glow.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle=glow;ctx.fillRect(0,0,w,h);
    const scale=Math.min(w*.29,h*.47),cx=w*.59,cy=h*.47,co=Math.cos(angle),si=Math.sin(angle),tilt=-.30;
    const projected=points.map(p=>{
      const x=p.x*co-p.z*si,z=p.x*si+p.z*co,y=p.y*Math.cos(tilt)-z*Math.sin(tilt),depthZ=p.y*Math.sin(tilt)+z*Math.cos(tilt),depth=4.3/(4.3+depthZ);
      return {x:cx+x*scale*depth,y:cy+y*scale*depth,z:depthZ,band:p.band};
    }).sort((a,b)=>b.z-a.z);
    projected.forEach(p=>{
      const front=(2.1-p.z)/4.2,alpha=.12+front*.47,size=.6+front*1.35;
      ctx.beginPath();ctx.fillStyle=`rgba(${r},${g},${b},${alpha})`;ctx.arc(p.x,p.y,size,0,Math.PI*2);ctx.fill();
      if(front>.85&&p.band<.08) {ctx.beginPath();ctx.fillStyle=`rgba(${r},${g},${b},.045)`;ctx.arc(p.x,p.y,size*3,0,Math.PI*2);ctx.fill();}
    });
  }
  function animateSignal(time) {
    frame=0;if(!canAnimate())return;
    if(time-renderTime>32){angle+=Math.min(80,time-(lastTime||time))*.000085;lastTime=time;renderTime=time;paintSignalOnce();}
    frame=requestAnimationFrame(animateSignal);
  }
  function syncMotion() {
    document.body.classList.toggle('hybrid-paused',!canAnimate());document.body.classList.toggle('reduced-motion',reduced.matches);
    const button=$('[data-motion]'), enabled=state.motion&&!reduced.matches;
    button.textContent=enabled?'Pause motion':'Enable motion';button.setAttribute('aria-pressed',String(enabled));
    if (frame) {cancelAnimationFrame(frame);frame=0;}lastTime=0;paintSignalOnce();
    if (canAnimate())frame=requestAnimationFrame(animateSignal);
  }
  function resizeSignal() {
    signalWidth=workspace.clientWidth;signalHeight=workspace.clientHeight;
    const dpr=Math.min(devicePixelRatio||1,1.5);
    canvas.width=Math.round(signalWidth*dpr);canvas.height=Math.round(signalHeight*dpr);ctx?.setTransform(dpr,0,0,dpr,0,0);paintSignalOnce();
  }
  $('[data-motion]').onclick=()=>{
    if(reduced.matches){announce('Motion follows your device’s reduced-motion setting.');return;}
    state.motion=!state.motion;syncMotion();
  };
  reduced.addEventListener('change',()=>{if(reduced.matches)state.motion=false;syncMotion();});
  document.addEventListener('visibilitychange',syncMotion);
  window.addEventListener('pagehide',()=>{if(frame)cancelAnimationFrame(frame);});
  window.addEventListener('pageshow',syncMotion);
  let resizeTask=0;
  const resizeObserver=new ResizeObserver(()=>{
    cancelAnimationFrame(resizeTask);resizeTask=requestAnimationFrame(()=>{
      resizeSignal();
      if(!mobile.matches) windows.forEach(el=>{
        if(el.hidden)return;
        if(el.classList.contains('maximized'))applyGeometry(el,{x:12,y:12,w:workspace.clientWidth-24,h:workspace.clientHeight-126});
        else if(el.dataset.window === 'profile' && !manuallySized.has('profile'))fitProfile(); else constrain(el);
      });
      fitFeatured();
    });
  });
  resizeObserver.observe(workspace);
  mobile.addEventListener('change',()=>{if(state.active)activate(state.active);fitProfile();});
  function followHash(){
    const hash=location.hash.slice(1);
    if(hash==='knowledge')showWindow('knowledge',false);
    else if(hash==='about')showWindow('profile',false);
    else if(['labs','cases','investigations'].includes(hash))showWindow('cases',false);
    else if(hash.startsWith('case-')&&investigations[hash.slice(5)])openShellPage({kind:'case',target:hash.slice(5)});
    else if(hash.startsWith('note-')&&bySlug.has(hash.slice(5)))openReader(hash.slice(5));
  }
  window.addEventListener('hashchange',followHash);
  renderKnowledge();renderCases();renderSearch();setPalette(palette.id,false);activate('shell');fitProfile();resizeSignal();syncMotion();followHash();
  document.fonts?.ready.then(fitProfile);
})();

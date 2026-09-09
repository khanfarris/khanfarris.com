(() => {
  'use strict';
  const main=document.querySelector('main');
  if(!main)return;
  const header=document.createElement('header');header.className='site-header wrap';
  header.innerHTML='<a class="wordmark" href="index.html"><span class="brand-mark">[k/f]</span> khanfarris<span class="accent">_</span></a><nav aria-label="Main navigation"><a href="index.html#investigations">Writeups</a><a href="index.html#knowledge">Knowledge base</a><a href="index.html#about">Whoami</a></nav><button class="command-trigger" data-command>⌕ Jump to <kbd>Ctrl K</kbd></button>';
  document.body.prepend(header);
  main.id='main';const skip=document.createElement('a');skip.href='#main';skip.className='skip-link';skip.textContent='Skip to content';document.body.prepend(skip);
  const title=main.querySelector('.post-title');
  if(title){
    const study=document.body.classList.contains('kb-article');
    const words=main.textContent.trim().split(/\s+/).length;
    const meta=document.createElement('p');meta.className='reading-meta';meta.textContent=Math.ceil(words/220)+' min read / '+(study?'STUDY NOTE':'FIELD INVESTIGATION');title.after(meta);
    const headings=Array.from(main.querySelectorAll('h2'));
    const toc=document.createElement('details');toc.className='toc';
    const summary=document.createElement('summary');summary.textContent=(study?'In this note / ':'In this investigation / ')+headings.length+' sections';toc.append(summary);
    const list=document.createElement('ol');
    headings.forEach((heading,i)=>{if(!heading.id)heading.id='section-'+(i+1);const li=document.createElement('li'),a=document.createElement('a');a.href='#'+heading.id;a.textContent=heading.textContent;li.append(a);list.append(li);});
    toc.append(list);const postMeta=main.querySelector('.post-meta');(postMeta||meta).after(toc);
    const progress=document.createElement('div');progress.className='reading-progress';progress.setAttribute('aria-hidden','true');document.body.prepend(progress);
    const update=()=>{const max=document.documentElement.scrollHeight-window.innerHeight;progress.style.width=(max>0?Math.min(100,window.scrollY/max*100):100)+'%';};window.addEventListener('scroll',update,{passive:true});window.addEventListener('resize',update);update();
    main.querySelectorAll('pre').forEach(pre=>{
      const text=pre.textContent;const button=document.createElement('button');button.className='copy-code';button.textContent='Copy';button.setAttribute('aria-label','Copy code block');
      button.addEventListener('click',async()=>{try{await navigator.clipboard.writeText(text);button.textContent='Copied';}catch{button.textContent='Select to copy';const range=document.createRange();range.selectNodeContents(pre.querySelector('code')||pre);const selection=window.getSelection();selection.removeAllRanges();selection.addRange(range);}setTimeout(()=>button.textContent='Copy',1800);});pre.append(button);
    });
    if(!study){const related=document.createElement('aside');related.className='related-reading';const label=document.createElement('span');label.className='eyebrow';label.textContent='NEXT INVESTIGATION';const link=document.createElement('a');const lifx=location.pathname.includes('lifx');link.href=lifx?'samsung-tv-pentest.html':'lifx-pentest.html';link.textContent=(lifx?'pwning my TV':'pwning my light bulbs')+' ↗';related.append(label,link);const footer=main.querySelector('footer');if(footer)footer.before(related);else main.append(related);}
  }
  const items=Array.from(main.querySelectorAll('.port-item,.protocol-item,.command-item'));
  if(items.length){
    const box=document.createElement('div');box.className='reference-search';const label=document.createElement('label');label.htmlFor='reference-search';label.textContent='FILTER THE REFERENCE';const input=document.createElement('input');input.id='reference-search';input.type='search';input.placeholder='Search names, ports, usage, or security notes…';const count=document.createElement('p');count.className='reference-count';count.setAttribute('role','status');const hint=document.createElement('p');hint.className='reference-hint';hint.textContent='Select an entry to open its personal notes.';box.append(label,input,count,hint);main.querySelector('.tree').before(box);
    const empty=document.createElement('p');empty.className='reference-empty';empty.textContent='No matching entries. Try a service name or clear your search.';empty.hidden=true;box.after(empty);
    const filter=()=>{let total=0;const query=input.value.trim().toLowerCase();items.forEach(item=>{item.hidden=!item.textContent.toLowerCase().includes(query);if(!item.hidden)total++;});count.textContent=total+' / '+items.length+' entries';empty.hidden=total!==0;};input.addEventListener('input',filter);filter();
    items.forEach(item=>{item.tabIndex=0;item.setAttribute('role','button');item.setAttribute('aria-label',item.childNodes[0].textContent.trim()+' — open notes');item.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();item.click();}});});
    const textarea=document.querySelector('.notes-textarea');if(textarea)textarea.setAttribute('aria-label','Personal notes for the selected entry');
  }
  const typing=document.querySelector('#inputField');if(typing){typing.setAttribute('aria-label','Type the displayed words');const heading=document.createElement('h2');heading.textContent='typing test_';main.querySelector('.brand').after(heading);}
})();

(() => {
  'use strict';
  const themes=window.KhanThemes;
  const picker=document.querySelector('.directory-palette');
  if(!themes||!picker)return;
  const options=picker.querySelector('.directory-palette-options');
  for(const theme of themes.list){
    const button=document.createElement('button');
    button.type='button';button.dataset.palette=theme.id;
    const swatch=document.createElement('i');swatch.setAttribute('aria-hidden','true');swatch.style.setProperty('--swatch',theme.accent);
    const label=document.createElement('span');label.textContent=theme.name;
    const description=document.createElement('small');description.textContent=theme.subtitle;label.append(description);
    button.append(swatch,label);button.addEventListener('click',()=>applyTheme(theme,true));options.append(button);
  }
  function applyTheme(theme,updateURL){
    document.documentElement.dataset.theme=theme.id;
    document.querySelector('meta[name="theme-color"]').content=theme.base;
    picker.querySelector('summary span').textContent=theme.name;
    options.querySelectorAll('button').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.palette===theme.id)));
    document.querySelectorAll('[data-desktop]').forEach(link=>{const url=new URL(link.href);url.searchParams.set('theme',theme.id);link.href=url.href;});
    if(updateURL){const url=new URL(location.href);url.searchParams.set('theme',theme.id);history.replaceState(null,'',url);picker.open=false;picker.querySelector('summary').focus();}
  }
  applyTheme(themes.initial,false);picker.hidden=false;
  document.querySelector('#year').textContent=String(new Date().getFullYear());
  document.addEventListener('pointerdown',event=>{if(!picker.contains(event.target))picker.open=false;});
  document.addEventListener('keydown',event=>{
    if(event.key==='Escape'&&picker.open){event.preventDefault();picker.open=false;picker.querySelector('summary').focus();}
    if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='k'){event.preventDefault();document.querySelector('#knowledge-search')?.focus();}
  });
})();

(() => {
  'use strict';
  const pages=window.knowledgePages||[];
  const search=document.querySelector('#knowledge-search');
  if(search){
    const entries=Array.from(document.querySelectorAll('.knowledge-entry'));
    const filters=Array.from(document.querySelectorAll('[data-category]')).filter(el=>el.tagName==='BUTTON');
    const lookup=new Map(pages.map(page=>[page.slug,page]));
    let category='All';
    document.querySelector('.knowledge-controls').hidden=false;
    const filter=()=>{
      const terms=search.value.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
      let count=0;
      entries.forEach(entry=>{
        const page=lookup.get(entry.dataset.slug);
        const text=(entry.textContent+' '+(page?.keywords||'')).toLocaleLowerCase();
        entry.hidden=!((category==='All'||entry.dataset.category===category)&&terms.every(term=>text.includes(term)));
        if(!entry.hidden)count++;
      });
      document.querySelector('#knowledge-count').textContent=count+' / '+entries.length+' notes'+(category==='All'?'':' · '+category);
      document.querySelector('#knowledge-empty').hidden=count!==0;
    };
    search.addEventListener('input',filter);
    filters.forEach(button=>button.addEventListener('click',()=>{
      category=button.dataset.category;
      filters.forEach(item=>item.setAttribute('aria-pressed',String(item===button)));
      filter();
    }));
    filter();
  }
  const consoleBox=document.querySelector('.review-console');
  if(consoleBox&&pages.length){
    consoleBox.hidden=false;
    const button=document.querySelector('#next-review'),question=document.querySelector('#review-question'),answer=document.querySelector('#review-answer'),link=document.querySelector('#review-link');
    question.setAttribute('aria-live','polite');
    let deck=[],lastSlug='';
    const refill=()=>{
      deck=pages.slice();
      for(let i=deck.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[deck[i],deck[j]]=[deck[j],deck[i]];}
      if(deck.length>1&&deck[deck.length-1].slug===lastSlug)[deck[0],deck[deck.length-1]]=[deck[deck.length-1],deck[0]];
    };
    button.addEventListener('click',()=>{
      if(!deck.length)refill();
      const page=deck.pop();lastSlug=page.slug;
      document.querySelector('#review-heading').textContent=page.name;
      question.textContent=page.question;answer.open=false;answer.hidden=false;
      answer.querySelector('p').textContent=page.answer;link.href=page.url;
      button.textContent='Next connection →';
    });
  }
  document.querySelectorAll('.table-scroll').forEach(box=>{
    box.tabIndex=0;box.setAttribute('role','region');
    box.setAttribute('aria-label','Reference table; scroll horizontally if needed');
  });
})();

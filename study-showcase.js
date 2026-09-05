(() => {
  'use strict';
  const archive=document.querySelector('[data-archive]');
  if(!archive)return;
  const track=archive.querySelector('.archive-track');
  const cards=Array.from(track.querySelectorAll('[data-archive-card]'));
  if(!cards.length)return;
  const previous=archive.querySelector('[data-archive-prev]'),next=archive.querySelector('[data-archive-next]');
  const scrub=archive.querySelector('#archive-scrub'),range=archive.querySelector('#archive-range');
  const ticks=Array.from(archive.querySelectorAll('.archive-ticks i')),motionButton=archive.querySelector('.archive-motion');
  const reduce=window.matchMedia('(prefers-reduced-motion: reduce)');
  let motion=true,frame=0,announceTimer=0,positions=[],step=0;
  const pad=n=>String(n).padStart(2,'0');
  const maxScroll=()=>Math.max(0,track.scrollWidth-track.clientWidth);
  const enabled=()=>motion&&!reduce.matches;
  archive.classList.add('archive-enhanced');
  archive.querySelector('.archive-controls').hidden=false;
  archive.querySelector('.archive-navigation').hidden=false;
  cards.forEach((card,i)=>card.style.setProperty('--card-delay',(-i*0.6)+'s'));
  function paint(){
    frame=0;
    const left=track.scrollLeft,width=track.clientWidth,max=maxScroll(),fraction=max?left/max:0;
    scrub.value=String(Math.round(fraction*1000));scrub.disabled=max===0;
    archive.style.setProperty('--archive-progress',(fraction*100)+'%');
    archive.style.setProperty('--archive-glow',(15+fraction*70)+'%');
    previous.disabled=left<=2;next.disabled=left>=max-2;
    const visible=[];
    positions.forEach((pos,i)=>{
      const overlap=Math.min(pos.left+pos.width,left+width)-Math.max(pos.left,left);
      const showing=overlap>pos.width*0.5;
      ticks[i].classList.toggle('is-visible',showing);
      if(showing)visible.push(i);
      if(overlap>0){
        const distance=Math.max(-1,Math.min(1,((pos.left+pos.width/2)-(left+width/2))/(width/2)));
        const inner=cards[i].firstElementChild;
        inner.style.setProperty('--card-lean',(-distance*5)+'deg');
        inner.style.setProperty('--card-drop',(Math.abs(distance)*9)+'px');
        inner.style.setProperty('--card-scale',String(1-Math.abs(distance)*.016));
        inner.style.setProperty('--card-glow',String(.8-Math.abs(distance)*.5));
      }
    });
    if(visible.length){
      const first=visible[0]+1,last=visible[visible.length-1]+1,text=first===last?pad(first):pad(first)+' — '+pad(last);
      scrub.setAttribute('aria-valuetext','Notes '+first+' to '+last+' of '+cards.length);
      clearTimeout(announceTimer);announceTimer=setTimeout(()=>{if(range.textContent!==text)range.textContent=text;},100);
    }
  }
  function schedule(){if(!frame)frame=requestAnimationFrame(paint);}
  function measure(){positions=cards.map(card=>({left:card.offsetLeft,width:card.offsetWidth}));step=positions.length>1?positions[1].left-positions[0].left:track.clientWidth; schedule();}
  function move(left,smooth=true){track.scrollTo({left:Math.max(0,Math.min(maxScroll(),left)),behavior:smooth&&enabled()?'smooth':'instant'});}
  function syncMotion(){
    archive.classList.toggle('motion-off',!enabled());
    motionButton.textContent=reduce.matches?'Motion: reduced':motion?'Motion: on':'Motion: off';
    motionButton.setAttribute('aria-pressed',String(enabled()));motionButton.disabled=reduce.matches;
    schedule();
  }
  motionButton.addEventListener('click',()=>{motion=!motion;syncMotion();});
  reduce.addEventListener('change',syncMotion);
  previous.addEventListener('click',()=>move(track.scrollLeft-step));
  next.addEventListener('click',()=>move(track.scrollLeft+step));
  scrub.addEventListener('input',()=>move(Number(scrub.value)/1000*maxScroll(),false));
  track.addEventListener('scroll',schedule,{passive:true});
  track.addEventListener('keydown',event=>{
    if(event.target!==track)return;
    const actions={ArrowRight:track.scrollLeft+step,ArrowLeft:track.scrollLeft-step,Home:0,End:maxScroll(),PageDown:track.scrollLeft+track.clientWidth,PageUp:track.scrollLeft-track.clientWidth};
    if(event.key in actions){event.preventDefault();move(actions[event.key]);}
  });
  // Touch and trackpad use native scrolling. Mouse dragging preserves normal link clicks.
  let drag=null,suppressClick=false;
  track.addEventListener('pointerdown',event=>{
    if(event.pointerType!=='mouse'||event.button!==0)return;
    suppressClick=false;drag={id:event.pointerId,x:event.clientX,left:track.scrollLeft,moved:false};
  });
  track.addEventListener('pointermove',event=>{
    if(!drag||event.pointerId!==drag.id)return;
    const delta=event.clientX-drag.x;
    if(!drag.moved&&Math.abs(delta)>7){drag.moved=true;track.setPointerCapture(event.pointerId);track.classList.add('is-dragging');}
    if(drag.moved){event.preventDefault();track.scrollLeft=drag.left-delta;}
  });
  const finish=event=>{
    if(!drag||event.pointerId!==drag.id)return;
    suppressClick=drag.moved;drag=null;track.classList.remove('is-dragging');
    if(track.hasPointerCapture(event.pointerId))track.releasePointerCapture(event.pointerId);
    setTimeout(()=>{suppressClick=false;},150);
  };
  track.addEventListener('pointerup',finish);track.addEventListener('pointercancel',finish);
  track.addEventListener('lostpointercapture',()=>{drag=null;track.classList.remove('is-dragging');});
  track.addEventListener('dragstart',event=>event.preventDefault());
  track.addEventListener('click',event=>{if(suppressClick){event.preventDefault();event.stopPropagation();}},true);
  cards.forEach(card=>card.addEventListener('pointermove',event=>{
    if(!enabled()||event.pointerType==='touch'||drag?.moved)return;
    const r=card.getBoundingClientRect(),inner=card.firstElementChild;
    inner.style.setProperty('--pointer-x',(event.clientX-r.left)+'px');
    inner.style.setProperty('--pointer-y',(event.clientY-r.top)+'px');
  }));
  const observer=new IntersectionObserver(entries=>{archive.classList.toggle('is-in-view',entries[0].isIntersecting);},{threshold:0.05});
  observer.observe(archive);
  new ResizeObserver(measure).observe(track);
  syncMotion();measure();
})();

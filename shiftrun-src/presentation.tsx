import {useEffect,useLayoutEffect,useRef,useState,type ReactNode} from 'react';
import {ArrowUpRight,Check,ChevronDown,Pause,Play,Shield} from 'lucide-react';

type Palette={id:string;name:string;subtitle:string;swatches:string[];accent:string;signal:string};
const palettes:Palette[]=(window as any).KhanThemes.list;
const preferenceKey='shiftrun-appearance-v1';
function preferences(){
  try{return JSON.parse(localStorage.getItem(preferenceKey)||'{}')||{}}catch{return {}}
}
function initialTheme(){
  const requested=new URLSearchParams(location.search).get('theme');
  return palettes.find(p=>p.id===requested)?.id||palettes.find(p=>p.id===preferences().theme)?.id||'crimson';
}

function Atmosphere({motion,theme}:{motion:boolean;theme:Palette}){
  const canvas=useRef<HTMLCanvasElement>(null);
  useEffect(()=>{
    const c=canvas.current!,ctx=c.getContext('2d');if(!ctx)return;
    let frame=0,w=0,h=0,t=0,last=0,pointer={x:.65,y:.2};
    const dots=Array.from({length:52},(_,i)=>({x:((i*67+17)%101)/101,y:((i*43+9)%103)/103,r:i%6===0?1.8:.8}));
    function draw(){
      ctx!.clearRect(0,0,w,h);
      dots.forEach((d,i)=>{
        const x=d.x*w+Math.sin(t*.17+i)*8+(pointer.x-.5)*8,y=d.y*h+Math.cos(t*.12+i)*6;
        ctx!.fillStyle=i%7===0?theme.accent:theme.signal;ctx!.globalAlpha=.48;
        ctx!.beginPath();ctx!.arc(x,y,d.r,0,7);ctx!.fill();
        if(i<38){const next=dots[(i+11)%dots.length],nx=next.x*w,ny=next.y*h;
          if(Math.hypot(nx-x,ny-y)<260){ctx!.strokeStyle=theme.signal;ctx!.globalAlpha=.14;ctx!.beginPath();ctx!.moveTo(x,y);ctx!.lineTo(nx,ny);ctx!.stroke();}
        }
      });ctx!.globalAlpha=1;
    }
    function tick(now:number){if(last)t+=Math.min((now-last)/1000,.05);last=now;draw();frame=requestAnimationFrame(tick)}
    function size(){w=c.clientWidth;h=c.clientHeight;const dpr=Math.min(devicePixelRatio,2);c.width=w*dpr;c.height=h*dpr;ctx!.setTransform(dpr,0,0,dpr,0,0);draw()}
    function visibility(){cancelAnimationFrame(frame);last=0;if(motion&&!document.hidden)frame=requestAnimationFrame(tick);else draw()}
    const move=(e:PointerEvent)=>{pointer={x:e.clientX/innerWidth,y:e.clientY/innerHeight}};
    size();visibility();addEventListener('resize',size);addEventListener('pointermove',move,{passive:true});document.addEventListener('visibilitychange',visibility);
    return()=>{cancelAnimationFrame(frame);removeEventListener('resize',size);removeEventListener('pointermove',move);document.removeEventListener('visibilitychange',visibility)};
  },[motion,theme]);
  return <canvas className="shiftrun-atmosphere" ref={canvas} aria-hidden="true"/>;
}

export function Presentation({children}:{children:ReactNode}){
  const [theme,setTheme]=useState(initialTheme),[motion,setMotion]=useState(()=>!matchMedia('(prefers-reduced-motion:reduce)').matches&&preferences().motion!==false),[open,setOpen]=useState(false);
  const picker=useRef<HTMLDivElement>(null),trigger=useRef<HTMLButtonElement>(null);
  const palette=palettes.find(p=>p.id===theme)||palettes[0];
  useLayoutEffect(()=>{
    document.documentElement.dataset.theme=theme;
    document.documentElement.dataset.direction='constellation';
    document.documentElement.dataset.motion=String(motion);
    try{localStorage.setItem(preferenceKey,JSON.stringify({theme,motion}))}catch{}
  },[theme,motion]);
  useEffect(()=>{
    const media=matchMedia('(prefers-reduced-motion:reduce)');
    const change=()=>{if(media.matches)setMotion(false)};
    media.addEventListener('change',change);return()=>media.removeEventListener('change',change);
  },[]);
  useEffect(()=>{
    if(!open)return;
    const outside=(e:PointerEvent)=>{if(!picker.current?.contains(e.target as Node))setOpen(false)};
    const escape=(e:KeyboardEvent)=>{if(e.key==='Escape'){setOpen(false);trigger.current?.focus()}};
    document.addEventListener('pointerdown',outside);document.addEventListener('keydown',escape);
    return()=>{document.removeEventListener('pointerdown',outside);document.removeEventListener('keydown',escape)};
  },[open]);
  function choose(id:string){
    setTheme(id);setOpen(false);
    const url=new URL(location.href);url.searchParams.set('theme',id);history.replaceState(null,'',url);
    trigger.current?.focus();
  }
  return <>
    <Atmosphere motion={motion} theme={palette}/>
    <header className="shiftrun-topbar">
      <a className="site-home" href="/" aria-label="Back to khanfarris.com">Khan<span>OS</span><span className="top-slash">/</span><span className="top-product">Shiftrun</span></a>
      <div className="appearance-tools">
        <div className="theme-picker" ref={picker} onBlur={e=>{if(!e.currentTarget.contains(e.relatedTarget as Node))setOpen(false)}}>
          <button ref={trigger} aria-expanded={open} aria-controls={open?'shiftrun-themes':undefined} aria-label="Choose color palette" onClick={()=>setOpen(v=>!v)}><i style={{background:palette.accent}}/>{palette.name}<ChevronDown size={13}/></button>
          {open&&<div className="theme-options" id="shiftrun-themes" role="group" aria-label="Color palettes"><small>COLOR / ATMOSPHERE</small>{palettes.map(p=><button key={p.id} aria-pressed={theme===p.id} onClick={()=>choose(p.id)}><span className="swatches" aria-hidden="true">{p.swatches.map(c=><i key={c} style={{background:c}}/>)}</span><span>{p.name}<small>{p.subtitle}</small></span>{theme===p.id?<Check size={14}/>:<ArrowUpRight size={14}/>}</button>)}</div>}
        </div>
        <button aria-label={motion?'Pause motion':'Enable motion'} title={motion?'Pause motion':'Enable motion'} onClick={()=>setMotion(v=>!v)}>{motion?<Pause size={14}/>:<Play size={14}/>}</button>
      </div>
    </header>
    <div className="game-window"><div className="window-caption"><span aria-hidden="true"><i/><i/><i/></span><span>SHIFTRUN / FOLLOW THE INCIDENT</span><span><Shield size={11}/> SIMULATION</span></div>{children}</div>
  </>;
}

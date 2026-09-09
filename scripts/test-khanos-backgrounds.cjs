const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
const saved=new Map();
const context={window:{localStorage:{getItem:key=>saved.get(key),setItem:(key,value)=>saved.set(key,value)}},URLSearchParams};
vm.runInNewContext(read('khanos-backgrounds.js'),context);
const backgrounds=context.window.KhanBackgrounds;
assert.equal(backgrounds.list.length,5);
assert.equal(new Set(backgrounds.list.map(item=>item.id)).size,5);
assert.equal(backgrounds.initial('').id,'orbit');
backgrounds.remember('helix');
assert.equal(backgrounds.initial('').id,'helix');
assert.equal(backgrounds.initial('?theme=crimson&background=globe').id,'globe');
assert.equal(backgrounds.initial('?background=invalid').id,'helix');
backgrounds.remember('invalid');
assert.equal(backgrounds.initial('').id,'helix');
Object.defineProperty(context.window,'localStorage',{get(){throw Error('Storage blocked');}});
assert.equal(backgrounds.initial('').id,'orbit');
assert.equal(backgrounds.initial('?background=ripple').id,'ripple');
assert.doesNotThrow(()=>backgrounds.remember('vortex'));

function recorder(){
  const arcs=[],paths=[],colors=[];
  const finite=(...values)=>values.forEach(value=>assert.ok(Number.isFinite(value)));
  return {
    arcs,paths,colors,
    clearRect:finite,fillRect:finite,
    createRadialGradient(...values){finite(...values);assert.ok(values[5]>values[2]);return {addColorStop(){}};},
    beginPath(){},fill(){},stroke(){},
    moveTo(x,y){finite(x,y);paths.push([x,y]);},lineTo(x,y){finite(x,y);paths.push([x,y]);},
    arc(x,y,radius){finite(x,y,radius);assert.ok(radius>0);arcs.push([x,y,radius]);},
    set fillStyle(value){if(typeof value==='string')colors.push(value);}
  };
}
const palettes={window:{},location:{search:''},document:{documentElement:{dataset:{}}},URLSearchParams};
vm.runInNewContext(read('khanos-palettes.js'),palettes);
const shapes=new Set();
let frames=0;
for(const design of backgrounds.list){
  for(const palette of palettes.window.KhanThemes.list){
    const rgb=[0,2,4].map(i=>parseInt(palette.signal.slice(1).slice(i,i+2),16));
    for(const [width,height,preview] of [[1843,1270,false],[320,540,false],[120,76,true]]){
      const options={id:design.id,width,height,rgb,preview};
      const first=recorder();backgrounds.draw(first,options);
      assert.ok(first.arcs.length>=1200&&first.arcs.length<2400,'Bounded point count');
      assert.ok(first.colors.every(color=>color.startsWith(`rgba(${rgb.join(',')},`)),'Palette signal color');
      const still=recorder();backgrounds.draw(still,options);
      assert.deepEqual(still.arcs,first.arcs,'Paused/static rendering stays unchanged');
      const moved=recorder();backgrounds.draw(moved,{...options,angle:1.08});
      assert.notDeepEqual(moved.arcs,first.arcs,'Each design animates');
      if(width===120)assert.ok(first.arcs.some(([x,y])=>x>0&&x<width&&y>0&&y<height));
      frames+=3;
    }
  }
  const ctx=recorder();backgrounds.draw(ctx,{id:design.id,width:1000,height:700,rgb:[52,76,128]});
  shapes.add(JSON.stringify(ctx.arcs));
}
assert.equal(shapes.size,5,'Five distinct designs');

// Compare Orbit against the previous site's actual projection, not a new fixture.
const original=[];
for(let u=0;u<44;u++)for(let v=0;v<34;v++){
  const a=u/44*Math.PI*2,b=v/34*Math.PI*2,r=1.52+.47*Math.cos(b);
  const px=r*Math.cos(a),py=.47*Math.sin(b),pz=r*Math.sin(a);
  const x=px*Math.cos(.58)-pz*Math.sin(.58),z=px*Math.sin(.58)+pz*Math.cos(.58);
  const y=py*Math.cos(-.30)-z*Math.sin(-.30),depthZ=py*Math.sin(-.30)+z*Math.cos(-.30),depth=4.3/(4.3+depthZ);
  original.push({x:590+x*290*depth,y:329+y*290*depth,z:depthZ});
}
original.sort((a,b)=>b.z-a.z);
const orbitFrame=recorder();backgrounds.draw(orbitFrame,{id:'orbit',width:1000,height:700,rgb:[52,76,128]});
const dots=orbitFrame.arcs.filter(([, ,r])=>r<2);
assert.equal(dots.length,original.length);
original.forEach((p,i)=>{assert.ok(Math.abs(dots[i][0]-p.x)<1e-8);assert.ok(Math.abs(dots[i][1]-p.y)<1e-8);});
const fallback=recorder();backgrounds.draw(fallback,{id:'invalid',width:1000,height:700,rgb:[52,76,128]});
assert.deepEqual(fallback.arcs,orbitFrame.arcs);
assert.doesNotThrow(()=>backgrounds.draw(recorder(),{id:'__proto__',width:1000,height:700,rgb:[52,76,128]}));
assert.doesNotThrow(()=>backgrounds.draw(null,{width:0,height:0}));

const html=read('index.html');
assert.ok(html.indexOf('khanos-backgrounds.js?')<html.indexOf('khanos.js?'),'Renderer loads before desktop');

// Exercise the desktop's real selection and menu handlers without a browser.
const desktop=read('khanos.js'), buttons=backgrounds.list.map(item=>({
  dataset:{background:item.id},attributes:{},mark:{textContent:''},
  setAttribute(key,value){this.attributes[key]=value;},querySelector(){return this.mark;},
  focus(){ui.document.activeElement=this;}
}));
const markupContext={root:{},palette:palettes.window.KhanThemes.list[0],background:backgrounds.list[0],backgrounds,
  window:palettes.window,state:{motion:true},categories:[],notes:[{}],windowHTML:()=>'',userIcon:'',shiftrunIcon:''};
const markupStart=desktop.indexOf('  root.innerHTML = '),markupEnd=desktop.indexOf('\n  const $ = ',markupStart);
vm.runInNewContext(desktop.slice(markupStart,markupEnd),markupContext);
assert.equal((markupContext.root.innerHTML.match(/data-background="/g)||[]).length,5);
assert.equal((markupContext.root.innerHTML.match(/data-background-preview="/g)||[]).length,5);
const summary={focus(){ui.document.activeElement=this;}};
function menu(background){return {
  open:false,handlers:{},classList:{contains:()=>background},
  addEventListener(name,fn){this.handlers[name]=fn;},
  querySelectorAll(){return buttons;},contains(element){return buttons.includes(element)||element===summary;}
};}
const backgroundMenu=menu(true),paletteMenu=menu(false),label={textContent:''};
const elements={'.background-menu':backgroundMenu,'.background-menu summary':summary,'.current-background':label};
const ui={
  URL,backgrounds,background:backgrounds.list[0],document:{activeElement:summary},
  location:{href:'https://khanfarris.com/?theme=glacier#note-dns'},history:{replaceState(a,b,url){ui.location.href=url.href;}},
  $:selector=>elements[selector],$$:selector=>selector==='[data-background]'?buttons:[paletteMenu,backgroundMenu],
  paintSignalOnce(){ui.paints++;},paintBackgroundPreviews(){ui.previews++;},announce(message){ui.message=message;},paints:0,previews:0
};
vm.createContext(ui);
const selection=desktop.match(/  function setBackground\(id\) \{[\s\S]*?\n  \}/);
assert.ok(selection);vm.runInContext(selection[0],ui);
ui.setBackground('vortex');
assert.equal(ui.background.id,'vortex');assert.equal(label.textContent,'Vortex');
assert.equal(buttons.filter(button=>button.attributes['aria-pressed']==='true').length,1);
assert.equal(ui.document.activeElement,summary);assert.equal(ui.paints,1);
const selectionURL=new URL(ui.location.href);
assert.equal(selectionURL.searchParams.get('background'),'vortex');
assert.equal(selectionURL.searchParams.get('theme'),'glacier');assert.equal(selectionURL.hash,'#note-dns');
ui.setBackground('invalid');assert.equal(ui.paints,1);
const menuStart=desktop.indexOf("  $$('.workspace-menu').forEach(menu=>{\n    menu.addEventListener('toggle'");
assert.ok(menuStart>0);
vm.runInContext(desktop.slice(menuStart,desktop.indexOf('\n\n  function setBackground',menuStart)),ui);
backgroundMenu.open=true;paletteMenu.open=true;backgroundMenu.handlers.toggle();
assert.equal(paletteMenu.open,false);assert.equal(ui.previews,1);
for(const [key,index] of [['ArrowDown',0],['ArrowDown',1],['End',4],['ArrowDown',0],['ArrowUp',4],['Home',0]]){
  let prevented=false;backgroundMenu.handlers.keydown({key,preventDefault(){prevented=true;}});
  assert.ok(prevented);assert.equal(ui.document.activeElement,buttons[index]);
}
backgroundMenu.handlers.focusout({relatedTarget:{}});assert.equal(backgroundMenu.open,false);
console.log(`Passed: ${frames} frames across all five backgrounds and palettes, desktop/mobile/previews, original Orbit geometry, motion, saved preferences, URL selection, blocked storage, and keyboard menu navigation.`);

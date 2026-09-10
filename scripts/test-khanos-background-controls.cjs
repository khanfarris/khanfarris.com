const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
const scope={window:{},URLSearchParams};
vm.runInNewContext(read('khanos-backgrounds.js'),scope);
function emitter(){
  const handlers=new Map();
  return {
    handlers,
    addEventListener(type,handler){if(!handlers.has(type))handlers.set(type,new Set());handlers.get(type).add(handler);},
    removeEventListener(type,handler){handlers.get(type)?.delete(handler);},
    emit(type,values={}){
      const event={button:0,buttons:1,pointerId:1,pointerType:'mouse',clientX:0,clientY:0,deltaMode:0,deltaY:0,
        preventDefault(){this.prevented=true;},stopPropagation(){this.stopped=true;},...values};
      for(const handler of handlers.get(type)||[])handler(event);
      return event;
    }
  };
}
const host=emitter(),doc=Object.assign(emitter(),{defaultView:host,hidden:false});
const captures=new Set(),classes=new Set(),canvas=Object.assign(emitter(),{
  ownerDocument:doc,clientHeight:1000,clientWidth:1600,
  classList:{toggle(name,value){if(value)classes.add(name);else classes.delete(name);}},
  focus(){canvas.focused=true;},setPointerCapture(id){captures.add(id);},
  hasPointerCapture:id=>captures.has(id),releasePointerCapture(id){captures.delete(id);canvas.emit('lostpointercapture',{pointerId:id});}
});
let changes=0;const gestures=[];
const controls=scope.window.KhanBackgrounds.attachControls(canvas,{onChange(){changes++;},onGesture:active=>gestures.push(active)});
const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-9,`${a} != ${b}`);
canvas.emit('wheel',{deltaY:-100});assert.ok(controls.view.zoom>1);
canvas.emit('wheel',{deltaY:100});close(controls.view.zoom,1);
for(const modifier of ['ctrlKey','metaKey']){
  const event=canvas.emit('wheel',{deltaY:-100,[modifier]:true});assert.ok(!event.prevented);close(controls.view.zoom,1);
}
canvas.emit('wheel',{deltaY:-1,deltaMode:1});const lineZoom=controls.view.zoom;
controls.reset();canvas.emit('wheel',{deltaY:-16});close(controls.view.zoom,lineZoom);
controls.reset();canvas.emit('wheel',{deltaY:-1,deltaMode:2});assert.ok(controls.view.zoom>lineZoom);
for(let i=0;i<100;i++)canvas.emit('wheel',{deltaY:-1000});
assert.equal(controls.view.zoom,2.5);
const cappedChanges=changes;canvas.emit('wheel',{deltaY:-1000});assert.equal(changes,cappedChanges);
for(let i=0;i<100;i++)canvas.emit('wheel',{deltaY:1000});
assert.equal(controls.view.zoom,.35);
controls.reset();
for(const button of [1,2]){canvas.emit('pointerdown',{button});assert.ok(!controls.dragging);}
canvas.emit('pointerdown',{clientX:100,clientY:100});
assert.ok(controls.dragging&&canvas.focused&&captures.has(1)&&classes.has('is-grabbing'));
canvas.emit('pointermove',{clientX:200,clientY:150});assert.ok(controls.view.yaw>0&&controls.view.pitch>0);
canvas.emit('pointerup');assert.ok(!controls.dragging&&!captures.size&&!classes.size);
const ended={...controls.view};canvas.emit('pointermove',{clientX:999});assert.deepEqual({...controls.view},ended);
for(const endType of ['pointercancel','lostpointercapture']){
  canvas.emit('pointerdown');canvas.emit(endType);assert.ok(!controls.dragging&&!captures.size);
}
canvas.emit('pointerdown');canvas.emit('pointermove',{buttons:0});assert.ok(!controls.dragging);
canvas.emit('pointerdown');host.emit('blur');assert.ok(!controls.dragging&&!captures.size);
canvas.emit('pointerdown');host.emit('pagehide');assert.ok(!controls.dragging&&!captures.size);
canvas.emit('pointerdown');doc.hidden=true;doc.emit('visibilitychange');assert.ok(!controls.dragging&&!captures.size);doc.hidden=false;

// A pinch zooms without adding a rotation, and lifting one finger resets its drag origin.
controls.reset();canvas.emit('pointerdown',{pointerType:'touch',pointerId:1,clientX:100,clientY:100});
canvas.emit('pointerdown',{pointerType:'touch',pointerId:2,clientX:200,clientY:100});
canvas.emit('pointermove',{pointerType:'touch',pointerId:2,clientX:300,clientY:100});
close(controls.view.zoom,2);close(controls.view.yaw,0);close(controls.view.pitch,0);
canvas.emit('pointerup',{pointerId:2});
canvas.emit('pointermove',{pointerType:'touch',pointerId:1,clientX:100,clientY:100});close(controls.view.yaw,0);
canvas.emit('pointermove',{pointerType:'touch',pointerId:1,clientX:120,clientY:100});assert.ok(controls.view.yaw>0);
canvas.emit('pointerup');
const resetEvent=canvas.emit('dblclick');assert.ok(resetEvent.prevented);assert.deepEqual({...controls.view},{zoom:1,yaw:0,pitch:0});
for(const key of ['ArrowRight','ArrowUp','+']){
  const event=canvas.emit('keydown',{key});assert.ok(event.prevented&&event.stopped);
}
assert.ok(controls.view.yaw>0&&controls.view.pitch<0&&controls.view.zoom>1);
canvas.emit('keydown',{key:'0'});assert.deepEqual({...controls.view},{zoom:1,yaw:0,pitch:0});
for(const event of [canvas.emit('keydown',{key:'Tab'}),canvas.emit('keydown',{key:'+',ctrlKey:true})])assert.ok(!event.prevented);
canvas.emit('pointerdown');const escape=canvas.emit('keydown',{key:'Escape'});assert.ok(escape.stopped&&!controls.dragging);
for(let i=0;i<100;i++)canvas.emit('keydown',{key:'ArrowUp'});close(controls.view.pitch,-Math.PI/2);
canvas.emit('keydown',{key:'Home'});close(controls.view.pitch,0);
// Only the canvas has gesture listeners; scrolling or dragging in windows cannot change the view.
const unchanged={...controls.view};
for(const target of [host,doc])for(const type of ['wheel','pointerdown','pointermove'])target.emit(type,{deltaY:100,clientX:200});
assert.deepEqual({...controls.view},unchanged);
controls.destroy();assert.ok([...canvas.handlers.values(),...doc.handlers.values(),...host.handlers.values()].every(set=>set.size===0));
assert.equal(gestures[gestures.length-1],false);

// The real scheduler renders user gestures while paused, without starting an idle loop.
const source=read('khanos.js'),queue=new Map();let ticket=0;
const loop={signalDirty:false,frame:0,lastTime:0,renderTime:0,angle:.58,document:{hidden:false},backgroundControls:{dragging:false},automatic:false,paints:0,
  canAnimate:()=>loop.automatic,paintSignalOnce(){loop.paints++;},
  requestAnimationFrame(fn){queue.set(++ticket,fn);return ticket;}};
vm.createContext(loop);
for(const name of ['requestSignalPaint','animateSignal']){
  const fn=source.match(new RegExp('  function '+name+'\\([^)]*\\) \\{[\\s\\S]*?\\n  \\}'));
  assert.ok(fn);vm.runInContext(fn[0],loop);
}
const tick=time=>{const callbacks=[...queue.values()];queue.clear();callbacks.forEach(fn=>fn(time));};
for(let i=0;i<10;i++)loop.requestSignalPaint();assert.equal(queue.size,1);
tick(1000);assert.equal(loop.paints,1);assert.equal(queue.size,0);close(loop.angle,.58);
loop.automatic=true;loop.backgroundControls.dragging=true;loop.requestSignalPaint();tick(1100);
assert.equal(queue.size,0);close(loop.angle,.58);
loop.backgroundControls.dragging=false;loop.lastTime=0;loop.requestSignalPaint();tick(1200);tick(1240);
assert.equal(queue.size,1);assert.ok(loop.angle>.58);
queue.clear();loop.frame=0;loop.document.hidden=true;loop.requestSignalPaint();assert.equal(queue.size,0);
console.log('Passed: wheel units and limits, browser zoom, drag capture and cancellation, touch pinch, keyboard/reset, window isolation, cleanup, paused interaction, and single-loop scheduling.');

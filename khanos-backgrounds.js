(() => {
  'use strict';

  const TAU = Math.PI * 2;
  const storageKey = 'khanos-background';
  const list = [
    {id:'orbit', name:'Orbit', subtitle:'The original rotating constellation'},
    {id:'helix', name:'Helix', subtitle:'Twin strands woven through space'},
    {id:'ripple', name:'Ripple', subtitle:'Waves across a field of starlight'},
    {id:'globe', name:'Globe', subtitle:'A slowly turning celestial sphere'},
    {id:'vortex', name:'Vortex', subtitle:'Spiral arms around a quiet center'}
  ];
  const find = id => list.find(item => item.id === id);
  function initial(search) {
    const requested = find(new URLSearchParams(search).get('background'));
    if (requested) return requested;
    try { return find(window.localStorage.getItem(storageKey)) || list[0]; }
    catch { return list[0]; }
  }
  function remember(id) {
    if (!find(id)) return;
    try { window.localStorage.setItem(storageKey, id); } catch { /* Storage is optional. */ }
  }

  // Fixed, bounded meshes keep the animation independent of screen resolution.
  // Orbit retains the original point layout, camera, and rotation speed.
  const orbit = {points:[], paths:[]};
  for (let u=0; u<44; u++) for (let v=0; v<34; v++) {
    const a=u/44*TAU, b=v/34*TAU, radius=1.52+.47*Math.cos(b);
    orbit.points.push({x:radius*Math.cos(a), y:.47*Math.sin(b), z:radius*Math.sin(a), band:v/34});
  }

  const helix = {points:[], paths:[]};
  for (let strand=0; strand<2; strand++) {
    for (let lane=0; lane<7; lane++) {
      const path=[];
      for (let step=0; step<100; step++) {
        const t=step/99, phase=t*TAU*2.1+strand*Math.PI, radius=.68+(lane-3)*.027;
        path.push(helix.points.length);
        helix.points.push({x:(t-.5)*5.2, y:radius*Math.cos(phase), z:radius*Math.sin(phase), band:lane/7});
      }
      if (lane===3) helix.paths.push(path);
    }
  }
  for (let step=0; step<100; step+=5) helix.paths.push([300+step, 1000+step]);

  const ripple = {points:[], paths:[]};
  for (let row=0; row<32; row++) {
    const path=[];
    for (let column=0; column<52; column++) {
      path.push(ripple.points.length);
      ripple.points.push({x:(column/51-.5)*5.8, y:0, z:(row/31-.5)*4.4, band:row/32});
    }
    if (row%5===0) ripple.paths.push(path);
  }

  const globe = {points:[], paths:[]};
  for (let latitude=1; latitude<26; latitude++) {
    const path=[], a=latitude/26*Math.PI;
    for (let longitude=0; longitude<52; longitude++) {
      const b=longitude/52*TAU;
      path.push(globe.points.length);
      globe.points.push({x:1.9*Math.sin(a)*Math.cos(b), y:1.9*Math.cos(a), z:1.9*Math.sin(a)*Math.sin(b), band:latitude/26});
    }
    if (latitude%5===0) globe.paths.push([...path,path[0]]);
  }
  for (let longitude=0; longitude<52; longitude+=13) {
    globe.paths.push(Array.from({length:25},(_,row)=>row*52+longitude));
  }

  const vortex = {points:[], paths:[]};
  for (let arm=0; arm<6; arm++) {
    const path=[];
    for (let step=0; step<240; step++) {
      const t=step/239, radius=.36+2.35*Math.sqrt(t), phase=arm/6*TAU+t*5.6;
      path.push(vortex.points.length);
      vortex.points.push({x:radius*Math.cos(phase), y:.14*Math.sin(t*TAU), z:radius*Math.sin(phase), band:arm/6});
    }
    vortex.paths.push(path);
  }
  const meshes = {orbit, helix, ripple, globe, vortex};
  const clamp = value => Math.max(0,Math.min(1,value));

  function project(id, width, height, angle, preview, view) {
    const mesh=meshes[id];
    const zoom=preview?1:(view?.zoom??1), viewYaw=preview?0:(view?.yaw??0), viewPitch=preview?0:(view?.pitch??0);
    const scale=(preview ? Math.min(width*.16,height*.29) : Math.min(width*.29,height*.47))*zoom;
    const cx=width*(preview ? .5 : .59), cy=height*(preview ? .5 : .47);
    const yaw=id==='helix'?0:id==='ripple'?angle*.16:id==='vortex'?-angle*.52:angle;
    const tilt=id==='orbit'?-.30:id==='ripple'?-.62:id==='vortex'?-.85:id==='globe'?-.16:0;
    const co=Math.cos(yaw), si=Math.sin(yaw), ct=Math.cos(tilt), st=Math.sin(tilt);
    const hx=Math.cos(angle), hs=Math.sin(angle), roll=-.24, cr=Math.cos(roll), sr=Math.sin(roll);
    const vc=Math.cos(viewYaw), vs=Math.sin(viewYaw), pc=Math.cos(viewPitch), ps=Math.sin(viewPitch);
    return mesh.points.map(p=>{
      let px=p.x, py=p.y, pz=p.z;
      if (id==='helix') {
        const y=py*hx-pz*hs;
        pz=py*hs+pz*hx;
        py=px*sr+y*cr; px=px*cr-y*sr;
      } else if (id==='ripple') {
        const distance=Math.hypot(px*.8,pz);
        py=Math.sin(distance*2.6-angle*4)*.27+Math.sin(px*1.5+angle*2)*.12;
      }
      const baseX=px*co-pz*si, baseZ=px*si+pz*co;
      const baseY=py*ct-baseZ*st, tiltedZ=py*st+baseZ*ct;
      const x=baseX*vc-tiltedZ*vs, rotatedZ=baseX*vs+tiltedZ*vc;
      const y=baseY*pc-rotatedZ*ps, depthZ=baseY*ps+rotatedZ*pc, depth=4.3/(4.3+depthZ);
      return {x:cx+x*scale*depth, y:cy+y*scale*depth, z:depthZ, band:p.band};
    });
  }

  // The desktop owns the only animation loop. Menu thumbnails use the same renderer,
  // rendered once, so opening the picker never starts five extra animations.
  function draw(ctx, {id='orbit',width,height,angle=.58,rgb,preview=false,view}) {
    if (!ctx || width<=0 || height<=0) return;
    if (!find(id)) id='orbit';
    const [r,g,b]=rgb;
    ctx.clearRect(0,0,width,height);
    const radius=Math.min(width*.6,height*.83);
    const glow=ctx.createRadialGradient(width*.57,height*.42,Math.min(20,radius*.1),width*.57,height*.42,radius);
    glow.addColorStop(0,`rgba(${r},${g},${b},0.075)`);
    glow.addColorStop(.5,`rgba(${r},${g},${b},0.025)`);
    glow.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle=glow;ctx.fillRect(0,0,width,height);
    const projected=project(id,width,height,angle,preview,view);
    ctx.lineWidth=preview ? .6 : .7;
    ctx.strokeStyle=`rgba(${r},${g},${b},${preview ? .30 : .12})`;
    for (const path of meshes[id].paths) {
      ctx.beginPath();
      path.forEach((index,i)=>{
        const p=projected[index];
        if (i===0) ctx.moveTo(p.x,p.y); else ctx.lineTo(p.x,p.y);
      });
      ctx.stroke();
    }
    projected.sort((a,b)=>b.z-a.z).forEach(p=>{
      const front=clamp((2.1-p.z)/4.2);
      const alpha=preview ? .22+front*.65 : .12+front*.47;
      const size=(.6+front*1.35)*(preview ? .43 : 1);
      ctx.beginPath();ctx.fillStyle=`rgba(${r},${g},${b},${alpha})`;
      ctx.arc(p.x,p.y,size,0,TAU);ctx.fill();
      if (!preview && front>.85 && p.band<.08) {
        ctx.beginPath();ctx.fillStyle=`rgba(${r},${g},${b},.045)`;
        ctx.arc(p.x,p.y,size*3,0,TAU);ctx.fill();
      }
    });
  }

  function attachControls(canvas,{onChange=()=>{},onGesture=()=>{}}={}) {
    const view={zoom:1,yaw:0,pitch:0}, minZoom=.35, maxZoom=2.5;
    const pointers=new Map(), listeners=[], doc=canvas.ownerDocument, host=doc.defaultView;
    let gesture=null, dragging=false;
    const listen=(target,type,handler,options)=>{
      target.addEventListener(type,handler,options);
      listeners.push(()=>target.removeEventListener(type,handler,options));
    };
    const measure=()=>{
      const points=[...pointers.values()];
      if(points.length>1)return {count:points.length,distance:Math.hypot(points[1].x-points[0].x,points[1].y-points[0].y)};
      return points.length?{count:1,...points[0]}:null;
    };
    function syncGesture() {
      gesture=measure();
      const next=pointers.size>0;
      if(next!==dragging){dragging=next;canvas.classList.toggle('is-grabbing',next);onGesture(next);}
    }
    function zoomBy(factor) {
      if(!Number.isFinite(factor)||factor<=0)return;
      const next=Math.max(minZoom,Math.min(maxZoom,view.zoom*factor));
      if(next===view.zoom)return;
      view.zoom=next;onChange();
    }
    function rotate(dx,dy) {
      view.yaw=(view.yaw+dx)%TAU;
      view.pitch=Math.max(-Math.PI/2,Math.min(Math.PI/2,view.pitch+dy));
      onChange();
    }
    function reset() {view.zoom=1;view.yaw=0;view.pitch=0;onChange();}
    function end(event) {
      if(!pointers.delete(event.pointerId))return;
      if(canvas.hasPointerCapture(event.pointerId))canvas.releasePointerCapture(event.pointerId);
      syncGesture();
    }
    function cancel() {for(const pointerId of [...pointers.keys()])end({pointerId});}
    listen(canvas,'pointerdown',event=>{
      if(event.button!==0||event.ctrlKey||event.metaKey||event.altKey)return;
      event.preventDefault();canvas.focus({preventScroll:true});
      pointers.set(event.pointerId,{x:event.clientX,y:event.clientY});
      canvas.setPointerCapture(event.pointerId);syncGesture();
    });
    listen(canvas,'pointermove',event=>{
      if(!pointers.has(event.pointerId))return;
      if(event.pointerType==='mouse'&&(event.buttons&1)===0){end(event);return;}
      pointers.set(event.pointerId,{x:event.clientX,y:event.clientY});
      const next=measure();
      if(gesture?.count===1&&next.count===1){
        const sensitivity=TAU/Math.max(500,canvas.clientHeight);
        rotate((next.x-gesture.x)*sensitivity,(next.y-gesture.y)*sensitivity);
      }else if(gesture?.count>1&&next.count>1&&gesture.distance>0&&next.distance>0){
        zoomBy(next.distance/gesture.distance);
      }
      gesture=next;
    });
    for(const type of ['pointerup','pointercancel','lostpointercapture'])listen(canvas,type,end);
    listen(canvas,'wheel',event=>{
      // Ctrl/Command + wheel remains browser zoom. Window scroll events never reach this canvas.
      if(event.ctrlKey||event.metaKey||!event.deltaY)return;
      event.preventDefault();
      const unit=event.deltaMode===1?16:event.deltaMode===2?canvas.clientHeight:1;
      const delta=Math.max(-350,Math.min(350,event.deltaY*unit));
      zoomBy(Math.exp(-delta*.0015));
    },{passive:false});
    listen(canvas,'dblclick',event=>{if(event.button===0){event.preventDefault();reset();}});
    listen(canvas,'keydown',event=>{
      if(event.ctrlKey||event.metaKey||event.altKey)return;
      const step=Math.PI/36;
      const keys={ArrowLeft:()=>rotate(-step,0),ArrowRight:()=>rotate(step,0),ArrowUp:()=>rotate(0,-step),ArrowDown:()=>rotate(0,step),'+':()=>zoomBy(1.15),'=':()=>zoomBy(1.15),'-':()=>zoomBy(1/1.15),'0':reset,Home:reset,Escape:cancel};
      if(!Object.hasOwn(keys,event.key))return;
      event.preventDefault();event.stopPropagation();keys[event.key]();
    });
    listen(host,'blur',cancel);
    listen(host,'pagehide',cancel);
    listen(doc,'visibilitychange',()=>{if(doc.hidden)cancel();});
    return {view,minZoom,maxZoom,zoomBy,reset,get dragging(){return dragging;},destroy(){cancel();listeners.forEach(remove=>remove());}};
  }

  window.KhanBackgrounds={list,initial,remember,draw,attachControls};
})();

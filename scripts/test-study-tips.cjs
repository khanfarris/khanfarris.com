// Deterministic controller checks; these do not simulate browser layout.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),read=f=>fs.readFileSync(path.join(root,f),'utf8');
const scope={};vm.runInNewContext(read('study-exercises.js'),scope);
class Target{
  constructor(){this.listeners=new Map();this.dataset={};this.style={};this.attrs={};this.hidden=true;this.isConnected=true;this.rect={left:20,top:100,width:100,height:40};this.open=false;}
  addEventListener(type,fn){const list=this.listeners.get(type)||[];list.push(fn);this.listeners.set(type,list);}
  removeEventListener(type,fn){this.listeners.set(type,(this.listeners.get(type)||[]).filter(f=>f!==fn));}
  fire(type,props={}){const e={target:this,detail:1,pointerType:'mouse',preventDefault(){this.prevented=true;},stopImmediatePropagation(){this.stopped=true;},...props};for(const fn of this.listeners.get(type)||[])fn(e);return e;}
  setAttribute(name,value){this.attrs[name]=String(value);}
  contains(node){return node===this||node?.parent===this;}
  closest(){return this.layer;}
  getBoundingClientRect(){const height=Math.min(this.rect.height,parseFloat(this.style.maxHeight)||Infinity);return {...this.rect,height,bottom:this.rect.top+height,right:this.rect.left+this.rect.width};}
  showPopover(){assert.equal(this.hidden,false);this.popoverOpen=true;}
  hidePopover(){this.popoverOpen=false;}
  matches(selector){assert.equal(selector,':popover-open');return Boolean(this.popoverOpen);}
}
const doc=new Target(),view=new Target(),layer=new Target();layer.open=true;
doc.documentElement={clientWidth:1280};view.innerWidth=1280;view.innerHeight=800;
let timer=0;const timers=new Map();view.setTimeout=fn=>{timers.set(++timer,fn);return timer;};view.clearTimeout=id=>timers.delete(id);
const flush=()=>{const callbacks=[...timers.values()];timers.clear();callbacks.forEach(fn=>fn());};
const buttons=[new Target(),new Target()],tips=[new Target(),new Target()];
buttons.forEach((button,i)=>{button.layer=layer;button.dataset.studyTip='tip-'+i;tips[i].rect={left:0,top:0,width:350,height:220};});
doc.getElementById=id=>tips[Number(id.slice(-1))];doc.querySelectorAll=selector=>{assert.equal(selector,'[data-study-tip]');return buttons;};
const controller=scope.StudyTips.create(doc,view);controller.mount(doc);controller.mount(doc);
const shown=i=>buttons[i].attrs['aria-expanded']==='true'&&!tips[i].hidden;
assert.equal(buttons[0].listeners.get('click').length,1,'Repeated reader mounting must not duplicate listeners');
assert.equal(layer.listeners.get('toggle').length,2);
buttons[0].fire('pointerenter');assert.ok(shown(0));
buttons[0].fire('pointerleave');tips[0].fire('pointerenter');flush();assert.ok(shown(0),'The explanation must stay available when hovered');
tips[0].fire('pointerleave');flush();assert.ok(!shown(0));
doc.activeElement=buttons[0];buttons[0].fire('focus');assert.ok(shown(0));
buttons[0].fire('pointerleave');flush();assert.ok(shown(0),'Keyboard focus must preserve the explanation');
const escape=doc.fire('keydown',{key:'Escape'});assert.ok(escape.prevented&&escape.stopped);assert.ok(!shown(0));flush();assert.ok(!shown(0),'Escape must not immediately reopen a focused tooltip');
buttons[0].fire('click',{detail:0});assert.ok(shown(0));buttons[0].fire('click',{detail:0});assert.ok(!shown(0));
doc.activeElement=null;buttons[0].fire('pointerenter',{pointerType:'touch'});assert.ok(!shown(0));
doc.activeElement=buttons[0];buttons[0].fire('focus');buttons[0].fire('click');assert.ok(shown(0),'First touch activation must not be canceled by its focus event');
buttons[0].fire('click');assert.ok(!shown(0),'A second tap must dismiss');
buttons[0].fire('click');assert.ok(shown(0));doc.fire('pointerdown',{target:new Target()});assert.ok(!shown(0));
doc.activeElement=null;buttons[0].fire('pointerenter');buttons[1].fire('pointerenter');assert.ok(!shown(0)&&shown(1),'Only the current item should be shown');
view.fire('scroll',{target:tips[1]});assert.ok(shown(1),'Scrolling a long explanation should not dismiss it');
view.fire('scroll',{target:doc});assert.ok(!shown(1),'Scrolling the reader must remove a stale floating explanation');
buttons[0].fire('pointerenter');layer.open=false;layer.fire('toggle');assert.ok(!shown(0));layer.open=true;
buttons[0].rect={left:1220,top:710,width:50,height:35};buttons[0].fire('pointerenter');
assert.ok(parseFloat(tips[0].style.left)>=8);assert.ok(parseFloat(tips[0].style.left)+350<=1272);assert.ok(parseFloat(tips[0].style.top)<710,'Place above a bottom-edge trigger');
view.fire('resize');assert.ok(!shown(0));
doc.documentElement.clientWidth=320;view.innerWidth=320;view.innerHeight=260;buttons[0].rect={left:280,top:205,width:25,height:35};tips[0].rect.width=296;
buttons[0].fire('pointerenter');assert.ok(parseFloat(tips[0].style.left)>=8);assert.ok(parseFloat(tips[0].style.left)+296<=312);assert.ok(parseFloat(tips[0].style.top)>=8);
view.fire('pagehide');assert.ok(!shown(0));
tips[0].showPopover=undefined;tips[0].hidePopover=undefined;buttons[0].fire('pointerenter');assert.equal(tips[0].dataset.fallbackOpen,'true');controller.close();assert.equal(tips[0].dataset.fallbackOpen,undefined);assert.ok(tips[0].hidden);
controller.destroy();assert.equal(doc.listeners.get('keydown').length,0);assert.equal(view.listeners.get('scroll').length,0);buttons[0].fire('pointerenter');assert.ok(!shown(0));

// Guard the coverage and distinctions that prompted this study-note revision.
const data=JSON.parse(read('knowledge-content.json')),article=data.articles.find(a=>a.slug==='osi');
const layers=[...article.body.matchAll(/<details\b[^>]*data-osi-layer="(\d)"[^>]*>([\s\S]*?)<\/details>/g)];
assert.equal(layers.length,7);const placement=new Map();
for(const [,number,body] of layers){
 for(const [,id] of body.matchAll(/data-osi-item="([a-z0-9-]+)"/g)){assert.ok(!placement.has(id));placement.set(id,Number(number));}
 for(const [,tipID] of body.matchAll(/data-study-tip="([a-z0-9-]+)"/g)){
  assert.ok(body.includes('aria-describedby="'+tipID+'"'));assert.ok(body.includes('id="'+tipID+'" role="tooltip"'));
 }
}
for(const [number,ids] of [[1,['hub','repeater','copper','fiber']],[2,['arp','switch','bridge','ap','nic','dot1x','stp','lldp','lacp']],[3,['router','l3-switch','ipv4','ipv6','icmp','ipsec','ah','esp','gre','ospf','eigrp','bgp']],[4,['tcp','udp','stateful-firewall','l4-lb']],[5,['session-state','netbios','rpc-session']],[6,['tls','ssl']],[7,['dhcp','dns','http','https','smb','ldap','ldaps','kerberos','radius','tacacs','ssh','rdp','ftp','sftp','tftp','telnet','smtp','smtps','snmp','ntp','syslog','sql','sip','proxy','waf','l7-lb']]]){
 for(const id of ids)assert.equal(placement.get(id),number,id+' layer placement');
}
assert.ok(layers.find(([_,n])=>n==='3')[2].includes('protocol-stack placement application layer'),'BGP needs its routing-role qualification');
assert.ok(layers.find(([_,n])=>n==='2')[2].includes('L2/L3 boundary'),'ARP needs the link/IP distinction');
assert.ok(!article.body.includes('data-exercise="osi"'),'Keep the seven-layer diagram, not the retired multi-part exercise');
console.log(`Study tooltip checks passed: hover persistence, focus, touch, Escape, outside dismissal, collapse, scroll, viewport edges, fallback, cleanup, and ${placement.size} linked OSI explanations.`);

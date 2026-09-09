/* Run after build-knowledge.cjs. No dependencies or live services required. */
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const read=f=>fs.readFileSync(path.join(root,f),'utf8');
const data=JSON.parse(read('knowledge-content.json'));
const context={};vm.createContext(context);vm.runInContext(read('study-exercises.js'),context);
const m=context.StudyModels;
let checks=0;
const eq=(actual,expected)=>{assert.equal(actual,expected);checks++;};
for(const [ip,prefix,network,broadcast,mask,usable] of [
 ['192.168.204.30',28,'192.168.204.16','192.168.204.31','255.255.255.240',14],
 ['172.19.155.200',18,'172.19.128.0','172.19.191.255','255.255.192.0',16382],
 ['10.50.132.75',21,'10.50.128.0','10.50.135.255','255.255.248.0',2046],
 ['255.255.255.255',0,'0.0.0.0','255.255.255.255','0.0.0.0',4294967294],
 ['192.0.2.11',31,'192.0.2.10',null,'255.255.255.254',2],
 ['192.0.2.11',32,'192.0.2.11',null,'255.255.255.255',1]
]){
 const r=m.subnet(ip,prefix);eq(r.network,network);eq(r.broadcast,broadcast);eq(r.mask,mask);eq(r.usable,usable);
}
for(const [ip,prefix] of [['256.1.1.1',24],['10.1.1',24],['1e2.0.0.1',24],['<script>',24],['10.0.0.1',33],['10.0.0.1',-1],['10.0.0.1',24.5]]){assert.throws(()=>m.subnet(ip,prefix));checks++;}
for(let prefix=0;prefix<=32;prefix++){
 const r=m.subnet('203.0.113.197',prefix);
 eq(r.binary.length,32);eq(r.total,2**(32-prefix));
 const network=r.network.split('.').reduce((n,x)=>n*256+Number(x),0);
 eq(network%r.total,0);
}
for(const vlan of [20,30])for(const route of [false,true])for(const allow of [false,true])eq(m.vlan(vlan,route,allow).allowed,vlan===30||(route&&allow));
for(let threshold=0;threshold<8;threshold++){
 let count=0;for(let severity=0;severity<8;severity++)if(m.syslog(severity,threshold))count++;
 eq(count,threshold+1);
}
for(const finance of [false,true])for(const mfa of [false,true])for(const compliant of [false,true]){
 const r=m.access(finance,mfa,compliant);eq(r.allowed,finance&&mfa&&compliant);eq(r.policyAllowed,mfa&&compliant);
 eq(r.missing.length,[finance,mfa,compliant].filter(v=>!v).length);
}
for(let n=0;n<=40;n++){
 const r=m.tcp(n);eq(r.header%4,0);eq(r.offset*4,r.header);eq(r.header,20+n+r.padding);
 assert.ok(r.padding>=0&&r.padding<=3);assert.ok(r.header>=20&&r.header<=60);checks+=2;
}
eq(m.tcp(10).padding,2);eq(m.tcp(10).offset,8);
const slugs=new Set(data.articles.map(a=>a.slug));eq(slugs.size,data.articles.length);
const allExercises=new Set();
for(const a of data.articles){
 for(const key of ['title','body','principle','question','answer','kind','category','basis'])assert.ok(typeof a[key]==='string'&&a[key].trim(),`${a.slug}: ${key}`);
 assert.ok(!Object.hasOwn(a,'connection'),`${a.slug}: retired connection field`);
 const words=a.body.replace(/<[^>]+>/g,' ').split(/\s+/).filter(Boolean).length;
 assert.ok(words>250,`${a.slug}: incomplete article (${words} words)`);
 assert.ok(a.sources.length&&a.sources.every(k=>data.refs[k]),`${a.slug}: sources`);
 assert.ok(a.related.every(s=>slugs.has(s)),`${a.slug}: related`);
 assert.ok(!a.body.includes('THE CONNECTION')&&!a.body.includes('undefined'),`${a.slug}: stale or missing text`);
 assert.ok(!/href=["'][^"']*(?:knowledge\.html|kb-[a-z0-9-]+\.html)/i.test(a.body),`${a.slug}: retired standalone link`);
 for(const [,s] of a.body.matchAll(/href="#note-([a-z0-9-]+)"/g))assert.ok(slugs.has(s),`${a.slug}: broken link ${s}`);
 for(const [,id] of a.body.matchAll(/data-exercise="([a-z0-9-]+)"/g)){allExercises.add(id);assert.ok(read('study-exercises.js').includes(id+'(box)'),`No exercise implementation for ${id}`);}
 checks+=14;
}
for(const id of ['subnet','vlan','arp','dhcp','syslog','response','m365','tcp','triage','incident','phishing','vulnerability','firewall','routing','switching'])eq(allExercises.has(id),true);
for(const source of ['staff','guest'])for(const service of ['smb','https'])for(const specificFirst of [false,true]){
 const r=m.firewall(source,service,specificFirst);
 eq(r.allowed,source==='staff'&&service==='smb'&&specificFirst);
 eq(r.rules.filter(rule=>rule.stage==='selected').length,1);
 eq(r.match,r.allowed?'staff-smb':'deny-server');
 if(!specificFirst)eq(r.rules[1].stage,'skipped');
}
for(const [ip,prefix] of [['10.20.30.0',24],['10.20.30.255',24],['10.20.29.255',16],['10.20.31.0',16],['10.20.0.0',16],['10.20.255.255',16],['10.21.0.0',0],['192.0.2.80',0]]){
 eq(m.routing(ip).chosen.prefix,prefix);
 eq(m.routing(ip,false).chosen.prefix,prefix===24?16:prefix);
 eq(m.routing(ip,true,false).chosen?.prefix??null,prefix===0?null:prefix);
}
for(const value of ['','10.20.30.999','10.20.30','bad']){assert.throws(()=>m.routing(value));checks++;}
let frame=m.switching({},'laptop','printer');
eq(frame.mode,'flood');eq(frame.egress.join(','),'2,3');eq(Object.keys(frame.table).length,1);
const firstTable=frame.table;
frame=m.switching(firstTable,'printer','laptop');eq(frame.mode,'unicast');eq(frame.egress.join(','),'1');eq(Object.keys(frame.table).length,2);eq(Object.keys(firstTable).length,1);
frame=m.switching(frame.table,'laptop','printer');eq(frame.mode,'unicast');eq(frame.egress.join(','),'2');
frame=m.switching(frame.table,'guest','printer');eq(frame.mode,'flood');eq(frame.egress.length,0);
frame=m.switching(frame.table,'laptop','laptop');eq(frame.mode,'filtered');eq(frame.egress.length,0);
const collision=m.switching({'20:02:00:00:00:00:22':4},'laptop','printer');eq(collision.mode,'flood');eq(collision.egress.join(','),'2,3');
for(const [type,answers] of Object.entries({triage:['benign','respond','unverified'],incident:['contain','remediate','validate','closure'],phishing:['verify','account','report'],vulnerability:['gateway','server']})){
 eq(m.cases[type].length,answers.length);
 for(const [i,item] of m.cases[type].entries()){
  eq(m[type](item.id).correct,null);
  eq(item.answer,answers[i]);
  for(const option of item.options){const r=m[type](item.id,option.id);eq(r.correct,option.id===answers[i]);assert.ok(r.selected.why.length>60);checks++;}
  assert.throws(()=>m[type](item.id,'unknown'));checks++;
 }
 assert.throws(()=>m[type]('unknown'));checks++;
}
for(const target of ['printer','website'])for(const cached of [false,true])for(const replies of [false,true]){
 const r=m.arp(target,cached,replies);
 eq(r.hop,target==='printer'?'10.20.10.50':'10.20.10.1');
 eq(r.ip,target==='printer'?'10.20.10.50':'192.0.2.80');
 eq(r.steps.some(s=>s.id==='request'),!cached);
 eq(r.steps.some(s=>s.id==='reply'),!cached&&replies);
 eq(r.steps.some(s=>s.id==='frame'),cached||replies);
 eq(r.steps.some(s=>s.id==='unanswered'),!cached&&!replies);
}
assert.throws(()=>m.arp('unknown'));
for(const file of ['reading.js','lab.js','study-showcase.js','study-exercises.js','knowledge-index.js','khanos.js','khanos-shell.js','khanos-palettes.js','khanos-backgrounds.js','khanos-content.js']){new vm.Script(read(file),{filename:file});checks++;}
const searchContext={window:{}};vm.createContext(searchContext);vm.runInContext(read('knowledge-index.js'),searchContext);
eq(searchContext.window.knowledgePages.length,data.articles.filter(a=>!a.archived).length);
eq((read('index.html').match(/class="fallback-note"/g)||[]).length,data.articles.filter(a=>!a.archived).length);
const osContext={window:{}};vm.runInNewContext(read('khanos-content.js'),osContext);
eq(osContext.window.KHAN_NOTES.length,data.articles.filter(a=>!a.archived).length);
const activeSlugs=new Set(osContext.window.KHAN_NOTES.map(a=>a.slug));
for(const a of osContext.window.KHAN_NOTES){
 const source=data.articles.find(s=>s.slug===a.slug);eq(a.body,source.body);assert.ok(!source.archived);
 assert.ok(a.related.every(s=>activeSlugs.has(s)));
 for(const [,slug] of a.body.matchAll(/href="#note-([a-z0-9-]+)"/g)){eq(activeSlugs.has(slug),true);}
 assert.deepEqual(JSON.parse(JSON.stringify(a.references)),source.sources.map(key=>({title:data.refs[key][0],url:data.refs[key][1]})));
 checks++;
}
for(const page of searchContext.window.knowledgePages){eq(page.url,'index.html#note-'+page.slug);eq(activeSlugs.has(page.slug),true);}
eq(fs.readdirSync(root).filter(file=>file==='knowledge.html'||/^kb-[a-z0-9-]+\.html$/.test(file)).length,0);
for(const file of fs.readdirSync(root).filter(file=>/\.(html|js)$/.test(file))){
 assert.ok(!/knowledge\.html|kb-[a-z0-9-]+\.html/.test(read(file)),`${file}: link to a retired knowledge page`);checks++;
}
assert.ok(!/<a\b[^>]*class="fallback-note"/.test(read('index.html')),'Fallback summaries must not link to removed pages');
assert.ok(read('khanos.js').includes('<button class="case-back" type="button" disabled>Read the complete lab</button>'));
assert.ok(read('khanos.js').includes('StudyExercises.mount('));
assert.ok(!read('khanos.js').includes('original-exercise'));
assert.ok(!read('khanos.js').includes('f/k'));
assert.ok(!/sig=|AccountKey=|BEGIN PRIVATE KEY|conversations-000|blob\.core\.windows\.net/i.test(read('knowledge-content.json')));
for(const a of data.articles.filter(a=>a.archived)){
 eq(activeSlugs.has(a.slug),false);eq(searchContext.window.knowledgePages.some(p=>p.slug===a.slug),false);
 assert.ok(!read('index.html').includes('<strong>'+a.title+'</strong>'));
}
console.log(`${checks} checks passed: ${data.articles.length} source articles, ${activeSlugs.size} active KhanOS notes, ${allExercises.size} exercises, calculation boundaries, desktop links, archived-note exclusion, and standalone-page removal.`);

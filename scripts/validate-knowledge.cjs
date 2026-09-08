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
 const html=read('kb-'+a.slug+'.html');
 assert.ok(html.includes(a.body),`${a.slug}: generated page is stale`);
 assert.ok(!html.includes('THE CONNECTION')&&!html.includes('undefined'),`${a.slug}: stale or missing text`);
 for(const [,s] of a.body.matchAll(/href="kb-([a-z0-9-]+)\.html"/g))assert.ok(slugs.has(s),`${a.slug}: broken link ${s}`);
 for(const [,id] of a.body.matchAll(/data-exercise="([a-z0-9-]+)"/g)){allExercises.add(id);assert.ok(read('study-exercises.js').includes(id+'(box)'),`No exercise implementation for ${id}`);}
 checks+=14;
}
eq(allExercises.size,8);
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
for(const file of ['knowledge.js','reading.js','lab.js','study-showcase.js','study-exercises.js','knowledge-index.js','khanos.js','khanos-shell.js','khanos-palettes.js','khanos-content.js']){new vm.Script(read(file),{filename:file});checks++;}
const searchContext={window:{}};vm.createContext(searchContext);vm.runInContext(read('knowledge-index.js'),searchContext);
eq(searchContext.window.knowledgePages.length,data.articles.filter(a=>!a.archived).length);
eq((read('knowledge.html').match(/class="knowledge-entry"/g)||[]).length,data.articles.filter(a=>!a.archived).length);
eq((read('index.html').match(/class="fallback-note"/g)||[]).length,data.articles.filter(a=>!a.archived).length);
const osContext={window:{}};vm.runInNewContext(read('khanos-content.js'),osContext);
eq(osContext.window.KHAN_NOTES.length,data.articles.filter(a=>!a.archived).length);
for(const a of osContext.window.KHAN_NOTES){const source=data.articles.find(s=>s.slug===a.slug);eq(a.body,source.body);assert.ok(!source.archived);assert.ok(a.related.every(s=>osContext.window.KHAN_NOTES.some(n=>n.slug===s)));}
assert.ok(read('khanos.js').includes('StudyExercises.mount('));
assert.ok(!read('khanos.js').includes('original-exercise'));
assert.ok(!read('khanos.js').includes('f/k'));
assert.ok(!/sig=|AccountKey=|BEGIN PRIVATE KEY|conversations-000|blob\.core\.windows\.net/i.test(read('knowledge-content.json')));
console.log(`${checks} checks passed: ${data.articles.length} articles, ${allExercises.size} exercises, calculation boundaries, policy cases, search index, and homepage cards.`);

for(const a of data.articles.filter(a=>a.archived)){assert.ok(!searchContext.window.knowledgePages.some(p=>p.slug===a.slug));assert.ok(!read('knowledge.html').includes('href="kb-'+a.slug+'.html"'));assert.ok(!read('index.html').includes('href="kb-'+a.slug+'.html"'));assert.ok(read('kb-'+a.slug+'.html').includes('noindex, nofollow'));}console.log('PASS: archived studies excluded from directory, homepage and search, with noindex metadata');

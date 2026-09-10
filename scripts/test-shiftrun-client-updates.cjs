const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');const root=path.resolve(__dirname,'..');const esbuild=require(path.join(process.env.SHIFTRUN_DEPENDENCIES,'esbuild'));const out=esbuild.buildSync({stdin:{contents:"export * from './app/game';export * from './app/progress';export * from './app/client-updates';",resolveDir:path.join(root,'shiftrun-src')},bundle:true,write:false,platform:'node',format:'cjs'});const mod={exports:{}};new Function('module','exports','require',out.outputFiles[0].text)(mod,mod.exports,require);const p=mod.exports;
const bestPositions=new Set();
for(const [i,s] of p.scenarios.entries()){
 let run=p.newRun(1234,'Guided','Investigator');run.cases=[{...run.cases[0],id:'1234-1-'+i,template:s.id,reads:[0,1,2],done:s.actions.filter(a=>!a.bad).map(a=>a.id)}];run.selected=0;
 const choices=p.clientUpdates(run.cases[0],run.cases[0].done);assert.equal(choices.length,3);assert.equal(new Set(choices.map(c=>c.text)).size,3);
 for(let choice=0;choice<3;choice++){const result=p.closeCase(run,s.truth,choice,'My unchanged notes');assert.equal(result.cases[0].communication,choice===0?15:0);assert.equal(result.cases[0].score,choice===0?100:85);assert.equal(result.cases[0].clientUpdate,choices[choice].text);assert(result.cases[0].clientUpdateWhy);}
 bestPositions.add(p.updateOrder(run.cases[0].id).indexOf(0));
}
assert.equal(bestPositions.size,3);
const original=JSON.parse(fs.readFileSync(path.join(root,'shiftrun/khanfarris-profile.json'),'utf8'));const raw=structuredClone(original.save);
// Exercise the original first-shift migration even as the published profile advances.
raw.run=structuredClone(raw.shiftHistory?.find(h=>h.wave===1)||raw.run);raw.shiftHistory=[];raw.records=raw.records.filter(r=>raw.run.cases.some(c=>c.id===r.id));
const caseItem=raw.run.cases.find(c=>c.template==='training');delete caseItem.clientUpdateVersion;caseItem.communication=0;caseItem.score=85;const record=raw.records.find(r=>r.template==='training');record.detail={...caseItem};record.score=85;raw.xp=385;raw.run.totalScore=385;const changed=p.normalizeSave(raw);assert.equal(changed.records.find(r=>r.template==='training').score,100);assert.equal(changed.xp,400);assert.deepEqual(p.normalizeSave(changed),changed);assert.equal(changed.records.find(r=>r.template==='training').note,record.note);assert(p.portfolioHTML(changed).includes('Recorded client update'));
const foreign=structuredClone(raw);foreign.run.seed=1234;foreign.run.cases.forEach(c=>c.id=c.id.replace('966459','1234'));foreign.records.forEach(r=>{r.id=r.id.replace('966459','1234');r.detail.id=r.id});assert.equal(p.normalizeSave(foreign).xp,385);
if(process.argv.includes('--update-profile')){original.save=p.normalizeSave(original.save);fs.writeFileSync(path.join(root,'shiftrun/khanfarris-profile.json'),JSON.stringify(original,null,2)+'\n');}
console.log('PASS: all 14 incident choices, scoring, varied positions, recorded feedback, owner-only migration, idempotence and exported updates');

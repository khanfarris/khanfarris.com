const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),deps=process.env.SHIFTFALL_DEPENDENCIES||path.join(root,'shiftfall-src/node_modules');
const esbuild=require(path.join(deps,'esbuild'));
const result=esbuild.buildSync({stdin:{contents:`export * from './app/progress';export * from './app/game';`,resolveDir:path.join(root,'shiftfall-src'),loader:'ts'},bundle:true,write:false,platform:'node',format:'cjs'});
const mod={exports:{}};new Function('module','exports','require',result.outputFiles[0].text)(mod,mod.exports,require);
const p=mod.exports;assert.equal(p.emptySave.xp,0);assert.equal(p.emptySave.records.length,0);assert.equal(p.emptySave.run,null);
let run=p.newRun(71957,'Guided','Investigator');for(let i=0;i<3;i++)run=p.readEvidence(run,i);for(const id of ['contain','clean','verify'])run=p.perform(run,id);run=p.closeCase(run,'Confirmed compromise',0,'Evidence-based analyst notes');
assert.equal(run.cases[0].score,100);assert.equal(run.cases[0].notes,'Evidence-based analyst notes');
const save={...p.emptySave,xp:100,run,records:[{id:run.cases[0].id,template:'bec',score:100,note:'Evidence-based analyst notes',detail:run.cases[0]}]};
assert.deepEqual(p.parseBackup(p.backupJSON(save)).records[0].detail.notes,'Evidence-based analyst notes');
const html=p.portfolioHTML(save);assert(html.includes('Evidence-based analyst notes'));assert(html.includes('How the score was calculated'));
assert(!fs.readFileSync(path.join(root,'shiftfall/game.js'),'utf8').includes('/api/progress'));
console.log('PASS: fresh start, perfect incident, analyst notes, backup restore, casebook export, no backend dependency');


const history=p.keepShift([],run);run.turn+=1;assert.notEqual(history[0].turn,run.turn);const archived={...save,shiftHistory:history};assert.deepEqual(p.parseBackup(p.backupJSON(archived)).shiftHistory,history);assert.equal(p.keepShift(history,run).length,1);console.log('PASS: shift snapshots are independent and survive JSON backup');

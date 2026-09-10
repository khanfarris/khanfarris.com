const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const esbuild=require(path.join(process.env.SHIFTRUN_DEPENDENCIES,'esbuild'));
const bundle=esbuild.buildSync({stdin:{contents:"export * from './app/game';export * from './app/progress';export * from './app/client-updates';",resolveDir:path.join(root,'shiftrun-src')},bundle:true,write:false,platform:'node',format:'cjs'});
const mod={exports:{}};new Function('module','exports','require',bundle.outputFiles[0].text)(mod,mod.exports,require);const g=mod.exports;
function fixture(scenario,mode='Guided'){
 const run=g.newRun(123456,mode,'Investigator');
 run.cases=[{...run.cases[0],template:scenario.id,id:`123456-1-${scenario.id}`}];run.selected=0;return run;
}
for(const scenario of g.scenarios){
 for(const mode of ['Guided','Practice','Veteran']){
  let run=fixture(scenario,mode);
  assert.equal(g.responseComplete(run.cases[0]),false);
  assert.equal(g.closeCase(run,scenario.truth,0,'Blocked'),run,'Cannot close before responding');
  for(let i=0;i<3;i++)run=g.readEvidence(run,i);
  const required=scenario.actions.filter(a=>!a.bad),bad=scenario.actions.find(a=>a.bad);
  if(bad){const failed=g.perform(run,bad.id);assert(!g.responseComplete(failed.cases[0]));assert.equal(g.closeCase(failed,scenario.truth,0,''),failed);}
  const ordered=required.find(a=>a.requires);
  if(ordered){const failed=g.perform(run,ordered.id);assert(!g.responseComplete(failed.cases[0]));assert.equal(g.closeCase(failed,scenario.truth,0,''),failed);}
  for(const [index,action] of required.entries()){
   run=g.perform(run,action.id);
   assert.equal(g.responseComplete(run.cases[0]),index===required.length-1,`${scenario.id}: unlock only after last required step`);
   if(index<required.length-1)assert.equal(g.closeCase(run,scenario.truth,0,''),run);
  }
  run=g.closeCase(run,scenario.truth,0,'Completed response notes');assert(run.cases[0].closed);assert.equal(run.cases[0].score,100);
 }
}
console.log('PASS: all 14 scenarios across all modes block early closure; incorrect/out-of-order attempts do not unlock; completing required steps unlocks and scores normally');
const server=http.createServer((req,res)=>{let file=path.join(root,decodeURIComponent(req.url.split('?')[0]));if(file.endsWith(path.sep))file+='index.html';if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}try{res.setHeader('Content-Type',file.endsWith('.json')?'application/json':file.endsWith('.js')?'application/javascript':file.endsWith('.css')?'text/css':'text/html');res.end(fs.readFileSync(file));}catch{res.writeHead(404).end();}});
(async()=>{
 const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base=process.env.SHIFTRUN_URL||`http://127.0.0.1:${server.address().port}/shiftrun/`;
 const browser=await chromium.launch({headless:true,channel:'msedge'});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:1100}}),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(base);
  const scenario=g.scenarios.find(s=>s.id==='bec'),run=fixture(scenario);
  // A pre-update save may already contain a handoff draft. Keep it, but conceal choices until ready.
  const note='Saved early analyst notes must survive the new gate.';
  const save={...structuredClone(g.emptySave),run,drafts:{[run.cases[0].id]:{note,disposition:scenario.truth,comms:'1'}}};
  await page.evaluate(s=>localStorage.setItem('khanfarris-shiftfall-v1',JSON.stringify(s)),save);await page.reload();
  const getSave=()=>page.evaluate(()=>localStorage.getItem('khanfarris-shiftfall-v1'));
  const showHandoff=()=>page.getByRole('tab',{name:/03 Handoff/}).click();
  async function assertLocked(count){
   await showHandoff();await page.getByRole('heading',{name:'Finish Respond to unlock Handoff',exact:true}).waitFor();
   assert.equal(await page.locator('.comms').count(),0);assert.equal(await page.locator('[role=tabpanel] [role=radio]').count(),0);
   assert((await page.locator('.handoff-gate-progress').textContent()).includes(`${count} of 3`));
   const text=await page.locator('[role=tabpanel]:not([inert])').textContent();for(const choice of g.clientUpdates(run.cases[0],scenario.actions.filter(a=>!a.bad).map(a=>a.id)))assert(!text.includes(choice.text),'No client answer text in locked markup');
   assert(await page.getByRole('button',{name:/Commit assessment/}).isDisabled());
  }
  await assertLocked(0);assert.equal(await page.locator('#case-note').inputValue(),note);
  const before=await getSave();await page.getByRole('button',{name:'Return to Respond',exact:true}).click();assert(await page.getByRole('button',{name:'Prepare handoff',exact:true}).isDisabled());await showHandoff();assert.equal(await getSave(),before);
  for(const width of [1440,390]){await page.setViewportSize({width,height:1100});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.locator('.handoff-gate').scrollIntoViewIfNeeded();await page.screenshot({path:path.join(require('node:os').tmpdir(),`shiftrun-handoff-${width}.png`)});}
  await page.setViewportSize({width:1440,height:1100});
  await page.getByRole('tab',{name:/01 Evidence/}).click();for(let i=0;i<3;i++)await page.locator('.evidence button').nth(i).click();
  await page.getByRole('tab',{name:/02 Respond/}).click();
  const bad=scenario.actions.find(a=>a.bad);await page.locator('.action').filter({has:page.getByText(bad.label,{exact:true})}).click();await assertLocked(0);
  const required=scenario.actions.filter(a=>!a.bad);
  for(const [index,action] of required.entries()){
   await page.getByRole('tab',{name:/02 Respond/}).click();await page.locator('.action').filter({has:page.getByText(action.label,{exact:true})}).click();
   if(index<required.length-1){await assertLocked(index+1);if(index===0){await page.reload();await assertLocked(1);}}
  }
  await page.getByRole('button',{name:'Prepare handoff',exact:true}).click();
  assert.equal(await page.locator('.handoff-gate').count(),0);assert.equal(await page.locator('.comms [role=radio]').count(),3);assert.equal(await page.locator('#case-note').inputValue(),note);
  await page.getByRole('button',{name:/Commit assessment/}).click();await page.getByRole('tab',{name:'Debrief',exact:true}).waitFor();assert.equal(await page.locator('.analyst-notes pre').textContent(),note);
  const finished=JSON.parse(await getSave());assert.equal(finished.records[0].score,92);assert.equal(finished.run.totalClosed,1);assert.equal(finished.xp,92);
  await page.reload();await showHandoff();assert.equal(await page.locator('.handoff-gate').count(),0);
  // Imported historical completions remain readable even if closed before finishing response steps.
  const legacy=structuredClone(finished);legacy.run.cases[0].done=[];legacy.records[0].detail.done=[];
  await page.evaluate(s=>localStorage.setItem('khanfarris-shiftfall-v1',JSON.stringify(s)),legacy);await page.reload();await showHandoff();assert.equal(await page.locator('.handoff-gate').count(),0);
  await page.getByRole('tab',{name:'Debrief',exact:true}).click();assert.equal(await page.locator('.analyst-notes pre').textContent(),note);
  const legacyBefore=await getSave();await page.getByRole('button',{name:'View khanfarris profile',exact:true}).click();await page.getByRole('button',{name:'Browse shifts, current shift 3',exact:true}).waitFor();
  await showHandoff();assert.equal(await page.locator('.handoff-gate').count(),0);await page.getByRole('tab',{name:'Debrief',exact:true}).click();assert.equal(await page.locator('.analyst-notes').count(),1);assert.equal(await getSave(),legacyBefore);
  assert.deepEqual(errors,[]);console.log('PASS: no handoff choices in locked DOM, partial/failed/reloaded responses, saved drafts, unlock and scoring, legacy completions, profile isolation, desktop/mobile layout');
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});

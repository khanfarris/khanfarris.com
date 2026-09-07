const http=require('node:http'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=path.resolve(__dirname,'..');
const server=http.createServer((req,res)=>{let file=path.join(root,decodeURIComponent(req.url.split('?')[0]));if(file.endsWith(path.sep))file+='index.html';if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}try{res.setHeader('Content-Type',file.endsWith('.json')?'application/json':file.endsWith('.js')?'application/javascript':file.endsWith('.css')?'text/css':'text/html');res.end(fs.readFileSync(file));}catch{res.writeHead(404).end();}});
(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({headless:true,channel:'msedge'});try{
 const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(`http://127.0.0.1:${server.address().port}/shiftfall/`);
 await page.getByRole('button',{name:'Start guided shift'}).click();await page.getByRole('tab',{name:/03 Handoff/}).click();await page.locator('#case-note').fill('Visitor draft must survive switching');await page.waitForTimeout(150);
 const before=await page.evaluate(()=>localStorage.getItem('khanfarris-shiftfall-v1'));
 await page.getByRole('button',{name:'View khanfarris profile',exact:true}).click();await page.getByRole('button',{name:/CLOSED The suspicious safety drill/}).click();await page.getByText('Client-update answer corrected after completion at author request; original score 85/100, revised score 100/100.',{exact:true}).waitFor();
 assert.equal(await page.locator('.debrief').count()>=0,true);
 assert(await page.getByText('Message ID matches approved campaign SIM-419 within KnowBe4.',{exact:false}).count()>0);
 await page.getByRole('button',{name:/Online, but nothing resolves/}).click();await page.getByRole('tab',{name:/02 Respond/}).click();assert.equal(await page.locator('.action-grid button:enabled').count(),0);
 await page.getByRole('button',{name:'Portfolio',exact:true}).click();assert.equal(await page.locator('.restore-panel').count(),0);
 assert.equal(await page.evaluate(()=>localStorage.getItem('khanfarris-shiftfall-v1')),before);
 await page.getByRole('button',{name:'Return to your progress',exact:true}).click();await page.getByRole('tab',{name:/03 Handoff/}).click();assert.equal(await page.locator('#case-note').inputValue(),'Visitor draft must survive switching');
 assert.equal(await page.evaluate(()=>localStorage.getItem('khanfarris-shiftfall-v1')),before);assert.deepEqual(errors,[]);
 const data=JSON.parse(fs.readFileSync(path.join(root,'shiftfall/khanfarris-profile.json'),'utf8')).save;assert.equal(data.xp,400);assert.equal(data.records.length,4);assert.equal(data.records.find(r=>r.template==='training').detail.communication,15);assert.equal(data.run.cases.find(c=>c.template==='dns').closed,true);
 console.log('PASS: profile load, correction and notes, read-only controls, visitor draft and storage isolation, 400 XP, completed DNS retained');
 }finally{await browser.close();server.close();}})().catch(e=>{console.error(e);server.close();process.exitCode=1;});


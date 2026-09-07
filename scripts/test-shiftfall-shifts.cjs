const http=require('node:http'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=path.resolve(__dirname,'..');
const server=http.createServer((req,res)=>{let file=path.join(root,decodeURIComponent(req.url.split('?')[0]));if(file.endsWith(path.sep))file+='index.html';if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}try{res.setHeader('Content-Type',file.endsWith('.json')?'application/json':file.endsWith('.js')?'application/javascript':file.endsWith('.css')?'text/css':'text/html');res.end(fs.readFileSync(file));}catch{res.writeHead(404).end();}});
(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({headless:true,channel:'msedge'});try{
 const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(`http://127.0.0.1:${server.address().port}/shiftfall/`);

 const fixture=JSON.parse(fs.readFileSync(path.join(root,'shiftfall/khanfarris-profile.json'),'utf8')).save;
 await page.evaluate(data=>localStorage.setItem('khanfarris-shiftfall-v1',JSON.stringify(data)),fixture);await page.reload();
 const before=await page.evaluate(()=>localStorage.getItem('khanfarris-shiftfall-v1'));
 await page.getByRole('button',{name:/Browse shifts, current shift/}).hover();await page.getByRole('button',{name:'Shift 2 Locked preview',exact:true}).click();
 const preview=await page.locator('.queue button b').allTextContents();assert.equal(preview.length,4);
 assert.equal(await page.getByRole('tab').count(),3);assert.equal(await page.locator('.evidence button:enabled').count(),0);assert.equal(await page.locator('.evidence pre').count(),0);
 await page.getByRole('tab',{name:/02 Respond/}).click();await page.getByText('Response actions locked',{exact:true}).waitFor();assert.equal(await page.locator('.action-grid button').count(),0);assert.equal(await page.getByRole('button',{name:'Ask your mentor',exact:true}).count(),0);
 await page.getByRole('tab',{name:/03 Handoff/}).click();await page.getByText('Handoff locked',{exact:true}).waitFor();assert.equal(await page.locator('textarea').count(),0);
 await page.locator('.queue .ticket').nth(1).click();await page.getByRole('heading',{name:preview[1],exact:true}).waitFor();await page.getByRole('tab',{name:/01 Evidence/}).waitFor();assert.equal(await page.locator('.evidence pre').count(),0);
 await page.getByRole('tab',{name:/02 Respond/}).click();await page.getByText('Response actions locked',{exact:true}).scrollIntoViewIfNeeded();await page.screenshot({path:require('node:os').tmpdir()+'/shift-locked-preview.png'});
 assert.equal(await page.evaluate(()=>localStorage.getItem('khanfarris-shiftfall-v1')),before);
 await page.getByRole('button',{name:/Browse shifts, current shift/}).hover();await page.getByRole('button',{name:'Shift 1 Completed',exact:true}).click();
 await page.getByRole('button',{name:/Continue without upgrade/}).click();
 await page.getByRole('button',{name:'Browse shifts, current shift 2',exact:true}).waitFor();
 const current=JSON.parse(await page.evaluate(()=>localStorage.getItem('khanfarris-shiftfall-v1')));assert.equal(current.run.wave,2);assert.equal(current.shiftHistory[0].wave,1);
 const queue=await page.locator('.queue button').allTextContents();
 for(const title of preview)assert(queue.some(text=>text.includes(title)),title);
 const after=await page.evaluate(()=>localStorage.getItem('khanfarris-shiftfall-v1'));
 await page.getByRole('button',{name:/Browse shifts, current shift/}).hover();await page.getByRole('button',{name:'Shift 1 Completed',exact:true}).click();
 await page.getByRole('button',{name:/CLOSED The suspicious safety drill/}).click();
 assert(await page.getByText('Message ID matches approved campaign SIM-419 within KnowBe4.',{exact:false}).count()>0);
 await page.getByRole('tab',{name:/02 Respond/}).click();assert.equal(await page.locator('.action-grid button:enabled').count(),0);
 assert.equal(await page.evaluate(()=>localStorage.getItem('khanfarris-shiftfall-v1')),after);
 await page.reload();await page.getByRole('button',{name:/Browse shifts, current shift/}).hover();await page.getByRole('button',{name:'Shift 1 Completed',exact:true}).click();assert.equal(await page.getByRole('tab').count(),4);
 await page.route('**/khanfarris-profile.json',route=>route.fulfill({contentType:'application/json',body:JSON.stringify({save:current})}));await page.reload();
 await page.getByRole('button',{name:'View khanfarris profile',exact:true}).click();
 await page.getByRole('button',{name:'Browse shifts, current shift 1',exact:true}).waitFor();
 await page.getByRole('button',{name:/Browse shifts, current shift/}).hover();await page.getByRole('button',{name:'Shift 2 Active',exact:true}).click();await page.getByRole('tab',{name:/02 Respond/}).click();assert.equal(await page.locator('.action-grid button:enabled').count(),0);
 await page.getByRole('button',{name:'Return to your progress',exact:true}).click();
 const legacy={...current};delete legacy.shiftHistory;
 await page.evaluate(data=>localStorage.setItem('khanfarris-shiftfall-v1',JSON.stringify(data)),legacy);await page.reload();await page.getByRole('button',{name:/Browse shifts, current shift/}).hover();await page.getByRole('button',{name:'Shift 1 Completed',exact:true}).click();
 await page.getByText(/This older backup contains case records/).waitFor();assert.equal(await page.locator('.shift-preview>details').count(),4);
 await page.setViewportSize({width:390,height:844});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 assert.deepEqual(errors,[]);console.log('PASS: locked preview, matching unlocked queue, history persistence, read-only browsing, legacy records, mobile width');
 }finally{await browser.close();server.close();}})().catch(e=>{console.error(e);server.close();process.exitCode=1;});




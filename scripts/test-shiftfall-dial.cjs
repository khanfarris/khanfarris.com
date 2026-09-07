const http=require('node:http'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=path.resolve(__dirname,'..');
const server=http.createServer((req,res)=>{let file=path.join(root,decodeURIComponent(req.url.split('?')[0]));if(file.endsWith(path.sep))file+='index.html';if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}try{res.setHeader('Content-Type',file.endsWith('.json')?'application/json':file.endsWith('.js')?'application/javascript':file.endsWith('.css')?'text/css':'text/html');res.end(fs.readFileSync(file));}catch{res.writeHead(404).end();}});
(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({headless:true,channel:'msedge'});try{
 const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(`http://127.0.0.1:${server.address().port}/shiftfall/`);

 await page.setViewportSize({width:1440,height:1000});await page.getByRole('button',{name:'Start guided shift'}).click();
 const trigger=page.getByRole('button',{name:'Browse shifts, current shift 1',exact:true});await trigger.hover();await page.getByRole('navigation',{name:'Shift navigation'}).waitFor();
 await page.waitForTimeout(350);await page.screenshot({path:require('node:os').tmpdir()+'/shift-dial-desktop.png'});
 await page.mouse.move(1400,0);await page.getByRole('navigation',{name:'Shift navigation'}).waitFor({state:'hidden'});
 await trigger.focus();await page.keyboard.press('Enter');await page.keyboard.press('ArrowRight');await page.waitForTimeout(50);await page.keyboard.press('ArrowRight');await page.waitForTimeout(50);await page.keyboard.press('Enter');
 await page.getByRole('button',{name:'Browse shifts, current shift 2',exact:true}).waitFor();assert.equal(await page.getByRole('tab').count(),3);
 await page.getByRole('button',{name:/Browse shifts/}).focus();await page.keyboard.press('Enter');await page.keyboard.press('Escape');assert.equal(await page.getByRole('navigation',{name:'Shift navigation'}).count(),0);
 const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});const touch=await context.newPage();await touch.goto(page.url());await touch.getByRole('button',{name:'Start guided shift'}).tap();
 const tapTrigger=touch.getByRole('button',{name:/Browse shifts/});await tapTrigger.tap();await touch.getByRole('navigation',{name:'Shift navigation'}).waitFor();
 await touch.waitForTimeout(350);await touch.screenshot({path:require('node:os').tmpdir()+'/shift-dial-mobile.png'});
 const box=await touch.getByRole('navigation',{name:'Shift navigation'}).boundingBox();assert(box.x>=0&&box.x+box.width<=390);await touch.getByRole('button',{name:'Shift 3 Locked preview',exact:true}).tap();await touch.getByRole('button',{name:'Browse shifts, current shift 3',exact:true}).waitFor();
 await tapTrigger.tap();await touch.getByRole('navigation',{name:'Shift navigation'}).waitFor();await tapTrigger.tap();await touch.getByRole('navigation',{name:'Shift navigation'}).waitFor({state:'hidden'});
 assert(await touch.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));assert.deepEqual(errors,[]);await context.close();console.log('PASS: hover, dismissal, keyboard selection, Escape, touch selection and toggle, mobile bounds');
 }finally{await browser.close();server.close();}})().catch(e=>{console.error(e);server.close();process.exitCode=1;});


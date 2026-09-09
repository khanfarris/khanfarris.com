const http=require('node:http'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=path.resolve(__dirname,'..'),key='khanfarris-shiftfall-v1';
const server=http.createServer((req,res)=>{
  let file=path.join(root,decodeURIComponent(req.url.split('?')[0]));if(file.endsWith(path.sep))file+='index.html';
  if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}
  try{res.setHeader('Content-Type',file.endsWith('.json')?'application/json':file.endsWith('.js')?'application/javascript':file.endsWith('.css')?'text/css':'text/html');res.end(fs.readFileSync(file))}catch{res.writeHead(404).end()}
});
(async()=>{
  await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({channel:'msedge',headless:true});
  try{
    const page=await browser.newPage({viewport:{width:1600,height:1100}}),errors=[];
    const base=`http://127.0.0.1:${server.address().port}/shiftrun/`;
    page.on('pageerror',e=>errors.push(e.message));await page.goto(base);
    const shot=async name=>{if(process.env.SHIFTRUN_SCREENSHOTS)await page.screenshot({path:path.join(process.env.SHIFTRUN_SCREENSHOTS,name+'.png'),fullPage:true})};
    assert.equal(await page.locator('html').getAttribute('data-theme'),'crimson');
    await page.getByRole('button',{name:'Start guided shift'}).waitFor();await shot('release-start');
    await page.getByRole('button',{name:'Start guided shift'}).click();
    const readSave=()=>page.evaluate(k=>JSON.parse(localStorage.getItem(k)),key);
    const initial=await readSave();
    await page.locator('.evidence button').first().click();
    assert.equal((await readSave()).run.turn,initial.run.turn);
    await page.locator('.evidence button').nth(1).click();const after=await readSave();
    assert.equal(after.run.turn,initial.run.turn+1);
    const rings=await page.locator('.incident-node').evaluateAll(nodes=>nodes.map(n=>({pressure:Number(n.getAttribute('data-pressure')),offset:Number(n.querySelector('.ring-value').getAttribute('stroke-dashoffset'))})));
    rings.forEach((r,i)=>{assert.equal(r.pressure,after.run.cases[i].pressure);assert.equal(r.offset,100-after.run.cases[i].pressure)});
    const before=await page.evaluate(k=>localStorage.getItem(k),key);
    const rail=await page.locator('.constellation-queue').boundingBox(),workspace=await page.locator('.workspace').boundingBox();
    assert(rail.x+rail.width<workspace.x);assert(Math.abs(rail.y-workspace.y)<2);
    const positions=await page.locator('.node-orbit').evaluateAll(nodes=>nodes.map(n=>n.getBoundingClientRect().top));assert(positions[1]-positions[0]>=190);
    assert.notEqual(await page.locator('.constellation-thread>path').first().evaluate(n=>getComputedStyle(n).strokeDasharray),'none');
    await shot('release-active');
    await page.getByRole('tab',{name:/02 Respond/}).click();await shot('release-respond');
    await page.getByRole('button',{name:'View khanfarris profile',exact:true}).click();await page.locator('.incident-node.is-closed').first().waitFor();
    assert.equal(await page.locator('.incident-node.is-closed[data-pressure]').count(),0);
    await page.getByRole('button',{name:/CLOSED The suspicious safety drill/}).click();await shot('release-profile');
    for(const name of ['Glacier','Orchid','Verdant','Ember','Crimson']){
      await page.getByRole('button',{name:'Choose color palette'}).click();await page.locator('.theme-options button').filter({hasText:name}).click();
      assert.equal(await page.locator('html').getAttribute('data-theme'),name.toLowerCase());assert(new URL(page.url()).hash==='#khanfarris');
      assert.equal(await page.evaluate(k=>localStorage.getItem(k),key),before);
    }
    await page.getByRole('button',{name:'Pause motion',exact:true}).click();
    assert.equal(await page.locator('.travel-line').evaluate(e=>getComputedStyle(e).animationName),'none');
    await page.reload();await page.getByRole('button',{name:'Return to your progress',exact:true}).waitFor();
    assert.equal(await page.locator('html').getAttribute('data-motion'),'false');
    await page.getByRole('button',{name:'Return to your progress',exact:true}).click();assert.equal(new URL(page.url()).searchParams.get('theme'),'crimson');
    assert.equal(await page.evaluate(k=>localStorage.getItem(k),key),before);
    for(const width of [1366,1024,768,390]){await page.setViewportSize({width,height:900});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Overflow at '+width)}
    await page.getByRole('button',{name:'Choose color palette'}).click();const picker=await page.locator('.theme-options').boundingBox();assert(picker.x>=0&&picker.x+picker.width<=390);await page.keyboard.press('Escape');assert.equal(await page.locator('.theme-options').count(),0);await shot('release-mobile');
    await page.getByRole('button',{name:'Portfolio',exact:true}).click();await shot('release-portfolio');
    assert.equal(await page.getByRole('button',{name:'Restart demo',exact:true}).count(),0);
    assert.equal(await page.evaluate(()=>localStorage.getItem('shiftrun-design-sandbox-v1')),null);
    const reduced=await browser.newPage({reducedMotion:'reduce'});await reduced.goto(base);await reduced.getByRole('button',{name:'Start guided shift'}).waitFor();assert.equal(await reduced.locator('html').getAttribute('data-motion'),'false');
    assert.deepEqual(errors,[]);console.log('PASS: native pressure rings, dotted spaced rail, five palettes, profile hash, saved progress isolation, appearance persistence, pause/reduced motion, responsive layout, no demo state');
  }finally{await browser.close();server.close()}
})().catch(e=>{console.error(e);server.close();process.exitCode=1});

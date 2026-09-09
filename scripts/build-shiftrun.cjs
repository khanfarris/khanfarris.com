const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const deps=process.env.SHIFTRUN_DEPENDENCIES||path.join(root,'shiftrun-src','node_modules');
const esbuild=require(path.join(deps,'esbuild'));
async function build(){
 await esbuild.build({entryPoints:[path.join(root,'shiftrun-src/entry.tsx')],bundle:true,minify:true,format:'esm',jsx:'automatic',outfile:path.join(root,'shiftrun/game.js'),nodePaths:[deps],alias:{'@':path.join(root,'shiftrun-src')}});
 const postcss=require(path.join(deps,'postcss'));
 const tailwind=require(path.join(deps,'@tailwindcss/postcss/dist/index.js'));
 const css=fs.readFileSync(path.join(root,'shiftrun-src/app/globals.css'),'utf8').replace("@import 'tailwindcss';",`@import '${path.join(deps,'tailwindcss/index.css').replaceAll('\\','/')}';`).replace("@import 'tw-animate-css';",`@import '${path.join(deps,'tw-animate-css/dist/tw-animate.css').replaceAll('\\','/')}';`).replace("@import 'shadcn/tailwind.css';",'');
 const out=await postcss([tailwind({base:path.join(root,'shiftrun-src')})]).process(css,{from:path.join(root,'shiftrun-src/app/globals.css')});
 const colors={'#091214':'var(--d-bg)','#111f22':'var(--d-panel)','#b9f478':'var(--d-accent)','#e7eeec':'var(--d-ink)','#101a0c':'var(--d-bg)','#b1c2c2':'var(--d-muted)','#a2b8b8':'var(--d-muted)','#a0b5b5':'var(--d-muted)','#304448':'var(--d-edge)','#385053':'var(--d-edge)','#1b3033':'var(--d-panel)','#2b474b':'var(--d-hover)','#b8f575':'var(--d-accent)','#bcf57d':'var(--d-accent)','#bdf780':'var(--d-accent)','#c6f38e':'var(--d-accent)','#c7eaa4':'var(--d-accent)','#c5ef97':'var(--d-accent)','#c7dcdd':'var(--d-ink)','#304b4e':'var(--d-edge)','#102024':'var(--d-panel)','#cdfc99':'var(--d-accent)','#243b3e':'var(--d-hover)'};
 const base=out.css.replace(/#[a-fA-F0-9]{3,8}\b/g,c=>colors[c.toLowerCase()]||c);
 fs.writeFileSync(path.join(root,'shiftrun/game.css'),base+'\n'+fs.readFileSync(path.join(root,'shiftrun-src/presentation.css'),'utf8'));
 console.log('Built Shiftrun static game.');
}build().catch(e=>{console.error(e);process.exit(1)});

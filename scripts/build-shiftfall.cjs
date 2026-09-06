const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const deps=process.env.SHIFTFALL_DEPENDENCIES||path.join(root,'shiftfall-src','node_modules');
const esbuild=require(path.join(deps,'esbuild'));
async function build(){
 await esbuild.build({entryPoints:[path.join(root,'shiftfall-src/entry.tsx')],bundle:true,minify:true,format:'esm',jsx:'automatic',outfile:path.join(root,'shiftfall/game.js'),nodePaths:[deps],alias:{'@':path.join(root,'shiftfall-src')}});
 const postcss=require(path.join(deps,'postcss'));
 const tailwind=require(path.join(deps,'@tailwindcss/postcss/dist/index.js'));
 const css=fs.readFileSync(path.join(root,'shiftfall-src/app/globals.css'),'utf8').replace("@import 'tailwindcss';",`@import '${path.join(deps,'tailwindcss/index.css').replaceAll('\\','/')}';`).replace("@import 'tw-animate-css';",`@import '${path.join(deps,'tw-animate-css/dist/tw-animate.css').replaceAll('\\','/')}';`).replace("@import 'shadcn/tailwind.css';",'');
 const out=await postcss([tailwind({base:path.join(root,'shiftfall-src')})]).process(css,{from:path.join(root,'shiftfall-src/app/globals.css')});
 fs.writeFileSync(path.join(root,'shiftfall/game.css'),out.css);
 console.log('Built Shiftfall static game.');
}build().catch(e=>{console.error(e);process.exit(1)});

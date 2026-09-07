// Edit knowledge-content.json, then run: node scripts/build-knowledge.cjs
(function build(){
const fs=require('node:fs'),path=require('node:path'),root=path.resolve(__dirname,'..');
const {refs,articles:allArticles}=JSON.parse(fs.readFileSync(path.join(root,'knowledge-content.json'),'utf8'));
const slugs=new Set();
for(const a of allArticles){
  if(!/^[a-z0-9-]+$/.test(a.slug)||slugs.has(a.slug))throw Error('Invalid or duplicate article slug: '+a.slug);
  slugs.add(a.slug);
  for(const key of ['title','kind','category','basis','principle','body','question','answer'])if(typeof a[key]!=='string'||!a[key].trim())throw Error('Missing '+key+' in '+a.slug);
  if(!Array.isArray(a.sources)||!a.sources.length||a.sources.some(key=>!refs[key]))throw Error('Invalid sources in '+a.slug);
  if(!Array.isArray(a.related))throw Error('Missing related articles in '+a.slug);
}
for(const a of allArticles)for(const related of a.related)if(!slugs.has(related))throw Error('Missing related article: '+related);
const articles=allArticles.filter(a=>!a.archived);
const esc=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const url=slug=>'kb-'+slug+'.html';
const find=slug=>{const a=allArticles.find(a=>a.slug===slug);if(!a)throw Error(slug);return a;};
const write=(name,data)=>fs.writeFileSync(path.join(root,name),data+'\n');
const head=(title,description)=>`<!doctype html>
<html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)} — khanfarris</title>
<meta name="description" content="${esc(description)}"><meta name="theme-color" content="#080c09">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&amp;display=swap" rel="stylesheet">
<link rel="stylesheet" href="lab.css"><link rel="stylesheet" href="reading.css"><link rel="stylesheet" href="knowledge.css">
<script src="knowledge-index.js?v=concepts-18" defer></script><script src="reading.js" defer></script><script src="lab.js?v=2931b52" defer></script><script src="knowledge.js" defer></script><script src="study-exercises.js" defer></script>
</head>`;
const footer=`<footer class="site-footer wrap"><span>© <span id="year">2026</span> khanfarris</span><a href="knowledge.html">Knowledge base ↗</a><a href="#main">Back to top ↑</a></footer></body></html>`;
const cards=items=>items.map(a=>`<a class="study-card" href="${url(a.slug)}"><span class="eyebrow">${esc(a.category)}</span><h3>${esc(a.title)} <span aria-hidden="true">↗</span></h3><p>${esc(a.principle)}</p><span class="study-basis">${esc(a.basis)}</span></a>`).join('\n');
allArticles.forEach((a)=>{
const i=Math.max(0,articles.indexOf(a));
const prev=articles[(i+articles.length-1)%articles.length],next=articles[(i+1)%articles.length];
write(url(a.slug),head(a.title,a.principle).replace('</head>',a.archived?'<meta name="robots" content="noindex, nofollow"></head>':'</head>')+`
<body class="lab-page kb-article"><main class="container">
<p class="brand"><a href="knowledge.html">knowledge base</a></p>
<p class="eyebrow">${a.archived?'ARCHIVED / ':''}NOTE ${String(i+1).padStart(2,'0')} / ${esc(a.category)}</p>
<h1 class="post-title">${esc(a.title)}<span class="accent">_</span></h1>
<p class="post-meta"><span class="note-kind">${esc(a.kind||'Concept')}</span> <span class="study-basis">${esc(a.basis)}</span></p>
<section class="principle-box" aria-label="In plain English"><span class="eyebrow">IN PLAIN ENGLISH</span><p>${esc(a.principle)}</p></section>
<article class="study-body" aria-label="${esc(a.title)}">${a.body}</article>
<section class="retrieval-check" aria-labelledby="recall-title"><span class="eyebrow">PUT IT INTO WORDS</span><h2 id="recall-title">Check your understanding</h2><p>${esc(a.question)}</p><details><summary>Show an example answer</summary><p>${esc(a.answer)}</p></details></section>
<section class="study-sources" aria-labelledby="sources-title"><h2 id="sources-title">Technical references</h2><ul>${a.sources.map(k=>`<li><a href="${esc(refs[k][1])}">${esc(refs[k][0])} ↗</a></li>`).join('')}</ul></section>
<aside class="study-related" aria-labelledby="related-title"><h2 id="related-title">Related notes</h2><div class="study-grid">${cards(a.related.map(find).filter(a=>!a.archived))}</div></aside>
<nav class="study-pagination" aria-label="Study notes"><a href="${url(prev.slug)}">← ${esc(prev.title)}</a><a href="${url(next.slug)}">${esc(next.title)} →</a></nav>
</main>${footer}`);
});
const categories=[...new Set(articles.map(a=>a.category))];
write('knowledge.html',head('Knowledge base',articles.length+' beginner-friendly concept notes and interactive exercises for security operations.')+`
<body class="lab-page kb-directory"><main class="wrap">
<p class="brand"><a href="index.html#knowledge">personal lab</a></p>
<header class="knowledge-intro"><div><p class="eyebrow">02 / KNOWLEDGE BASE</p><h1>Learn it.<br>Work through it<span class="accent">_</span></h1><p class="knowledge-deck">Networking and security, explained from the beginning. Concept notes and examples you can work through.</p></div><div class="knowledge-tally"><strong>${articles.length}</strong><span>STUDY NOTES</span><p>Understand the basics.<br>See them at work.<br>Try it yourself.</p></div></header>
<details class="basis-guide"><summary>About these study notes</summary><p><strong>Concept notes</strong> explain how a topic works. Study labels distinguish reading, practiced calculations, and lab application. Exercises use fictional examples; a tool guide does not imply production experience.</p></details>
<section class="study-routes" aria-label="Study starting points">
<a href="kb-subnetting.html"><span class="eyebrow">01 / NETWORKING</span><h2>How devices communicate ↗</h2><p>Subnetting · VLANs · DNS · DHCP</p></a>
<a href="kb-mdr.html"><span class="eyebrow">02 / SECURITY OPERATIONS</span><h2>How threats get investigated ↗</h2><p>EDR, MDR, and XDR · SIEM · Incident response</p></a>
<a href="kb-identity.html"><span class="eyebrow">03 / IDENTITY & ACCESS</span><h2>How access is controlled ↗</h2><p>Risky sign-ins · Active Directory · ZTNA / SASE</p></a>
</section>
<section class="review-console" aria-labelledby="review-heading" hidden><div><span class="eyebrow">RETRIEVAL PRACTICE / NO TIMER</span><h2 id="review-heading">Explain it in your own words</h2><p id="review-question">Try a question, then compare your reasoning with the example answer.</p><details id="review-answer" hidden><summary>Show an example answer</summary><p></p><a id="review-link">Read the full note ↗</a></details></div><button id="next-review" type="button">Start a quick review →</button></section>
<section aria-labelledby="notes-heading"><div class="section-heading"><h2 id="notes-heading">All study notes<span class="accent">_</span></h2><span class="section-aside">The reasoning behind the answer.</span></div>
<div class="knowledge-controls" hidden><label for="knowledge-search">Find a topic</label><input id="knowledge-search" type="search" placeholder="Try subnetting, DNS, VLANs, or SIEM…" autocomplete="off"><div class="knowledge-filters" role="group" aria-label="Filter by subject"><button type="button" data-category="All" aria-pressed="true">All</button>${categories.map(c=>`<button type="button" data-category="${esc(c)}" aria-pressed="false">${esc(c)}</button>`).join('')}</div><p id="knowledge-count" role="status"></p></div>
<div class="knowledge-list">${articles.map((a,i)=>`<a class="knowledge-entry" data-slug="${a.slug}" data-category="${esc(a.category)}" href="${url(a.slug)}"><span class="note-number">${String(i+1).padStart(2,'0')}</span><div><span class="eyebrow">${esc(a.category)}</span><h3>${esc(a.title)}</h3><p>${esc(a.principle)}</p></div><span class="study-basis">${esc(a.basis)}</span><span class="entry-arrow" aria-hidden="true">↗</span></a>`).join('\n')}</div><p id="knowledge-empty" hidden>No matching notes. Try another term or reset the subject filter.</p></section>
</main>${footer}`);
write('knowledge-index.js','// Generated by scripts/build-knowledge.cjs.\nwindow.knowledgePages = '+JSON.stringify(articles.map(a=>({name:a.title,url:url(a.slug),type:a.kind||'Concept',keywords:a.category+' '+a.basis+' '+a.principle+' '+(a.keywords||''),slug:a.slug,category:a.category,question:a.question,answer:a.answer})),null,2)+';');

// The homepage is generated from the same article source as the directory.
const featured=['subnetting','sentinelone','timus'];
const ordered=[...featured.map(slug=>articles.find(a=>a.slug===slug)).filter(Boolean),...articles.filter(a=>!featured.includes(a.slug))];
const diagrams={
'Networking': '<path class="diagram-wire" d="M24 70H100M100 70V30H208M100 70V110H208M208 30H286M208 110H286"/><path class="diagram-trace" d="M24 70H100V30H286"/><circle cx="24" cy="70" r="8"/><rect x="85" y="55" width="30" height="30" rx="3"/><circle cx="208" cy="30" r="6"/><circle cx="208" cy="110" r="6"/><path d="M280 24l12 6-12 6M280 104l12 6-12 6"/><text x="16" y="105">HOST</text><text x="130" y="77">/ NETWORK</text>',
'Security operations': '<circle class="diagram-orbit" cx="160" cy="70" r="54"/><circle cx="160" cy="70" r="34"/><path class="diagram-wire" d="M26 70H126M194 70H294M160 16V36M160 104V124"/><path class="diagram-trace" d="M26 70H126L160 36L194 70H294"/><path d="M160 48l22 22-22 22-22-22Z"/><circle class="diagram-pulse" cx="160" cy="70" r="5"/><text x="16" y="105">OBSERVE</text><text x="245" y="105">VERIFY</text>',
'Identity & access': '<path class="diagram-wire" d="M24 70H296"/><path class="diagram-trace" d="M24 70H296"/><rect x="50" y="35" width="48" height="70" rx="4"/><rect x="136" y="35" width="48" height="70" rx="4"/><rect x="222" y="35" width="48" height="70" rx="4"/><path d="M65 69l6 6 13-15M151 69l6 6 13-15M237 69l6 6 13-15"/><text x="52" y="128">PATH</text><text x="132" y="128">IDENTITY</text><text x="226" y="128">POLICY</text>',
'Cloud & telemetry': '<path class="diagram-wire" d="M35 25H105V70H178V110H285"/><path class="diagram-trace" d="M35 25H105V70H178V110H285"/><rect x="20" y="13" width="30" height="24"/><rect x="90" y="58" width="30" height="24"/><rect x="163" y="98" width="30" height="24"/><circle class="diagram-pulse" cx="285" cy="110" r="8"/><text x="67" y="25">COLLECT</text><text x="141" y="60">CORRELATE</text><text x="232" y="88">INTERPRET</text>'
};
const archive=`<div class="study-archive" data-archive>
<div class="archive-toolbar"><span class="archive-label"><span class="status-dot"></span> FIELD INDEX <span class="archive-divider">/</span> ${ordered.length} NOTES</span><div class="archive-controls" hidden><button type="button" class="archive-motion" aria-pressed="true">Motion: on</button><button type="button" data-archive-prev aria-label="Previous study notes">←</button><button type="button" data-archive-next aria-label="Next study notes">→</button></div></div>
<div class="archive-viewport"><div class="archive-track" tabindex="0" role="region" aria-label="Scrollable study archive" aria-describedby="archive-hint">
${ordered.map((a,i)=>`<a class="archive-card" href="${url(a.slug)}" data-archive-card aria-label="${esc(a.title)} — ${esc(a.basis)}"><div class="archive-card-inner"><div class="archive-card-top"><span>NOTE / ${String(i+1).padStart(3,'0')}</span><span class="archive-card-arrow" aria-hidden="true">↗</span></div><div class="archive-visual" aria-hidden="true"><div class="archive-scan"></div><svg viewBox="0 0 320 140" fill="none">${diagrams[a.category]||diagrams.Networking}</svg><span class="archive-visual-caption">${esc(a.category)}</span></div><div class="archive-card-copy"><h3>${esc(a.title)}</h3><p>${esc(a.principle)}</p></div><div class="archive-card-foot"><span>${esc(a.basis)}</span><span>READ NOTE ↗</span></div></div></a>`).join('\n')}
</div></div>
<div class="archive-navigation" hidden><div class="archive-position"><span id="archive-range" aria-live="polite">01 — ${String(Math.min(3,ordered.length)).padStart(2,'0')}</span><span>/ ${String(ordered.length).padStart(2,'0')}</span></div><div class="archive-scrubber"><label class="sr-only" for="archive-scrub">Scroll through study notes</label><input id="archive-scrub" type="range" min="0" max="1000" value="0"><div class="archive-ticks" aria-hidden="true">${ordered.map(()=>'<i></i>').join('')}</div></div><p id="archive-hint">Drag / swipe to explore <span aria-hidden="true">↔</span></p></div>
</div>
<a class="primary-link study-directory-link" href="knowledge.html">Explore all ${articles.length} study notes <span>↗</span></a>`;
const homePath=path.join(root,'index.html');
let homepage=fs.readFileSync(homePath,'utf8');
if(!homepage.includes('<!-- STUDY ARCHIVE START -->')||!homepage.includes('<!-- STUDY ARCHIVE END -->'))throw Error('Homepage archive markers are missing');
homepage=homepage.replace(/<!-- STUDY ARCHIVE START -->[\s\S]*?<!-- STUDY ARCHIVE END -->/,'<!-- STUDY ARCHIVE START -->\n'+archive+'\n<!-- STUDY ARCHIVE END -->');
homepage=homepage.replace(/<span data-study-total>[^<]*<\/span>/,'<span data-study-total>'+articles.length+' study notes</span>');
write('index.html',homepage.trimEnd());


console.log('Built '+articles.length+' study notes, directory, search index, and homepage archive.');
})();

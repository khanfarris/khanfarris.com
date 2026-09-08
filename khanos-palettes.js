(() => {
  const list = [
    {id:'crimson',name:'Crimson',subtitle:'Charcoal · crimson · midnight blue',description:'A charcoal-black workspace with precise crimson accents. Midnight-blue particles orbit quietly behind neutral glass.',swatches:['#0b0c0f','#bd2945','#2a3d67'],base:'#0b0c0f',panel:'#17181d',ink:'#e6e8ed',muted:'#b7bcc7',faint:'#8d94a3',accent:'#e34c67',secondary:'#bd2945',edge:'#555a66',signal:'#344c80',signalFollowsSubject:false,categories:['#df536c','#899aba','#c46e7f','#8193b6']},
    {id:'glacier',name:'Glacier',subtitle:'Midnight · ice blue · silver',description:'Cold blue light and silver typography on a midnight desktop. Clear, technical, and composed.',swatches:['#101927','#8acdeb','#d4e3ed'],base:'#0c1422',panel:'#162338',ink:'#e7f2fa',muted:'#a9c2d5',faint:'#819fb8',accent:'#9bd9f3',secondary:'#357faf',edge:'#688ead',signal:'#72c4f6',categories:['#9bd9f3','#94b6f2','#c9c9eb','#a6e3df']},
    {id:'orchid',name:'Orchid',subtitle:'Obsidian · violet · rose',description:'Violet particles, soft rose accents, and dark glass. A more expressive, cinematic atmosphere.',swatches:['#151220','#9870e3','#f1aec6'],base:'#12101c',panel:'#211b32',ink:'#f0eaf8',muted:'#c2b3d5',faint:'#a091b8',accent:'#edb1cb',secondary:'#956cda',edge:'#9675b1',signal:'#b18bed',categories:['#d4b0f2','#a5c5f3','#f0b1cf','#e7ccb3']},
    {id:'verdant',name:'Verdant',subtitle:'Forest · mint · phosphor',description:'The familiar green identity, refined into deep forest glass and a luminous mint signal.',swatches:['#081512','#89d9b5','#b7f4ab'],base:'#07130f',panel:'#11251d',ink:'#e0f2e4',muted:'#a7c6b2',faint:'#80a78e',accent:'#b7f4ab',secondary:'#438e75',edge:'#729c7a',signal:'#89e5b4',categories:['#b7f4ab','#8cdee0','#bfb2f0','#efc292']},
    {id:'ember',name:'Ember',subtitle:'Espresso · copper · ivory',description:'Copper illumination on an espresso workspace, balanced with warm ivory. Tactile, understated, and distinctive.',swatches:['#191511','#d78052','#eddbb7'],base:'#16120f',panel:'#292019',ink:'#f5eada',muted:'#ccb99e',faint:'#ab9277',accent:'#edcf96',secondary:'#c76b40',edge:'#ac8560',signal:'#ed965e',categories:['#edcf96','#e8a075','#d4bca0','#dbaab4']}
  ];
  const requested=new URLSearchParams(location.search).get('theme');
  const initial=list.find(p=>p.id===requested)||list[0];
  window.KhanThemes={list,initial};
  document.documentElement.dataset.theme=initial.id;
})();

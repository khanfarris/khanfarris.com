(() => {
  'use strict';
  const identity='Farris Khan\nsecurity / ops tinkerer\n\nEducation\nUniversity of South Florida\nInstitution\nBachelor of Science in Cybersecurity\nDegree\n\nCertifications\nMicrosoft Certified: Security Operations Analyst Associate (SC-200) · In Progress\nMicrosoft Certified: Azure Administrator Associate (AZ-104) · In Progress';
  const help='help       available commands\nls         browse the site\nwhoami     meet Farris\nopen dns   open a study note\ncat        toggle the companion\nclear      clear this terminal\n\nTip: use ↑ / ↓ for command history.';
  function resolve(value,pages) {
    const command=String(value).trim().toLowerCase();
    if (!command) return {kind:'empty'};
    if (command==='help') return {kind:'text',text:help};
    if (command==='whoami') return {kind:'text',text:identity};
    if (['ls','cat','clear'].includes(command)) return {kind:command};
    if (command.startsWith('open ')) {
      const name=command.slice(5).trim();
      const page=pages.find(p=>p.name.toLowerCase()===name||p.slug===name||(p.aliases||[]).includes(name));
      return page?{kind:'open',page}:{kind:'text',text:'Page not found. Use ls to see the available names.'};
    }
    return {kind:'text',text:'Unknown command. Type help to see what this shell can do.'};
  }
  window.KhanShell={resolve};
})();

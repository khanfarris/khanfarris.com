(() => {
  'use strict';
  // Keep the selected workspace palette when returning from a writeup.
  const theme = window.KhanThemes?.initial.id;
  if (!theme) return;
  document.querySelectorAll('[data-workspace-link]').forEach(link => {
    const url = new URL(link.getAttribute('href'), location.href);
    url.searchParams.set('theme', theme);
    link.href = url.href;
  });
})();

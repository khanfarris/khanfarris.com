(() => {
  'use strict';
  const triggers = document.querySelectorAll('[data-evidence]');
  if (!triggers.length || typeof HTMLDialogElement === 'undefined') return;
  const dialog = document.createElement('dialog');
  dialog.className = 'evidence-dialog';
  dialog.setAttribute('aria-labelledby', 'evidence-viewer-title');
  dialog.innerHTML = '<div class="evidence-toolbar"><h2 id="evidence-viewer-title">My saved lab screenshots</h2><button type="button" data-evidence-zoom aria-pressed="false">Zoom in</button><a data-evidence-original target="_blank" rel="noopener">Original image ↗</a><button type="button" data-evidence-close autofocus>Close ×</button></div><div class="evidence-canvas" tabindex="0" role="region" aria-label="Enlarged evidence. Scroll to see more when zoomed."></div><p class="evidence-caption">Red outlines mark the fields used for this answer. Press Esc to close.</p>';
  document.body.append(dialog);
  const canvas = dialog.querySelector('.evidence-canvas');
  const zoom = dialog.querySelector('[data-evidence-zoom]');
  let trigger = null;
  function resetZoom() {
    canvas.classList.remove('is-zoomed');
    zoom.setAttribute('aria-pressed', 'false');
    zoom.textContent = 'Zoom in';
    canvas.scrollTo(0, 0);
  }
  triggers.forEach(link => link.addEventListener('click', event => {
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || event.button) return;
    const evidence = link.querySelector('.evidence-image');
    if (!evidence) return;
    event.preventDefault();
    trigger = link;
    const copy = evidence.cloneNode(true);
    // Each view retains its own accessible image title without duplicating IDs.
    copy.querySelectorAll('[id]').forEach(element => element.removeAttribute('id'));
    canvas.replaceChildren(copy);
    dialog.querySelector('[data-evidence-original]').href = link.href;
    resetZoom();
    dialog.showModal();
  }));
  zoom.addEventListener('click', () => {
    const expanded = canvas.classList.toggle('is-zoomed');
    zoom.setAttribute('aria-pressed', String(expanded));
    zoom.textContent = expanded ? 'Fit to window' : 'Zoom in';
  });
  dialog.querySelector('[data-evidence-close]').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const box = dialog.getBoundingClientRect();
    if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) dialog.close();
  });
  dialog.addEventListener('close', () => trigger?.focus({preventScroll:true}));
})();

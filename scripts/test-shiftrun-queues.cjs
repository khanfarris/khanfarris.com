const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const esbuild = require(path.join(process.env.SHIFTRUN_DEPENDENCIES || path.join(root, 'shiftrun-src/node_modules'), 'esbuild'));
const out = esbuild.buildSync({ stdin: { contents: "export * from './app/game';export * from './app/progress';", resolveDir: path.join(root, 'shiftrun-src') }, bundle: true, write: false, platform: 'node', format: 'cjs' });
const mod = { exports: {} };
new Function('module', 'exports', 'require', out.outputFiles[0].text)(mod, mod.exports, require);
const g = mod.exports;
const ids = run => run.cases.map(c => c.template);

for (const seed of [966459, 71957, 20260909, 0, ...Array.from({ length: 150 }, (_, i) => i * 7919)]) {
  for (const mode of ['Guided', 'Veteran']) {
    const shifts = [1, 2, 3].map(wave => g.newRun(seed, mode, 'Investigator', 'All', wave));
    assert.equal(new Set(shifts.flatMap(ids)).size, 12, `${seed} ${mode}: no repeats`);
    for (const run of shifts) {
      assert.deepEqual(run, g.newRun(seed, mode, 'Investigator', 'All', run.wave));
      assert.deepEqual(ids(run), ids(g.newRun(seed, mode, 'Responder', 'All', run.wave)));
      assert.deepEqual(ids(run), ids(g.newRun(seed, mode, 'Communicator', 'All', run.wave)));
      assert.deepEqual(run, g.newRun(seed, mode, 'Investigator', 'All', run.wave, shifts.filter(s => s.wave < run.wave)));
    }
  }
}
const seed = 966459;
assert.deepEqual(ids(g.newRun(seed, 'Guided', 'Investigator')), ['bec', 'training', 'ztna', 'dns']);
assert.deepEqual(ids(g.newRun(seed, 'Guided', 'Investigator', 'All', 2)), ['scan', 'vuln', 'handoff', 'phish']);
assert.deepEqual(ids(g.newRun(seed, 'Guided', 'Investigator', 'All', 3)), ['firewall', 'ransom', 'travel', 'mac']);
for (const skill of g.skills) {
  const practice = g.newRun(seed, 'Practice', 'Investigator', skill);
  assert.equal(practice.cases.length, 1);
  assert.equal(g.template(practice.cases[0]).skill, skill);
  for (const mode of ['Guided', 'Veteran'])
    assert.deepEqual(g.newRun(seed, mode, 'Investigator', skill), g.newRun(seed, mode, 'Investigator'), 'Practice focus does not leak into campaigns');
}

function closeShift(wave) {
  let run = g.newRun(seed, 'Guided', 'Investigator', 'All', wave);
  for (let i = 0; i < run.cases.length; i++) {
    run = { ...run, selected: i };
    for (let source = 0; source < 3; source++) run = g.readEvidence(run, source);
    const scenario = g.template(run.cases[i]);
    for (const action of scenario.actions.filter(a => !a.bad)) run = g.perform(run, action.id);
    run = g.closeCase(run, scenario.truth, 0, `Saved notes for ${scenario.id}`);
  }
  return run;
}
const shift1 = closeShift(1), shift2 = closeShift(2);
const legacy3 = g.newRun(seed, 'Guided', 'Investigator', 'All', 3);
legacy3.cases[1].template = 'training'; legacy3.cases[2].template = 'ztna';
legacy3.cases.forEach((c, i) => { c.id = `${seed}-3-${i}`; });
legacy3.turn = 6; legacy3.trust = 87; legacy3.credits = 27; legacy3.totalScore = 800; legacy3.totalClosed = 8;
// Existing work on a unique case must survive the migration verbatim.
legacy3.cases[0].reads = [0]; legacy3.cases[0].pressure = 41;
const fixture = {
  ...structuredClone(g.emptySave), run: legacy3, shiftHistory: [shift1, shift2], xp: 800,
  drafts: { [legacy3.cases[0].id]: { note: 'Keep my draft verbatim', disposition: 'Configuration risk' } },
  records: [shift1, shift2].flatMap(run => run.cases.map(c => ({ id: c.id, template: c.template, score: c.score, note: c.notes, detail: c, mode: run.mode }))),
};
const original = structuredClone(fixture), fixed = g.normalizeSave(fixture);
assert.deepEqual(fixture, original, 'Migration does not mutate its input');
assert.deepEqual(ids(fixed.run), ['firewall', 'ransom', 'travel', 'mac']);
assert.deepEqual({ ...fixed.run, cases: legacy3.cases }, legacy3, 'Shift counters, selection and log unchanged');
assert.deepEqual(fixed.run.cases[0], legacy3.cases[0]);
assert.deepEqual(fixed.run.cases[3], legacy3.cases[3]);
for (const index of [1, 2]) {
  assert.notEqual(fixed.run.cases[index].id, legacy3.cases[index].id);
  assert.deepEqual({ ...fixed.run.cases[index], id: legacy3.cases[index].id, template: legacy3.cases[index].template }, legacy3.cases[index]);
}
assert.deepEqual(fixed.shiftHistory, original.shiftHistory);
assert.deepEqual(fixed.drafts, original.drafts);
assert.equal(fixed.xp, 800);
assert.deepEqual(fixed.records.map(r => [r.id, r.note, r.score, r.detail]), original.records.map(r => [r.id, r.note, r.score, r.detail]));
assert.deepEqual(g.normalizeSave(fixed), fixed, 'Migration is idempotent');
assert.deepEqual(g.parseBackup(g.backupJSON(fixed)), fixed, 'Updated save round-trips');
assert.deepEqual(ids(g.normalizeSave({ ...structuredClone(original), shiftHistory: undefined }).run), ids(fixed.run), 'Legacy records suffice without snapshots');

for (const edit of [
  c => { c.reads = [0]; }, c => { c.done = ['validate']; }, c => { c.mistakes = 1; },
  c => { c.notes = 'Existing notes'; }, c => { c.closed = true; c.score = 85; c.clientUpdateVersion = 2; },
]) {
  const save = structuredClone(original); edit(save.run.cases[1]);
  const result = g.normalizeSave(save);
  assert.deepEqual(result.run.cases[1], save.run.cases[1], 'Never replace a started/completed case');
  assert.equal(result.run.cases[2].template, 'ransom', 'Other untouched repeat still replaced with unused case');
}
for (const key of ['note', 'recap', 'disposition', 'comms']) {
  const save = structuredClone(original); save.drafts[legacy3.cases[1].id] = { [key]: 'Preserve' };
  assert.equal(g.normalizeSave(save).run.cases[1].template, 'training', `Preserve ${key} draft`);
}
const recorded = structuredClone(original);
recorded.records.push({ id: legacy3.cases[1].id, template: 'training', score: 85, note: 'Archived work' });
assert.equal(g.normalizeSave(recorded).run.cases[1].template, 'training');
const stale = structuredClone(original);
stale.drafts[legacy3.cases[1].id] = { note: 'Notes about the old training simulation' };
const merged = g.mergeSaves(fixed, stale);
assert.equal(merged.drafts[legacy3.cases[1].id].note, stale.drafts[legacy3.cases[1].id].note);
assert.equal(merged.drafts[fixed.run.cases[1].id], undefined, 'An older backup cannot attach old notes to a replacement');
const otherCampaign = structuredClone(original); otherCampaign.records = []; otherCampaign.shiftHistory.forEach(r => { r.seed = 123; });
assert.deepEqual(ids(g.normalizeSave(otherCampaign).run), ids(legacy3), 'Ignore other campaigns');

// A legacy shift may already contain duplicates that were worked. Use its
// actual queue for future previews/progression, rather than regenerated history.
const unusual = structuredClone(shift2); unusual.cases[0].template = 'ransom';
const historical = [shift1, unusual];
const next = g.newRun(seed, 'Guided', 'Investigator', 'All', 3, historical);
const used = new Set(historical.flatMap(ids));
assert(next.cases.every(c => !used.has(c.template)));
const published = JSON.parse(fs.readFileSync(path.join(root, 'shiftrun/khanfarris-profile.json'), 'utf8')).save;
assert.deepEqual(g.normalizeSave(published).run.cases, published.run.cases, 'Published completed work preserved');
console.log('PASS: 308 seeded campaigns, 12 unique cases, specialty/Practice behavior, untouched-repeat migration, notes/scores/history, legacy backups and idempotence');

if (process.argv.includes('--browser')) {
  const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
  (async () => {
    const browser = await chromium.launch({ channel: 'msedge', headless: true });
    try {
      const page = await browser.newPage(), errors = [];
      page.on('pageerror', e => errors.push(e.message));
      await page.goto('http://127.0.0.1:4173/shiftrun/');
      await page.evaluate(save => localStorage.setItem('khanfarris-shiftfall-v1', JSON.stringify(save)), original);
      await page.reload();
      await page.getByRole('button', { name: 'Browse shifts, current shift 3', exact: true }).waitFor();
      assert.deepEqual(await page.locator('.incident-node strong').allTextContents(), fixed.run.cases.map(c => g.template(c).title));
      let saved = await page.evaluate(() => JSON.parse(localStorage.getItem('khanfarris-shiftfall-v1')));
      assert.deepEqual(saved, fixed, 'Reload migrates and autosaves');
      await page.reload();
      saved = await page.evaluate(() => JSON.parse(localStorage.getItem('khanfarris-shiftfall-v1')));
      assert.deepEqual(saved, fixed, 'Second reload does not change the save');
      await page.getByRole('button', { name: 'View khanfarris profile', exact: true }).click();
      await page.getByRole('button', { name: 'Return to your progress', exact: true }).waitFor();
      await page.getByRole('button', { name: 'Return to your progress', exact: true }).click();
      assert.deepEqual(await page.evaluate(() => JSON.parse(localStorage.getItem('khanfarris-shiftfall-v1'))), fixed);
      // Both advancement paths must enter exactly the queue shown in preview.
      for (const button of ['Continue without upgrade', 'Watchtower']) {
        const atReward = { ...structuredClone(fixed), run: { ...structuredClone(shift2), credits: 20 } };
        await page.evaluate(save => localStorage.setItem('khanfarris-shiftfall-v1', JSON.stringify(save)), atReward);
        await page.reload();
        await page.getByRole('button', { name: /Browse shifts, current shift/ }).hover();
        await page.getByRole('button', { name: 'Shift 3 Locked preview', exact: true }).click();
        const preview = await page.locator('.incident-node strong').allTextContents();
        await page.getByRole('button', { name: /Browse shifts, current shift/ }).hover();
        await page.getByRole('button', { name: 'Shift 2 Completed', exact: true }).click();
        await page.getByRole('button', { name: new RegExp(button) }).click();
        await page.getByRole('button', { name: 'Browse shifts, current shift 3', exact: true }).waitFor();
        assert.deepEqual(await page.locator('.incident-node strong').allTextContents(), preview);
      }
      assert.deepEqual(errors, []);
      console.log('PASS: browser migration/autosave, reload, profile isolation, preview and both advancement paths');
    } finally { await browser.close(); }
  })().catch(e => { console.error(e); process.exitCode = 1; });
}

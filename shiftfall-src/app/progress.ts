import { scenarios, template, type Run, type CaseState } from './game';
export type RecordItem = {
  id: string;
  template: string;
  score: number;
  note: string;
  detail?: CaseState;
  completedAt?: string;
  mode?: string;
  provenance?: string;
};
export type Draft = {
  note?: string;
  recap?: string;
  disposition?: string;
  comms?: string;
};
export type Save = {
  xp: number;
  records: RecordItem[];
  run: Run | null;
  shiftHistory?: Run[];
  drafts?: Record<string, Draft>;
  updatedAt?: string;
  schemaVersion?: number;
};
export const emptySave: Save = {
  xp: 0,
  records: [],
  run: null,
  drafts: {},
  schemaVersion: 2,
};
export function keepShift(history: Run[] = [], run: Run): Run[] {
  return [...history.filter(h=>!(h.seed===run.seed && h.mode===run.mode && h.wave===run.wave)),structuredClone(run)];
}
const finite = (n: unknown, min = 0, max = 10000000) =>
  typeof n === 'number' && Number.isFinite(n) && n >= min && n <= max;
const validCase = (c: CaseState) =>
  !!c &&
  scenarios.some((s) => s.id === c.template) &&
  typeof c.id === 'string' &&
  Number.isInteger(c.client) &&
  c.client >= 0 &&
  c.client < 3 &&
  Array.isArray(c.reads) &&
  c.reads.every((i) => Number.isInteger(i) && i >= 0 && i < 3) &&
  Array.isArray(c.done) &&
  c.done.every((a) => template(c).actions.some((x) => x.id === a)) &&
  finite(c.score, 0, 100) &&
  finite(c.pressure, 0, 100) &&
  typeof c.closed === 'boolean';
const migrateDrafts = (s: Save) => {
  const oldKey = 'inter' + 'view';
  if (s.drafts)
    for (const draft of Object.values(s.drafts) as Array<
      Draft & Record<string, string>
    >) {
      if (!draft.recap && draft[oldKey]) draft.recap = draft[oldKey];
      delete draft[oldKey];
    }
  return s;
};
export function normalizeSave(input: unknown): Save {
  if (!input || typeof input !== 'object') throw new Error('Invalid backup');
  const s = migrateDrafts(input as Save);
  if(s.shiftHistory){
    if(!Array.isArray(s.shiftHistory)||s.shiftHistory.length>2000)throw new Error('Invalid shift history');
    for(const run of s.shiftHistory)normalizeSave({...emptySave,run});
  }
  if (
    !finite(s.xp) ||
    !Array.isArray(s.records) ||
    s.records.length > 20000 ||
    s.records.some(
      (r) =>
        !r ||
        typeof r.id !== 'string' ||
        typeof r.note !== 'string' ||
        r.note.length > 100000 ||
        !finite(r.score, 0, 100) ||
        !scenarios.some((x) => x.id === r.template),
    )
  )
    throw new Error('Invalid progress records');
  if (s.run) {
    const r = s.run;
    if (
      !Array.isArray(r.cases) ||
      r.cases.length < 1 ||
      r.cases.length > 20 ||
      !r.cases.every(validCase) ||
      !Number.isInteger(r.selected) ||
      r.selected < 0 ||
      r.selected >= r.cases.length ||
      !finite(r.totalScore) ||
      !finite(r.totalClosed) ||
      !finite(r.turn) ||
      !finite(r.trust, 0, 100) ||
      !['play', 'reward', 'finished'].includes(r.phase) ||
      !Array.isArray(r.log)
    )
      throw new Error('Invalid active shift');
  }
  if (
    s.drafts &&
    Object.values(s.drafts).some(
      (d) =>
        !d ||
        Object.values(d).some(
          (v) => typeof v !== 'string' || v.length > 100000,
        ),
    )
  )
    throw new Error('Invalid drafts');
  const records = s.records.map((r) => {
    if (r.detail && !validCase(r.detail))
      throw new Error('Invalid detailed record');
    const detail =
      r.detail || s.run?.cases.find((c) => c.closed && c.id === r.id);
    return {
      ...r,
      detail,
      mode: r.mode || s.run?.mode,
      provenance: r.provenance || 'Recorded in the training game',
    };
  });
  return { ...s, records, drafts: s.drafts || {}, schemaVersion: 2 };
}
const combineText = (a = '', b = '') =>
  a === b || a.includes(b)
    ? a
    : b.includes(a)
      ? b
      : [a, b].filter(Boolean).join('\n\n[Recovered alternate text]\n');
export function mergeSaves(remote: Save | null, local: Save | null): Save {
  if (!remote) return normalizeSave(local || emptySave);
  if (!local) return normalizeSave(remote);
  const r = normalizeSave(remote),
    l = normalizeSave(local),
    map = new Map(r.records.map((x) => [x.id, x]));
  for (const item of l.records) {
    const prior = map.get(item.id);
    map.set(
      item.id,
      prior
        ? {
            ...item,
            ...prior,
            note: combineText(prior.note, item.note),
            detail: prior.detail || item.detail,
          }
        : item,
    );
  }
  const drafts = { ...l.drafts, ...r.drafts };
  for (const [id, d] of Object.entries(l.drafts || {})) {
    const other = r.drafts?.[id];
    if (other)
      drafts[id] = {
        ...d,
        ...other,
        note: combineText(other.note, d.note),
        recap: combineText(other.recap, d.recap),
      };
  }
  let run = r.run;
  if (l.updatedAt && l.updatedAt > (r.updatedAt || '') && l.run) run = l.run;
  if (!run && l.run) run = l.run;
  else if (
    run &&
    l.run &&
    run.seed === l.run.seed &&
    run.wave === l.run.wave &&
    (l.run.totalClosed > run.totalClosed ||
      (l.run.totalClosed === run.totalClosed && l.run.turn > run.turn))
  )
    run = l.run;
  const records = [...map.values()];
  return {
    ...r,
    records,
    shiftHistory: [...(l.shiftHistory||[]),...(r.shiftHistory||[])].reduce((all,h)=>keepShift(all,h),[] as Run[]),
    drafts,
    run,
    xp: Math.max(
      r.xp,
      l.xp,
      records.reduce((n, x) => n + x.score, 0),
    ),
    schemaVersion: 2,
  };
}
export function backupJSON(save: Save) {
  return JSON.stringify(
    {
      format: 'shiftfall-backup',
      version: 2,
      exportedAt: new Date().toISOString(),
      save: normalizeSave(save),
    },
    null,
    2,
  );
}
export function parseBackup(text: string): Save {
  const x = JSON.parse(text);
  return normalizeSave(x.format === 'shiftfall-backup' ? x.save : x);
}
export function scoreDetails(c: CaseState) {
  const s = template(c),
    required = s.actions.filter((a) => !a.bad),
    evidence = Math.round((c.reads.length / 3) * 20),
    response = Math.round(
      (required.filter((a) => c.done.includes(a.id)).length / required.length) *
        45,
    ),
    classification = c.result === s.truth ? 20 : 0,
    communication = c.communication ?? 0,
    penalty = c.mistakes * 8;
  return {
    evidence,
    response,
    classification,
    communication,
    penalty,
    total: c.score,
    missed: required.filter((a) => !c.done.includes(a.id)).map((a) => a.label),
    correctClassification: s.truth,
  };
}
export function improvementTips(c: CaseState) {
  const d = scoreDetails(c),
    tips: string[] = [];
  if (d.evidence < 20)
    tips.push(
      `Review every evidence source before closing the case (+${20 - d.evidence} possible).`,
    );
  if (d.response < 45)
    tips.push(
      `Complete the missed response steps: ${d.missed.join('; ')} (+${45 - d.response} possible).`,
    );
  if (d.classification < 20)
    tips.push(
      `Classify the evidence as “${d.correctClassification}” (+20 possible).`,
    );
  if (d.communication < 15)
    tips.push(
      'Use the cautious client update that separates confirmed facts, unknowns, next actions, and update timing (+15 possible).',
    );
  if (d.penalty)
    tips.push(
      `Avoid unsafe or out-of-sequence actions (${d.penalty} points deducted).`,
    );
  if (!tips.length)
    tips.push(
      'Full credit: you reviewed all evidence, completed the safe response sequence, classified the case correctly, and communicated with appropriate caution.',
    );
  return tips;
}
const esc = (s: unknown) =>
  String(s ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
export function portfolioHTML(save: Save) {
  const completed = new Set(save.records.map((r) => r.template)).size;
  return `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>SHIFTFALL · Training portfolio</title><style>body{max-width:950px;margin:40px auto;padding:24px;font:16px/1.7 system-ui;background:#0c181b;color:#dfede5}h1{font-size:38px;color:#c5ef97}h2{color:#c5ef97}article{padding:25px;margin:22px 0;border:1px solid #537163;border-radius:10px;break-inside:avoid}small{color:#a5beb0}pre{white-space:pre-wrap;overflow-wrap:anywhere;font:14px/1.7 monospace;background:#152a26;padding:15px}a{color:#c5ef97}.banner{border-left:4px solid #c5ef97;padding:15px;background:#1b3028}@media print{body{background:white;color:#162a20;max-width:none;margin:0}h1,h2,a{color:#193d29}pre,.banner{background:#f0f5f0}small{color:#405b49}}</style><h1>Cybersecurity analyst<br>Training portfolio</h1><p>SHIFTFALL · ${completed} of ${scenarios.length} scenario types practiced · ${save.records.length} completed encounters · ${save.xp} XP</p><p class="banner">Independent, self-directed simulation based on a Cybersecurity Analyst role. These are fictional incidents and game-scored exercises, not professional client work, vendor certification, or independently verified competence. Personal notes and answers are self-authored and ungraded.</p><small>Portfolio exported ${esc(new Date().toISOString())}. This file is a read-only snapshot; the private game retains the live record.</small>${save.records
    .map((r) => {
      const s = scenarios.find((s) => s.id === r.template)!;
      const score = r.detail ? scoreDetails(r.detail) : null;
      const tips = r.detail ? improvementTips(r.detail) : [];
      const explanation = score
        ? `<h3>How the score was calculated</h3><ul><li>Evidence reviewed: +${score.evidence}/20</li><li>Response actions: +${score.response}/45</li><li>Classification: +${score.classification}/20</li><li>Client update: +${score.communication}/15</li><li>Decision penalties: −${score.penalty}</li><li><b>Final score: ${score.total}/100</b></li></ul><h3>${score.total === 100 ? 'What went right' : 'How to improve'}</h3><ul>${tips.map((tip) => `<li>${esc(tip)}</li>`).join('')}</ul>`
        : '';
      return `<article><h2>${esc(s.title)} · ${r.score}/100</h2><small>${esc(s.skill)} · ${esc(r.mode || 'Legacy exercise')} · ${esc(r.completedAt || 'Completion timestamp not recorded')}<br>${esc(r.provenance)}</small><p>${esc(s.brief)}</p><h3>Evidence and response record</h3>${r.detail ? `<p>Classification: ${esc(r.detail.result)} · Reviewed ${r.detail.reads.length}/3 sources · ${r.detail.mistakes} decision penalties</p><ul>${r.detail.done.map((id) => `<li>${esc(s.actions.find((a) => a.id === id)?.label)}</li>`).join('')}</ul>${r.detail.reads.map((i) => `<details><summary>${esc(s.evidence[i].tool)} — ${esc(s.evidence[i].title)}</summary><pre>${esc(s.evidence[i].body)}</pre></details>`).join('')}` : '<p>Legacy score and notes retained; detailed action history was not recorded.</p>'}${explanation}<h3>My analyst notes</h3><pre>${esc(r.note || 'No personal notes saved.')}</pre><h3>Exercise learning point</h3><p>${esc(s.lesson)}</p></article>`;
    })
    .join(
      '',
    )}<p>Generated by SHIFTFALL. No affiliation with any employer or the named security vendors.</p></html>`;
}
export function download(content: string, name: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}


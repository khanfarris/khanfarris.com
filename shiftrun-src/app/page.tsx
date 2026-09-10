import {clientUpdates,updateOrder} from './client-updates';
'use client';
import { useState, useEffect, useRef, useId } from 'react';
import { flushSync } from 'react-dom';
import {
  Shield,
  Activity,
  Crosshair,
  BookOpen,
  ChevronRight,
  Check,
  Radio,
  Trophy,
  Fingerprint,
  Terminal,
  ArrowUpRight,
  ArrowRight,
  Layers,
  Clock,
  Download,
  Lock,
} from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  scenarios,
  skills,
  sources,
  clients,
  newRun,
  template,
  readEvidence,
  perform,
  closeCase,
  rng,
  type CaseState,
  type Run,
} from './game';
import Portfolio from './portfolio';
import {Help} from '../help';
import {ShiftDial} from '../shift-dial';
import {IncidentConstellation} from '../constellation';
import { useProgress } from './use-progress';
import {
  backupJSON,
  parseBackup,
  mergeSaves,
  portfolioHTML,
  download,
  scoreDetails,
  keepShift,
  runQueues,
  improvementTips,
  type Save,
} from './progress';
const roles = [
  [
    'Investigator',
    'See the whole story.',
    'First evidence review in each case costs no turn.',
    Fingerprint,
  ],
  [
    'Responder',
    'Stop the spread.',
    'First stabilizing action in each case costs no turn.',
    Shield,
  ],
  [
    'Communicator',
    'Protect the relationship.',
    'Bad decisions cost 5 trust instead of 8.',
    Radio,
  ],
] as const;
function Choices({
  label,
  value,
  onChange,
  items,
  unavailable = {},
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  items: string[];
  unavailable?: Record<string, string>;
}) {
  const id = useId();
  return (
    <fieldset>
      <legend>{label}</legend>
      <RadioGroup
        className="choices"
        value={value}
        onValueChange={(v) => { if (!unavailable[String(v)]) onChange(String(v)); }}
      >
        {items.map((item, index) => (
          <label
            className={(value === item ? 'choice chosen' : 'choice') + (unavailable[item] ? ' unavailable-trigger' : '')}
            key={item}
            tabIndex={unavailable[item] ? 0 : undefined}
            aria-disabled={unavailable[item] ? true : undefined}
            aria-describedby={unavailable[item] ? `${id}-${index}` : undefined}
            onClick={e => { if (unavailable[item]) { e.preventDefault(); e.currentTarget.focus(); } }}
          >
            <RadioGroupItem value={item} disabled={!!unavailable[item]} aria-labelledby={`${id}-${index}-label`} />
            <span id={`${id}-${index}-label`}>{item}</span>
            {unavailable[item] && <><Lock size={13} aria-hidden="true" /><span className="availability-tooltip" role="tooltip" id={`${id}-${index}`}>{unavailable[item]}</span></>}
          </label>
        ))}
      </RadioGroup>
    </fieldset>
  );
}
function ScoreExplanation({ incident }: { incident: CaseState }) {
  const score = scoreDetails(incident);
  return (
    <section className="score-explanation">
      <h3>How your score was calculated <Help topic="score" label="Incident scoring" /></h3>
      <div className="rubric">
        <span>
          Evidence reviewed <b>+{score.evidence}/20</b>
        </span>
        <span>
          Response actions <b>+{score.response}/45</b>
        </span>
        <span>
          Classification <b>+{score.classification}/20</b>
        </span>
        <span>
          Client update <b>+{score.communication}/15</b>
        </span>
        <span>
          Decision penalties <b>−{score.penalty}</b>
        </span>
        <span>
          Final score <b>{score.total}/100</b>
        </span>
      </div>
      <h3>{score.total === 100 ? 'What you got right' : 'How to improve'}</h3>
      <ul className="improvement-list">
        {improvementTips(incident).map((tip) => (
          <li key={tip}>{tip}</li>
        ))}
      </ul>
      <p className="score-note">
        Only recorded choices affect the score. Personal notes remain self-reviewed.
      </p>
    </section>
  );
}
function LockedResponse(){return <div className="sealed-section"><div className="action-grid sealed-shapes" aria-hidden="true">{[1,2,3,4].map(n=><div className="action" key={n}><small>RESPONSE ACTION</small><b>Review findings and coordinate the next response</b><span>Execute</span></div>)}</div><div className="sealed-overlay"><span className="sealed-emblem"><Lock size={22}/></span><h3>Response actions locked</h3><p>Investigate this assignment when the shift unlocks.</p></div></div>}
function LockedHandoff(){return <div className="sealed-section"><div className="sealed-shapes handoff-skeleton" aria-hidden="true"><h3>What does the evidence establish?</h3><div className="sealed-options">{[1,2,3,4].map(n=><span key={n}>Assessment</span>)}</div><h3>Client update</h3>{[1,2,3].map(n=><div className="sealed-answer" key={n}>Record the scope and communicate the next steps.</div>)}<h3>Analyst notes</h3><div className="sealed-notes"/></div><div className="sealed-overlay"><span className="sealed-emblem"><Lock size={22}/></span><h3>Handoff locked</h3><p>Classification, client updates and notes become available when you can work this incident.</p></div></div>}
export default function Home({profile,onToggle}:{profile?:Save;onToggle:()=>void}) {
  const isProfile=!!profile;
  const [browsingWave,setBrowsingWave]=useState<number|null>(null);
  const [profileSelection,setProfileSelection]=useState(profile?.run?.selected||0);
  const { save, setSave, ready, status: storage } = useProgress(profile);
  const activeRun=save.run || (isProfile ? save.shiftHistory?.at(-1) || null : null);
  const queues=runQueues(save);
  const completedWaves=activeRun ? [...(save.shiftHistory||[]).filter(h=>h.seed===activeRun.seed&&h.mode===activeRun.mode&&h.cases.every(c=>c.closed)).map(h=>h.wave),...(activeRun.cases.every(c=>c.closed)?[activeRun.wave]:[])] : [];
  const selectedWave=browsingWave ?? (isProfile&&completedWaves.length?Math.max(...completedWaves):activeRun?.wave);
  const past=!!activeRun && !!selectedWave && selectedWave<activeRun.wave;
  const locked=!!activeRun && !!selectedWave && selectedWave>activeRun.wave;
  const historical=activeRun && save.shiftHistory?.find(h=>h.seed===activeRun.seed && h.mode===activeRun.mode && h.wave===selectedWave);
  const readOnly=isProfile||past||locked;
  const [view, setView] = useState('play'),
    [mode, setMode] = useState('Guided'),
    [role, setRole] = useState('Investigator'),
    [focus, setFocus] = useState('All'),
    [tab, setTab] = useState(past||profile?.run?.cases.every(c=>c.closed)?'debrief':'evidence'),
    [disposition, setDisposition] = useState(''),
    [comms, setComms] = useState(''),
    [note, setNote] = useState(''),
    [hint, setHint] = useState(false);
  const saveRef = useRef(save);
  saveRef.current = save;
  useEffect(() => {
    if(readOnly)return;
    const context = (document as any).modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    const register = (tool: any) => {
      try {
        Promise.resolve(
          context.registerTool(tool, { signal: lifecycle.signal }),
        ).catch(() => {});
      } catch {}
    };
    register({
      name: 'read_training_shift',
      description:
        'Read the current training shift and visible evidence; does not reveal unread evidence or answers.',
      inputSchema: {
        type: 'object',
        properties: {},
        additionalProperties: false,
      },
      annotations: { readOnlyHint: true },
      execute: () => {
        const r = saveRef.current.run;
        if (!r) return { state: 'ready' };
        return {
          mode: r.mode,
          turn: r.turn,
          trust: r.trust,
          cases: r.cases.map((c) => ({
            title: template(c).title,
            closed: c.closed,
            pressure: c.pressure,
            evidence: c.reads.map((i) => template(c).evidence[i]),
            actionsCompleted: c.done,
          })),
        };
      },
    });
    register({
      name: 'review_training_evidence',
      description:
        'Review one evidence source in the selected simulated case; consumes a game turn under the same rules as the visible button.',
      inputSchema: {
        type: 'object',
        properties: { index: { type: 'integer', minimum: 0, maximum: 2 } },
        required: ['index'],
        additionalProperties: false,
      },
      annotations: { readOnlyHint: false },
      execute: (input: any) => {
        if (
          !input ||
          !Number.isInteger(input.index) ||
          input.index < 0 ||
          input.index > 2
        )
          throw new Error('index must be 0, 1 or 2');
        const r = saveRef.current.run;
        if (!r || r.cases[r.selected].closed)
          throw new Error('Select an open case first');
        const next = readEvidence(r, input.index);
        flushSync(() => setSave((s) => ({ ...s, run: next })));
        return {
          evidence: template(next.cases[next.selected]).evidence[input.index],
          turn: next.turn,
        };
      },
    });
    register({
      name: 'read_training_backup',
      description:
        'Read the full saved training record, including the user’s notes, to back up or verify a requested migration.',
      inputSchema: {
        type: 'object',
        properties: {},
        additionalProperties: false,
      },
      annotations: { readOnlyHint: true },
      execute: () => ({ save: saveRef.current }),
    });
    register({
      name: 'restore_training_backup',
      description:
        'Merge an explicitly provided progress backup into the current training record. Preserves existing completed records and notes; saves in this browser.',
      inputSchema: {
        type: 'object',
        properties: { backup: { type: 'string' } },
        required: ['backup'],
        additionalProperties: false,
      },
      annotations: { readOnlyHint: false },
      execute: (input: any) => {
        if (typeof input?.backup !== 'string')
          throw new Error('Backup JSON required');
        const recovered = parseBackup(input.backup);
        const merged = mergeSaves(saveRef.current, recovered);
        flushSync(() => setSave(merged));
        return {
          records: merged.records.length,
          xp: merged.xp,
          sync: 'queued',
        };
      },
    });
    return () => lifecycle.abort();
  }, []);
  const legacyHistory=!!(past&&!historical);
  const recovered=legacyHistory&&activeRun&&selectedWave?(()=>{
    const shell=newRun(activeRun.seed,activeRun.mode,activeRun.role,'All',selectedWave);
    const records=save.records.filter(r=>r.id.startsWith(`${activeRun.seed}-${selectedWave}-`)).sort((a,b)=>Number(a.id.split('-').at(-1))-Number(b.id.split('-').at(-1)));
    return {...shell,phase:'finished' as const,cases:records.map(r=>r.detail?{...r.detail,notes:r.note,score:r.score}:{...shell.cases[0],id:r.id,template:r.template,closed:true,score:r.score,notes:r.note}),log:['Read-only review from saved incident records. Historical trust, turns and intel were not retained in this older save.']};
  })():null;
  const viewedRun=locked&&activeRun&&selectedWave?newRun(activeRun.seed,activeRun.mode,activeRun.role,'All',selectedWave,queues):past?(historical||recovered):activeRun;
  const run = viewedRun ? {...viewedRun,selected:readOnly?Math.min(profileSelection,viewedRun.cases.length-1):viewedRun.selected} : null,
    c = run?.cases[run.selected],
    s = c ? template(c) : null;
  const sealed=locked || !!(isProfile&&c&&!c.closed);
  const level = Math.floor(save.xp / 350) + 1;
  useEffect(() => {
    const d = c ? save.drafts?.[c.id] : null;
    setNote(d?.note || '');
    setDisposition(d?.disposition || '');
    setComms(d?.comms || '');
  }, [c?.id, ready]);
  function draft(key: string, value: string) {
    if (!c || readOnly || locked) return;
    setSave((prev) => ({
      ...prev,
      drafts: {
        ...prev.drafts,
        [c.id]: { ...prev.drafts?.[c.id], [key]: value },
      },
    }));
  }
  function update(next: Run) {
    if(readOnly || locked)return;
    setSave((prev) => ({ ...prev, run: next,shiftHistory:prev.run&&prev.run.wave!==next.wave?keepShift(prev.shiftHistory,prev.run):prev.shiftHistory }));
  }
  function start(daily = false) {
    if (daily || mode === 'Veteran') return;
    setBrowsingWave(null);
    const seed = daily
      ? Number(new Date().toISOString().slice(0, 10).replaceAll('-', ''))
      : Math.floor(Math.random() * 1000000);
    update(newRun(seed, daily ? 'Veteran' : mode, role, focus));
    setView('play');
    setTab('evidence');
  }
  function select(index: number) {
    if (!run) return;
    if(readOnly){setProfileSelection(index);setTab(run.cases[index].closed?'debrief':'evidence');setHint(false);return;}
    update({ ...run, selected: index });
    setTab('evidence');
    setHint(false);
    const d = save.drafts?.[run.cases[index].id];
    setDisposition(d?.disposition || '');
    setComms(d?.comms || '');
    setNote(d?.note || '');
  }
  function submit() {
    if (readOnly || locked || !run || !c || !s || !disposition || !comms || c.closed) return;
    const next = closeCase(run, disposition, Number(comms) - 1, note);
    const closed = next.cases[next.selected];
    setSave((prev) => ({
      ...prev,
      run: next,
      shiftHistory:next.cases.every(c=>c.closed)?keepShift(prev.shiftHistory,next):prev.shiftHistory,
      xp: prev.xp + closed.score,
      records: [
        {
          id: closed.id,
          template: closed.template,
          score: closed.score,
          note,
          detail: closed,
          completedAt: new Date().toISOString(),
          mode: run.mode,
          provenance: 'Recorded in the training game',
        },
        ...prev.records,
      ],
    }));
    setTab('debrief');
  }
  function nextWave(upgrade: string) {
    if (!run || readOnly || locked || run.phase!=='reward') return;
    setBrowsingWave(null);
    const next = newRun(run.seed, run.mode, run.role, 'All', run.wave + 1, queues);
    update({
      ...next,
      trust: upgrade === 'restore' ? Math.min(100, run.trust + 25) : run.trust,
      totalScore: run.totalScore,
      totalClosed: run.totalClosed,
      credits: run.credits - 6,
      upgrade: upgrade === 'watch' ? 'watch' : run.upgrade,
    });
    setTab('evidence');
    setDisposition('');
    setComms('');
    setNote('');
  }
  function exportNotes() {
    const content = [
      'SHIFTRUN — Personal training journal',
      'Fictional scenarios; training scores are not a certification.',
      ...save.records.map((r) => {
        const s = scenarios.find((s) => s.id === r.template)!;
        return `\n${s.title} · ${r.score}/100\n${s.recap}\nNotes: ${r.note || 'No notes recorded.'}\nLesson: ${s.lesson}\nSource: ${sources[s.source][1]}`;
      }),
    ].join('\n');
    const url = URL.createObjectURL(
      new Blob([content], { type: 'text/plain' }),
    );
    const a = document.createElement('a');
    a.href = url;
    a.download = 'shiftrun-training-journal.txt';
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return (
    <main className="shell">
      <header>
        <button className="brand brand-button" onClick={() => setView('play')}>
          <Shield size={25} /> SHIFTRUN
        </button>
        <span className="header-label">
          ANALYST GUILD <i /> CYBERSECURITY ROLE PREP
        </span>
        <div className="profile">
          <span className="level">{level}</span>
          <div>
            <b>
              {level < 4
                ? 'Apprentice'
                : level < 8
                  ? 'Sentinel'
                  : 'Incident captain'}
            </b>
            <small>{save.xp} XP <Help topic="xp" label="XP and levels" /> · BROWSER SAVE</small>
          </div>
        </div>
      </header>
      <nav className="topnav" aria-label="Game navigation">
        {[
          ['play', 'Operations', Activity],
          ['codex', 'Manual', BookOpen],
          ['mastery', 'Mastery & journal', Trophy],
          ['portfolio', 'Portfolio', BookOpen],
        ].map(([id, label, Icon]: any) => (
          <button
            key={id}
            className={view === id ? 'active' : ''}
            onClick={() => setView(id)}
          >
            <Icon size={17} />
            {label}
          </button>
        ))}
        <Help topic="navigation" label="Navigation" /><span role="status">{storage}</span>
      </nav>
      <div className="save-controls">
        <button className="casebook-button" aria-pressed={isProfile} onClick={onToggle}>
          {!isProfile && <span className="profile-beacon" aria-hidden="true" />}
          {isProfile?'Return to your progress':'View khanfarris profile'}
          {!isProfile && <ArrowRight size={17} aria-hidden="true" />}
        </button>
        <button
          onClick={() =>
            download(
              backupJSON(save),
              'shiftrun-backup.json',
              'application/json',
            )
          }
          disabled={!ready}
        >
          Download progress JSON
        </button>
        <Help topic="saving" label="Saving and profiles" />
      </div>
      <div className="profile-banner" role="status">{isProfile ? 'Viewing khanfarris · published work, read only. Browse incidents, debriefs, notes, and Portfolio. Your browser progress is kept separate.' : 'Your progress · editable, saved in this browser. Switch to the khanfarris profile to explore published work.'}</div>
      {view==='play'&&activeRun&&<>
          <div className="shiftbar">
            <ShiftDial wave={selectedWave||activeRun.wave} total={activeRun.mode==='Practice'?1:3} activeWave={activeRun.wave} completed={activeRun.cases.every(c=>c.closed)} mode={activeRun.mode} seed={activeRun.seed} readOnly={isProfile||past} onSelect={wave=>{setBrowsingWave(wave);setProfileSelection(0);setTab(wave<activeRun.wave||(isProfile&&wave===activeRun.wave&&activeRun.cases.every(c=>c.closed))?'debrief':'evidence');setHint(false);}} />
            {!locked&&run?<>
            <div className="stat">
              <small>CLIENT TRUST <Help topic="trust" label="Client trust" /></small>
              <b className={run.trust < 40 ? 'danger' : ''}>
                {legacyHistory?'—':run.trust}
                <span>/100</span>
              </b>
              <Progress value={legacyHistory?0:run.trust} aria-label={legacyHistory?"Historical client trust unavailable":"Client trust"} />
            </div>
            <div className="stat">
              <small>TURN <Help topic="turn" label="Turns" /></small>
              <b>{legacyHistory?'—':run.turn.toString().padStart(2, '0')}</b>
            </div>
            <div className="stat">
              <small>INTEL <Help topic="intel" label="Intel" /></small>
              <b>
                {legacyHistory?'—':run.credits} <span>◆</span>
              </b>
            </div>
            <div className="perk">
              <Shield size={18} />
              <span className="perk-name">{run.role}</span>
              <Help topic="specialty" label="Specialty perk" />
              <small>
                {run.upgrade === 'watch'
                  ? 'WATCHTOWER ACTIVE'
                  : 'CLASS PERK ACTIVE'}
              </small>
            </div>
            </>:<p className="shift-preview-caption">{locked?'A glimpse of your next assignment. Complete the previous shift to unlock evidence and response actions.':'Archived casework. This older save has no historical shift metrics.'}</p>}
          </div>
      </>}
      {view === 'play' && !activeRun && (
        <>
          <section className="intro">
            <div>
              <small className="eyebrow">
                TACTICAL CYBERSECURITY / SEASON 01
              </small>
              <h1>
                Your shift.
                <br />
                <em>Their lifeline.</em>
              </h1>
              <p className="lead">
                Three clients. A queue of uncertain signals.
                <br />
                Win with evidence, not a faster trigger finger.
              </p>
              <div className="start-actions">
                <button
                  disabled={!ready}
                  className="primary"
                  onClick={() => start()}
                >
                  Start {mode.toLowerCase()} shift <ChevronRight size={18} />
                </button>
                <button className="unavailable-trigger" aria-disabled="true" aria-label="Daily challenge" aria-describedby="daily-coming-soon">
                  Daily challenge <ArrowUpRight size={16} />
                  <span className="availability-tooltip" role="tooltip" id="daily-coming-soon">Coming soon!</span>
                </button>
              </div>
              <p className="meta">
                12 encounters per shift · No real-time countdown · Resume
                anytime
              </p>
            </div>
            <div className="mission-board panel">
              <div className="row">
                <small>LIVE EXERCISE / FICTIONAL CLIENTS</small>
                <span className="live">
                  <i /> READY
                </span>
              </div>
              <div className="board-core">
                <Shield size={48} />
                <strong>01</strong>
                <span>THE INVOICE</span>
              </div>
              <div className="board-nodes">
                {clients.map((cl, i) => (
                  <div key={cl.name}>
                    <span className={'node n' + i}>
                      {i === 0 ? (
                        <Fingerprint />
                      ) : i === 1 ? (
                        <Layers />
                      ) : (
                        <Radio />
                      )}
                    </span>
                    <b>{cl.name}</b>
                    <small>
                      {i === 0 ? 'IDENTITY SIGNAL' : 'AWAITING TRIAGE'}
                    </small>
                  </div>
                ))}
              </div>
              <div className="mission-foot">
                <Activity size={16} /> Read the signal. Protect the mission.
              </div>
            </div>
          </section>
          <section className="loadout">
            <div className="section-heading">
              <h2>Choose your specialty <Help topic="specialty" label="Specialties" /></h2>
              <small>ALL TOOLS AVAILABLE TO EVERY CLASS</small>
            </div>
            <RadioGroup
              className="roles"
              value={role}
              onValueChange={(v) => setRole(String(v))}
            >
              {roles.map(([name, line, perk, Icon]) => (
                <label
                  className={'role ' + (role === name ? 'selected' : '')}
                  key={name}
                >
                  <div className="row">
                    <Icon size={26} />
                    <RadioGroupItem value={name} />
                  </div>
                  <h3>{name}</h3>
                  <b>{line}</b>
                  <p>{perk}</p>
                </label>
              ))}
            </RadioGroup>
            <div className="setup">
              <Choices
                label="Challenge"
                value={mode}
                onChange={setMode}
                items={['Guided', 'Veteran', 'Practice']}
                unavailable={{ Veteran: 'Coming soon!' }}
              />
              {mode === 'Practice' && (
                <Choices
                  label="Practice focus"
                  value={focus}
                  onChange={setFocus}
                  items={['All', ...skills]}
                />
              )}
              <p>
                {mode === 'Guided'
                  ? 'Coach explanations and a fixed opening wave teach the loop. Later waves vary.'
                  : mode === 'Veteran'
                    ? 'Faster pressure, no automatic coaching. Stabilize the queue before finishing every detail.'
                    : 'One case with no pressure growth. Use the manual and repeat a skill.'}
              </p>
            </div>
          </section>
        </>
      )}
      {view === 'play' && run && c && s && (
        <>
          {!readOnly && run.phase==='reward' && <p className="profile-banner">Shift complete. <a href="#shift-reward">Continue to next shift →</a> Choose an upgrade or continue without one below.</p>}
          <div className="arena">
            <IncidentConstellation run={run} locked={locked} published={isProfile} onSelect={select}/>
            <section className="workspace panel">
              <div className="case-heading">
                <div className="row">
                  <small>
                    {clients[c.client].tag} / {s.host}
                  </small>
                  <span className="badge">{s.skill}</span>
                </div>
                <h2>{s.title}</h2>
                <p>{s.brief}</p>
                <div className="client-context">
                  <Radio size={16} />
                  {clients[c.client].impact}
                </div>
              </div>
              {sealed&&<div className="incident-lock-notice"><Lock size={15}/><span>{locked?'Locked assignment - complete the previous shift to begin.':'Unfinished in this published profile - preview only.'} Browse the tabs; evidence and answers unlock when playable.</span></div>}
              <Tabs value={tab} onValueChange={(v) => setTab(String(v))}>
                <TabsList className="case-tabs">
                  <TabsTrigger value="evidence">
                    01 Evidence <span>{c.reads.length}/3</span>
                  </TabsTrigger>
                  <TabsTrigger value="respond">02 Respond</TabsTrigger>
                  <TabsTrigger value="handoff">03 Handoff</TabsTrigger>
                  {c.closed && (
                    <TabsTrigger value="debrief">Debrief</TabsTrigger>
                  )}
                </TabsList>
                <TabsContent value="evidence">
                  <p className="tab-intro">
                    {sealed?'Preview the evidence sources below. Their contents unlock when this incident is playable.':'Open at least two sources before acting. Every new review costs a turn unless your class perk applies.'}
                  </p>
                  <div className="evidence-list">
                    {s.evidence.map((ev, i) => (
                      <article
                        className={
                          'evidence ' + (c.reads.includes(i) ? 'opened' : '')
                        }
                        key={ev.title}
                      >
                        <div className="row">
                          <div>
                            <small>{ev.tool.toUpperCase()} · SIMULATED</small>
                            <h3>{ev.title}</h3>
                          </div>
                          <button
                            disabled={sealed || readOnly || (c.closed && !c.reads.includes(i))}
                            onClick={() => update(readEvidence(run, i))}
                          >
                            {sealed?<><Lock size={14}/> Locked</>:c.reads.includes(i) ? (
                              <Check size={18} />
                            ) : (
                              <>
                                Review <ChevronRight size={15} />
                              </>
                            )}
                          </button>
                        </div>
                        {!sealed&&(c.reads.includes(i) || c.closed) && (
                          <>
                            <pre>{ev.body}</pre>
                            {(run.mode !== 'Veteran' || c.closed) && (
                              <p className="coach">
                                <BookOpen size={16} />
                                {ev.lesson}
                              </p>
                            )}
                          </>
                        )}
                      </article>
                    ))}
                  </div>
                  <button className="primary" onClick={() => setTab('respond')}>
                    Move to response <ChevronRight size={16} />
                  </button>
                </TabsContent>
                <TabsContent value="respond">
                  <p className="tab-intro">
                    {sealed?'Response choices are concealed until you can investigate this incident.':'Choose an action based on evidence. Sequence matters. Actions affect only this simulation.'}
                  </p>
                  {sealed?<LockedResponse />:<div className="action-grid">
                    {[...s.actions]
                      .sort((a, b) => {
                        const hash = (id: string) =>
                          [...id].reduce(
                            (v, k) => v + k.charCodeAt(0),
                            run.seed,
                          );
                        return (hash(a.id) % 7) - (hash(b.id) % 7);
                      })
                      .map((a) => (
                        <button
                          key={a.id}
                          className={
                            'action ' +
                            (c.done.includes(a.id) ? 'completed' : '')
                          }
                          disabled={readOnly || c.closed || c.done.includes(a.id)}
                          onClick={() => update(perform(run, a.id))}
                        >
                          <small>{a.tool}</small>
                          <b>{a.label}</b>
                          <span>
                            {c.done.includes(a.id) ? (
                              <>
                                <Check size={15} /> Completed
                              </>
                            ) : (
                              <>
                                Execute <ChevronRight size={15} />
                              </>
                            )}
                          </span>
                        </button>
                      ))}
                  </div>
                  }
                  {!sealed&&run.mode !== 'Veteran' && (
                    <>
                      <button
                        className="text-button"
                        onClick={() => setHint(!hint)}
                      >
                        <BookOpen size={16} />
                        {hint ? 'Hide coaching' : 'Ask your mentor'}
                      </button>
                      {hint && (
                        <div className="coach">
                          {s.lesson}
                          <br />
                          Recommended order:{' '}
                          {s.actions
                            .filter((a) => !a.bad)
                            .map((a) => a.label)
                            .join(' → ')}
                        </div>
                      )}
                    </>
                  )}
                  <button className="primary" onClick={() => setTab('handoff')}>
                    Prepare handoff <ChevronRight size={16} />
                  </button>
                </TabsContent>
                <TabsContent value="handoff">
                  <p className="tab-intro">
                    {sealed?'Your assessment and analyst notes will appear here when you work this incident.':'Commit your assessment. Closing early is allowed, but missed evidence and response steps reduce your score.'}
                  </p>
                  {sealed?<LockedHandoff/>:c.closed || readOnly ? (
                    <div className="coach">
                      {c.closed ? 'This case is closed. Open the debrief to review the recorded decisions.' : 'This incident was not completed in the published snapshot.'}
                    </div>
                  ) : (
                    <>
                      <Choices
                        label="What does the evidence establish?"
                        value={disposition}
                        onChange={(v) => {
                          setDisposition(v);
                          draft('disposition', v);
                        }}
                        items={[
                          'Confirmed compromise',
                          'Benign activity',
                          'Configuration risk',
                          'Documentation gap',
                        ]}
                      />
                      <fieldset>
                        <legend>
                          Choose the most defensible client update
                        </legend>
                        <RadioGroup
                          value={comms}
                          onValueChange={(v) => {
                            setComms(String(v));
                            draft('comms', String(v));
                          }}
                          className="comms"
                        >
                          {updateOrder(c.id).map(index=>{const v=String(index+1),text=clientUpdates(c,s.actions.filter(a=>!a.bad).map(a=>a.id))[index].text;return (
                            <label
                              key={v}
                              className={
                                'choice ' + (comms === v ? 'chosen' : '')
                              }
                            >
                              <RadioGroupItem value={v} />
                              <span>{text}</span>
                            </label>
                          );})}
                        </RadioGroup>
                      </fieldset>
                      <label className="note-label" htmlFor="case-note">
                        Your analyst notes{' '}
                        <small>
                          Optional · self-reviewed, not automatically graded
                        </small>
                      </label>
                      <textarea
                        id="case-note"
                        value={note}
                        onChange={(e) => {
                          setNote(e.target.value);
                          draft('note', e.target.value);
                        }}
                        placeholder="timeline > affected assets > evidence > actions and results > unknowns > next owner / further updates"
                        rows={5}
                        maxLength={6000}
                      />
                      <button
                        className="primary"
                        disabled={!disposition || !comms}
                        onClick={submit}
                      >
                        Commit assessment & reveal debrief <Check size={16} />
                      </button>
                    </>
                  )}
                </TabsContent>
                <TabsContent value="debrief">
                  {c.closed && (
                    <div className="debrief">
                      <div className="score-row">
                        <div className="score-orb">
                          {c.score}
                          <small>/ 100</small>
                        </div>
                        <div>
                          <small>
                            {c.score >= 85
                              ? 'EXCELLENT JUDGMENT'
                              : c.score >= 60
                                ? 'GOOD FOUNDATION'
                                : 'REVIEW & RETRY'}
                          </small>
                          <h2>{s.truth}</h2>
                          <p>
                            You chose: {c.result}. +{c.score} XP
                          </p>
                        </div>
                      </div>
                      <p className="lesson">{s.lesson}</p>
                      {(!legacyHistory||save.records.find(r=>r.id===c.id)?.detail)?<ScoreExplanation incident={c} />:<p>Only the final score was retained in this older record; detailed scoring is unavailable.</p>}
                      {readOnly && save.records.find(r=>r.id===c.id)?.provenance?.includes('corrected') && <p className="coach">{save.records.find(r=>r.id===c.id)?.provenance}</p>}
                      <section className="recorded-client-update"><h3>Recorded client update</h3><p>{c.clientUpdate||'This older record did not retain the exact update text.'}</p>{c.clientUpdateWhy&&<p className="coach">{c.communication===15?'Why it earned 15/15: ':'Why it missed the 15 points: '}{c.clientUpdateWhy}</p>}{c.communication!==15&&<><h3>Recommended update</h3><p>{clientUpdates(c,s.actions.filter(a=>!a.bad).map(a=>a.id))[0].text}</p></>}</section>
                      <h3>Response walkthrough</h3>
                      {s.actions.map((a) => (
                        <div className="walkthrough" key={a.id}>
                          <span>
                            {a.bad ? '!' : c.done.includes(a.id) ? '✓' : '○'}
                          </span>
                          <div>
                            <b>{a.label}</b>
                            <p>{a.why}</p>
                            {!a.bad && !c.done.includes(a.id) && (
                              <small>MISSED RESPONSE STEP</small>
                            )}
                          </div>
                        </div>
                      ))}
                      <section className="analyst-notes"><h3>Analyst notes</h3><pre style={{whiteSpace: 'pre-wrap', overflowWrap: 'anywhere'}}>{c.notes || 'No analyst notes recorded for this incident.'}</pre></section><a
                        target="_blank"
                        rel="noreferrer"
                        href={sources[s.source][1]}
                      >
                        {sources[s.source][0]} <ArrowUpRight size={15} />
                      </a>
                      {run.cases.some((x) => !x.closed) && (
                        <button
                          className="primary"
                          onClick={() =>
                            select(run.cases.findIndex((x) => !x.closed))
                          }
                        >
                          Next open case <ChevronRight size={16} />
                        </button>
                      )}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </section>
            <aside className="feed">
              <small>OPERATIONS LOG</small>
              <div className="feed-head">
                <span className="live">
                  <i /> TURN BASED
                </span>
                <Terminal size={18} />
              </div>
              <div aria-live="polite" aria-atomic="true" className="latest">
                {locked?'This assignment has not started. Previewing its queue uses no turns and changes no progress.':run.log[0]}
              </div>
              {!locked&&run.log.slice(1, 5).map((line, i) => (
                <p key={i}>{line}</p>
              ))}
              <div className="score-guide">
                <Crosshair size={21} />
                <h3>Win condition <Help topic="win" label="Win condition" /></h3>
                <p>
                  Finish the shift with 70+ trust and an average case score of
                  80+. You can always continue learning after a loss.
                </p>
                <small>GAME RULES ≠ REAL INCIDENT SLAs</small>
              </div>
            </aside>
          </div>
          {!readOnly && run.phase !== 'play' && (
            <section className="reward panel" id="shift-reward">
              <div>
                <small>
                  {run.phase === 'finished'
                    ? 'SHIFT COMPLETE'
                    : 'WAVE CLEARED / RESUPPLY'}
                </small>
                <h2>
                  {run.phase === 'finished'
                    ? run.trust >= 70 &&
                      run.totalScore / Math.max(1, run.totalClosed) >= 80
                      ? 'Mission protected.'
                      : 'Every shift teaches something.'
                    : 'Choose your next advantage.'}
                </h2>
                <p>
                  Average:{' '}
                  {Math.round(run.totalScore / Math.max(1, run.totalClosed))}
                  /100 · Trust: {run.trust}/100 · {run.credits} intel earned
                  this shift
                </p>
              </div>
              {run.phase === 'reward' ? (
                <div className="reward-buttons">
                  <button
                    disabled={run.credits < 6}
                    onClick={() => nextWave('watch')}
                  >
                    <Activity /> Watchtower{' '}
                    <small>6 intel · pressure grows 1 slower next wave</small>
                  </button>
                  <button
                    disabled={run.credits < 6}
                    onClick={() => nextWave('restore')}
                  >
                    <Radio /> Client liaison{' '}
                    <small>6 intel · restore 25 trust</small>
                  </button>
                  <button
                    onClick={() => {
                      setBrowsingWave(null);
                      const next = newRun(
                        run.seed,
                        run.mode,
                        run.role,
                        'All',
                        run.wave + 1,
                        queues,
                      );
                      update({
                        ...next,
                        trust: run.trust,
                        totalScore: run.totalScore,
                        totalClosed: run.totalClosed,
                        credits: run.credits,
                        upgrade: run.upgrade,
                      });
                      setTab('evidence');
                      setDisposition('');
                      setComms('');
                      setNote('');
                    }}
                  >
                    Continue without upgrade <ChevronRight />
                  </button>
                </div>
              ) : (
                <button
                  className="primary"
                  onClick={() => {
                    setSave((prev) => ({ ...prev, run: null, shiftHistory:prev.run?keepShift(prev.shiftHistory,prev.run):prev.shiftHistory }));
                    setBrowsingWave(null);
                    setTab('evidence');
                  }}
                >
                  Return to loadout <ChevronRight size={16} />
                </button>
              )}
            </section>
          )}
        </>
      )}
      {view === 'mastery' && (
        <section className="library">
          <div className="section-heading">
            <div>
              <small>YOUR TRAINING RECORD</small>
              <h1>Build your judgment.</h1>
              <p>
                Scores measure performance in these exercises, not professional
                certification or hiring readiness.
              </p>
            </div>
            <button disabled={!save.records.length} onClick={exportNotes}>
              <Download size={17} /> Export journal
            </button>
          </div>
          <div className="mastery-grid">
            {skills.map((skill) => {
              const records = save.records.filter(
                  (r) =>
                    scenarios.find((s) => s.id === r.template)?.skill === skill,
                ),
                recent = records.slice(0, 8),
                avg = recent.length
                  ? Math.round(
                      recent.reduce((a, r) => a + r.score, 0) / recent.length,
                    )
                  : 0;
              return (
                <article className="panel" key={skill}>
                  <div className="row">
                    <h3>{skill}</h3>
                    <span className="mastery-number">
                      {avg}
                      <small>/100</small>
                    </span>
                  </div>
                  <Progress
                    value={avg}
                    aria-label={`${skill} recent performance`}
                  />
                  <p>
                    {records.length} completed · latest {recent.length} case
                    average
                  </p>
                  <button
                    onClick={() => {
                      update(
                        newRun(
                          Math.floor(Math.random() * 1000000),
                          'Practice',
                          role,
                          skill,
                        ),
                      );
                      setView('play');
                      setTab('evidence');
                      setDisposition('');
                      setComms('');
                      setNote('');
                    }}
                  >
                    Practice {skill.toLowerCase()} <ChevronRight size={15} />
                  </button>
                </article>
              );
            })}
          </div>
          <h2>Recent investigations</h2>
          {!save.records.length ? (
            <p>Finish your first case to begin your journal.</p>
          ) : (
            save.records.slice(0, 15).map((r) => (
              <details className="journal" key={r.id}>
                <summary>
                  <span>
                    {scenarios.find((s) => s.id === r.template)?.title}
                  </span>
                  <b>{r.score}/100</b>
                </summary>
                <p>{scenarios.find((s) => s.id === r.template)?.lesson}</p>
                <pre>
                  {r.note || 'No personal notes saved for this encounter.'}
                </pre>
              </details>
            ))
          )}
        </section>
      )}
      {view === 'codex' && (
        <section className="library">
          <small>MANUAL / READ BETWEEN ENCOUNTERS</small>
          <h1>Learn the work.</h1>
          <div className="manual-intro panel">
            <BookOpen size={30} />
            <div>
              <h2>Built with a specific scope</h2>
              <p>
                Shiftrun aims to simulate content found in KnowBe4,
                SentinelOne, Blackpoint MDR and Timus, plus Microsoft 365,
                Entra, Defender and Intune. This independent game uses fictional
                clients and simplified workflows based on public documentation.
              </p>
              <p>
                It is not affiliated with any employer or the named vendors,
                does not reproduce their exact consoles, and does not establish
                their internal procedures. Confirm actual permissions,
                licensing, escalation rules and tool behavior in authorized
                hands-on labs.
              </p>
            </div>
          </div>
          <article className="how-to-play panel" aria-labelledby="how-to-play-heading">
            <header className="play-guide-heading">
              <div>
                <small>THE LOOP / FROM ALERT TO DEBRIEF</small>
                <h2 id="how-to-play-heading">How to play</h2>
              </div>
              <p><Clock size={18} aria-hidden="true" /> Take your time. The game moves when you act, not while you read.</p>
            </header>
            <div className="play-guide-grid">
              <section className="play-workflow" aria-labelledby="play-workflow-heading">
                <h3 id="play-workflow-heading">Work through an incident</h3>
                <ol className="play-steps">
                  <li>
                    <h4>Choose your pace, then open a case.</h4>
                    <p>Guided includes coaching. Practice lets you work on one incident without advancing turns or pressure. Veteran is coming soon. Choose a specialty for its perk, then select an incident circle on the left.</p>
                  </li>
                  <li>
                    <h4>Evidence: find out what happened.</h4>
                    <p>Open the evidence sources and compare what they show. Review at least two before responding; read all of them for full evidence points. You can reopen reviewed evidence for free.</p>
                  </li>
                  <li>
                    <h4>Respond: choose actions the evidence supports.</h4>
                    <p>Some choices are unsafe. Some useful actions must happen in order. Stabilize urgent cases to stop their pressure growing, then finish the response and verify the result.</p>
                  </li>
                  <li>
                    <h4>Handoff: record your assessment.</h4>
                    <p>Choose what the evidence establishes and a client update that matches this incident. Add analyst notes to explain your reasoning, then commit. Notes are saved but are not graded.</p>
                  </li>
                  <li>
                    <h4>Debrief: learn from your decisions.</h4>
                    <p>See your score, why points were awarded or missed, and the response walkthrough. Then select another open incident. You can switch between incidents while working.</p>
                  </li>
                </ol>
              </section>
              <section className="play-mechanics" aria-labelledby="play-mechanics-heading">
                <h3 id="play-mechanics-heading">Read the shift</h3>
                <div className="play-mechanic">
                  <h4>Turn <Help topic="turn" label="turns" /></h4>
                  <p>Your action counter. Reviewing new evidence or attempting a response normally uses one turn. Reading, writing notes and switching views are free. Specialty perks can make certain actions free too.</p>
                </div>
                <div className="play-mechanic">
                  <h4>Pressure <Help topic="pressure" label="incident pressure" /></h4>
                  <p>How urgent each incident has become, shown by its number and circular ring. Turns raise pressure on open, unstabilized cases. At <strong>85% or more</strong>, each of those cases costs <strong>2 trust per turn</strong>.</p>
                  <p className="play-mechanic-tip">A successful stabilizing action lowers that case’s pressure by 25 points and stops further growth.</p>
                </div>
                <div className="play-mechanic">
                  <h4>Client trust <Help topic="trust" label="client trust" /></h4>
                  <p>The impact of your decisions on the client. It starts at 100 for a new run and carries into the next shift. Mistakes, poor client updates and neglected high-pressure incidents reduce it. Trust is separate from your incident score.</p>
                </div>
                <div className="play-mechanic">
                  <h4>Intel &amp; XP <Help topic="intel" label="intel" /></h4>
                  <p>Completed incidents earn both. Intel buys upgrades between shifts: 100 points earns 5 intel. XP tracks your overall progress and raises your level; it is not spent.</p>
                </div>
                <p className="play-specialty-note"><strong>Your specialty changes perks, not the incidents or correct answers.</strong> Investigator saves an evidence turn, Responder saves stabilization turns, and Communicator softens trust losses from response mistakes. <Help topic="specialty" label="specialty perks" /></p>
              </section>
            </div>
            <div className="play-guide-finish">
              <ArrowRight size={23} aria-hidden="true" />
              <div>
                <h3>All four incidents closed? Move to the next shift.</h3>
                <p>Guided and Veteran each have three shifts. Follow <strong>Continue to next shift</strong> to the upgrade panel below the incidents. Spend intel on an upgrade or choose <strong>Continue without upgrade</strong>. Aim to finish the run with at least 70 trust and an average score of 80. You can keep learning if you miss the target.</p>
                <p>Hover or tap the large shift number to browse. Completed shifts are read only; future shifts stay locked until you reach them. Browsing never spends a turn.</p>
              </div>
            </div>
            <p className="play-guide-footnote">Your work saves automatically in this browser. Download progress JSON makes a portable backup. The two-source rule and pressure system are game rules; follow the authorized response plan in real incidents.</p>
          </article>
          <h2>Role-to-practice map</h2>
          <div className="manual-grid">
            {skills.map((skill) => (
              <article className="panel" key={skill}>
                <h3>{skill}</h3>
                {scenarios
                  .filter((s) => s.skill === skill)
                  .map((s) => (
                    <details className="manual-case" key={s.id}>
                      <summary>{s.title}</summary>
                      <p>{s.lesson}</p>
                      
                      <a
                        href={sources[s.source][1]}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Read supporting material <ArrowUpRight size={14} />
                      </a>
                    </details>
                  ))}
              </article>
            ))}
          </div>
          <h2>Tool vocabulary</h2>
          <div className="manual-grid">
            <article className="panel">
              <h3>Investigate & respond</h3>
              <p>
                <b>EDR:</b> endpoint detection and response. Review process
                trees, scope affected hosts, and verify containment.
              </p>
              <p>
                <b>MDR:</b> managed detection and response. Coordinate with the
                provider’s analysts; verify what they already did.
              </p>
              <p>
                <b>BEC:</b> business email compromise. Investigate identity,
                mail persistence, recipients and financial impact.
              </p>
              <p>
                <b>SIEM:</b> correlates security events. A detection is a lead
                requiring context, not proof by itself.
              </p>
            </article>
            <article className="panel">
              <h3>Access & hardening</h3>
              <p>
                <b>ZTNA / SASE:</b> resource access informed by identity, device
                posture and policy.
              </p>
              <p>
                <b>Entra:</b> identity and access; <b>Intune:</b> device
                management/compliance; <b>Defender:</b> Microsoft security
                capabilities that vary by license.
              </p>
              <p>
                <b>DNS / DHCP:</b> name resolution and automatic network
                configuration. Test the failing layer.
              </p>
              <p>
                <b>CVSS / KEV:</b> severity score and known exploitation
                evidence. Combine with exposure and business importance.
              </p>
            </article>
          </div>
          <h2>Research & sources</h2>
          <p>
            Procedures may evolve.
            Vendor sources support concepts; case outcomes and scoring are
            authored training exercises.
          </p>
          <div className="source-list">
            {sources.map(([title, url]) => (
              <a href={url} key={url} target="_blank" rel="noreferrer">
                {title}
                <ArrowUpRight size={16} />
              </a>
            ))}
          </div>
        </section>
      )}
      {view === 'portfolio' && (
        <Portfolio save={save} setSave={setSave} status={storage} readOnly={isProfile} />
      )}
      <footer>
        <span>SHIFTRUN / ANALYST GUILD</span>
        <span>
          Fictional incidents. Real reasoning. Independent training simulation.
        </span>
      </footer>
    </main>
  );
}





'use client';
import { useState, useEffect, useRef } from 'react';
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
  Layers,
  Clock,
  Download,
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
import { useProgress } from './use-progress';
import {
  backupJSON,
  parseBackup,
  mergeSaves,
  portfolioHTML,
  download,
  scoreDetails,
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
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  items: string[];
}) {
  return (
    <fieldset>
      <legend>{label}</legend>
      <RadioGroup
        className="choices"
        value={value}
        onValueChange={(v) => onChange(String(v))}
      >
        {items.map((item) => (
          <label
            className={value === item ? 'choice chosen' : 'choice'}
            key={item}
          >
            <RadioGroupItem value={item} />
            <span>{item}</span>
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
      <h3>How your score was calculated</h3>
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
        Only recorded choices affect the score. Personal notes and recap
        responses remain self-reviewed.
      </p>
    </section>
  );
}
export default function Home() {
  const { save, setSave, ready, status: storage } = useProgress();
  const [view, setView] = useState('play'),
    [mode, setMode] = useState('Guided'),
    [role, setRole] = useState('Investigator'),
    [focus, setFocus] = useState('All'),
    [tab, setTab] = useState('evidence'),
    [disposition, setDisposition] = useState(''),
    [comms, setComms] = useState(''),
    [note, setNote] = useState(''),
    [hint, setHint] = useState(false),
    [recap, setRecap] = useState('');
  const saveRef = useRef(save);
  saveRef.current = save;
  useEffect(() => {
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
  const run = save.run,
    c = run?.cases[run.selected],
    s = c ? template(c) : null;
  const level = Math.floor(save.xp / 350) + 1;
  useEffect(() => {
    const d = c ? save.drafts?.[c.id] : null;
    setNote(d?.note || '');
    setRecap(d?.recap || '');
    setDisposition(d?.disposition || '');
    setComms(d?.comms || '');
  }, [c?.id, ready]);
  function draft(key: string, value: string) {
    if (!c) return;
    setSave((prev) => ({
      ...prev,
      drafts: {
        ...prev.drafts,
        [c.id]: { ...prev.drafts?.[c.id], [key]: value },
      },
    }));
  }
  function update(next: Run) {
    setSave((prev) => ({ ...prev, run: next }));
  }
  function start(daily = false) {
    const seed = daily
      ? Number(new Date().toISOString().slice(0, 10).replaceAll('-', ''))
      : Math.floor(Math.random() * 1000000);
    update(newRun(seed, daily ? 'Veteran' : mode, role, focus));
    setView('play');
    setTab('evidence');
  }
  function select(index: number) {
    if (!run) return;
    update({ ...run, selected: index });
    setTab('evidence');
    setHint(false);
    const d = save.drafts?.[run.cases[index].id];
    setDisposition(d?.disposition || '');
    setComms(d?.comms || '');
    setNote(d?.note || '');
    setRecap(d?.recap || '');
  }
  function submit() {
    if (!run || !c || !s || !disposition || !comms || c.closed) return;
    const next = closeCase(run, disposition, Number(comms) - 1, note);
    const closed = next.cases[next.selected];
    setSave((prev) => ({
      ...prev,
      run: next,
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
    if (!run) return;
    const next = newRun(run.seed, run.mode, run.role, 'All', run.wave + 1);
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
      'SHIFTFALL — Personal training journal',
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
    a.download = 'shiftfall-training-journal.txt';
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return (
    <main className="shell">
      <header>
        <button className="brand brand-button" onClick={() => setView('play')}>
          <Shield size={25} /> SHIFTFALL
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
            <small>{save.xp} XP · BROWSER SAVE</small>
          </div>
        </div>
      </header>
      <nav className="topnav" aria-label="Game navigation">
        {[
          ['play', 'Operations', Activity],
          ['mastery', 'Mastery & journal', Trophy],
          ['codex', 'Field manual', BookOpen],
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
        <span role="status">{storage}</span>
      </nav>
      <div className="save-controls">
        <a className="casebook-button" href="casebook.html">Explore the khanfarris casebook</a>
        <button
          onClick={() =>
            download(
              backupJSON(save),
              'shiftfall-backup.json',
              'application/json',
            )
          }
          disabled={!ready}
        >
          Download progress JSON
        </button>
      </div>
      {view === 'play' && !run && (
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
                <button disabled={!ready} onClick={() => start(true)}>
                  Daily challenge <ArrowUpRight size={16} />
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
              <h2>Choose your specialty</h2>
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
                    : 'One case with no pressure growth. Use the field manual and repeat a skill.'}
              </p>
            </div>
          </section>
        </>
      )}
      {view === 'play' && run && c && s && (
        <>
          <div className="shiftbar">
            <div>
              <small>
                {run.mode.toUpperCase()} / SEED {run.seed}
              </small>
              <h2>
                Shift {String(run.wave).padStart(2, '0')}{' '}
                <span>/ {run.mode === 'Practice' ? '01' : '03'}</span>
              </h2>
            </div>
            <div className="stat">
              <small>CLIENT TRUST</small>
              <b className={run.trust < 40 ? 'danger' : ''}>
                {run.trust}
                <span>/100</span>
              </b>
              <Progress value={run.trust} aria-label="Client trust" />
            </div>
            <div className="stat">
              <small>TURN</small>
              <b>{run.turn.toString().padStart(2, '0')}</b>
            </div>
            <div className="stat">
              <small>INTEL</small>
              <b>
                {run.credits} <span>◆</span>
              </b>
            </div>
            <div className="perk">
              <Shield size={18} />
              {run.role}
              <small>
                {run.upgrade === 'watch'
                  ? 'WATCHTOWER ACTIVE'
                  : 'CLASS PERK ACTIVE'}
              </small>
            </div>
          </div>
          <div className="arena">
            <aside className="queue">
              <div className="section-heading">
                <h3>Incident queue</h3>
                <small>{run.cases.filter((x) => !x.closed).length} OPEN</small>
              </div>
              {run.cases.map((x, i) => {
                const t = template(x),
                  stable = x.done.some(
                    (id) => t.actions.find((a) => a.id === id)?.contain,
                  );
                return (
                  <button
                    className={
                      'ticket ' + (i === run.selected ? 'selected' : '')
                    }
                    key={x.id}
                    onClick={() => select(i)}
                  >
                    <div className="row">
                      <span className={'severity ' + t.severity.toLowerCase()}>
                        {x.closed ? 'CLOSED' : t.severity.toUpperCase()}
                      </span>
                      <span>
                        {x.closed ? (
                          <Check size={16} />
                        ) : (
                          String(i + 1).padStart(2, '0')
                        )}
                      </span>
                    </div>
                    <b>{t.title}</b>
                    <span>{clients[x.client].name}</span>
                    <div className="row">
                      <small>{t.skill}</small>
                      <small>
                        {x.closed
                          ? x.score + '/100'
                          : stable
                            ? 'STABILIZED'
                            : x.pressure + '% PRESSURE'}
                      </small>
                    </div>
                    <Progress
                      value={x.closed ? 100 : x.pressure}
                      aria-label={`${t.title} pressure`}
                    />
                  </button>
                );
              })}
              <div className="queue-tip">
                <Clock size={18} />
                <p>
                  Time advances only on actions. Unstabilized cases gain
                  pressure. At 85%, each costs 2 trust per turn.
                </p>
              </div>
            </aside>
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
                    Open at least two sources before acting. Every new review
                    costs a turn unless your class perk applies.
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
                            disabled={c.closed && !c.reads.includes(i)}
                            onClick={() => update(readEvidence(run, i))}
                          >
                            {c.reads.includes(i) ? (
                              <Check size={18} />
                            ) : (
                              <>
                                Review <ChevronRight size={15} />
                              </>
                            )}
                          </button>
                        </div>
                        {(c.reads.includes(i) || c.closed) && (
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
                    Choose an action based on evidence. Sequence matters.
                    Actions affect only this simulation.
                  </p>
                  <div className="action-grid">
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
                          disabled={c.closed || c.done.includes(a.id)}
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
                  {run.mode !== 'Veteran' && (
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
                    Commit your assessment. Closing early is allowed, but missed
                    evidence and response steps reduce your score.
                  </p>
                  {c.closed ? (
                    <div className="coach">
                      This case is closed. Open the debrief to review your
                      decisions.
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
                          {[
                            [
                              '2',
                              'Everything is safe. No information was exposed. You can close this ticket.',
                            ],
                            [
                              '1',
                              'We are reviewing the evidence and documenting the confirmed scope and actions. We will coordinate any remaining validation and provide the next update in 30 minutes.',
                            ],
                            [
                              '3',
                              'This happened because someone made a careless mistake. Please stop opening tickets.',
                            ],
                          ].map(([v, text]) => (
                            <label
                              key={v}
                              className={
                                'choice ' + (comms === v ? 'chosen' : '')
                              }
                            >
                              <RadioGroupItem value={v} />
                              <span>{text}</span>
                            </label>
                          ))}
                        </RadioGroup>
                      </fieldset>
                      <label className="note-label" htmlFor="case-note">
                        Your analyst notes / recap practice{' '}
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
                        placeholder="UTC timeline → affected assets → evidence → actions and results → unknowns → next owner and update"
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
                      <ScoreExplanation incident={c} />
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
                      <section className="analyst-notes"><h3>Analyst notes</h3><pre style={{whiteSpace: 'pre-wrap', overflowWrap: 'anywhere'}}>{c.notes || 'No analyst notes recorded for this incident.'}</pre></section><div className="recap">
                        <small>RECAP REP / SAY IT OUT LOUD</small>
                        <h3>{s.recap}</h3>
                        <textarea
                          aria-label="Recap response"
                          rows={3}
                          value={recap}
                          onChange={(e) => {
                            setRecap(e.target.value);
                            draft('recap', e.target.value);
                          }}
                          placeholder="Explain your reasoning clearly: cite evidence, actions, unknowns, and validation."
                        />
                        <button
                          onClick={() => {
                            setSave((prev) => ({
                              ...prev,
                              records: prev.records.map((r) =>
                                r.id === c.id
                                  ? {
                                      ...r,
                                      note: [r.note, recap]
                                        .filter(Boolean)
                                        .join('\nRecap: '),
                                    }
                                  : r,
                              ),
                            }));
                            setRecap('');
                            draft('recap', '');
                          }}
                          disabled={!recap.trim()}
                        >
                          Save response to journal
                        </button>
                        <p>
                          Self-check: cite two observations, justify a scoped
                          action, state what is still unknown, and describe
                          validation.
                        </p>
                      </div>
                      <a
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
                {run.log[0]}
              </div>
              {run.log.slice(1, 5).map((line, i) => (
                <p key={i}>{line}</p>
              ))}
              <div className="score-guide">
                <Crosshair size={21} />
                <h3>Win condition</h3>
                <p>
                  Finish the shift with 70+ trust and an average case score of
                  80+. You can always continue learning after a loss.
                </p>
                <small>GAME RULES ≠ REAL INCIDENT SLAs</small>
              </div>
            </aside>
          </div>
          {run.phase !== 'play' && (
            <section className="reward panel">
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
                      const next = newRun(
                        run.seed,
                        run.mode,
                        run.role,
                        'All',
                        run.wave + 1,
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
                    setSave((prev) => ({ ...prev, run: null }));
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
          <small>FIELD MANUAL / READ BETWEEN ENCOUNTERS</small>
          <h1>Learn the work.</h1>
          <div className="manual-intro panel">
            <BookOpen size={30} />
            <div>
              <h2>Built for the role in your posting</h2>
              <p>
                Your supplied Cybersecurity Analyst posting names KnowBe4,
                SentinelOne, Blackpoint MDR and Timus, plus Microsoft 365,
                Entra, Defender and Intune. This independent game uses fictional
                clients and simplified workflows based on those responsibilities
                and public documentation.
              </p>
              <p>
                It is not affiliated with any employer or the named vendors,
                does not reproduce their exact consoles, and does not establish
                their internal procedures. Confirm actual permissions,
                licensing, escalation rules and tool behavior in authorized
                hands-on labs. The live job listing could not be verified; the
                attachment is the role specification.
              </p>
            </div>
          </div>
          <div className="manual-grid">
            <article className="panel">
              <h3>How to play</h3>
              <ol>
                <li>Pick a class and enter a shift.</li>
                <li>Read evidence, then stabilize the urgent cases.</li>
                <li>Complete scoped response and validation.</li>
                <li>Classify the case and choose a client update.</li>
                <li>
                  Review the debrief and practice explaining your decision.
                </li>
              </ol>
              <p>
                New evidence and response actions advance pressure. Re-reading,
                navigation, writing and reading the manual are free. Practice
                mode removes pressure growth. Two evidence reviews before
                actions is a teaching rule; real incidents can require immediate
                authorized containment.
              </p>
            </article>
            <article className="panel">
              <h3>Your training plan</h3>
              <ol>
                <li>Complete Guided with the Investigator specialty.</li>
                <li>Practice your lowest-scoring skill without pressure.</li>
                <li>Replay Veteran with a different specialty.</li>
                <li>Do the daily seeded challenge to compare your choices.</li>
                <li>Export your journal and rehearse the recap prompts.</li>
              </ol>
              <p>
                Daily challenges use the UTC date, selected class, and the same
                starting seed. Cases come from 14 authored scenarios; queue
                order and client assignment vary. Evidence within each scenario
                is fixed.
              </p>
            </article>
          </div>
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
                      <p>
                        <b>Recap:</b> {s.recap}
                      </p>
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
            Public sources consulted September 6, 2026. Procedures may evolve.
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
        <Portfolio save={save} setSave={setSave} status={storage} />
      )}
      <footer>
        <span>SHIFTFALL / ANALYST GUILD</span>
        <span>
          Fictional incidents. Real reasoning. Independent training simulation.
        </span>
      </footer>
    </main>
  );
}



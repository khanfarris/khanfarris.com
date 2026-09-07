'use client';
import { useState, type Dispatch, type SetStateAction } from 'react';
import { scenarios, skills, clients } from './game';
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
export default function Portfolio({
  save,
  setSave,
  status,
  readOnly=false,
}: {
  save: Save;
  setSave: Dispatch<SetStateAction<Save>>;
  status: string;
  readOnly?: boolean;
}) {
  const [backup, setBackup] = useState(''),
    [message, setMessage] = useState('');
  const unique = new Set(save.records.map((r) => r.template));
  return (
    <section className="library">
      <small>{readOnly?'KHANFARRIS / PUBLISHED TRAINING PROFILE':'MY CYBERSECURITY TRAINING PORTFOLIO'}</small>
      <h1>{readOnly?'Explore the recorded work.':'Show your reasoning.'}</h1>
      <p>
        Keep a durable record of the work you did, the evidence you reviewed,
        and how you explained your decisions.
      </p>
      <div className="panel portfolio-status">
        <h2>
          {unique.size} / {scenarios.length} scenario types practiced
        </h2>
        <p>
          {save.records.length} completed encounters · {save.xp} XP
        </p>
        <p role="status">{status}</p>
        {readOnly && <p className="published-summary">Published snapshot of Farris Khan’s completed simulations. Scores, notes, and responses are available below. Switch back to your progress to play.</p>}
        <p>
          Progress saves in this browser. Closing and reopening it keeps your work, but clearing browser data or switching devices can lose access. Download a full backup after each session. When ready, provide that backup to publish your read-only casebook on khanfarris.com.
        </p>
        <div className="start-actions">
          <button
            className="primary"
            disabled={!save.records.length}
            onClick={() =>
              download(
                portfolioHTML(save),
                'shiftrun-recap-portfolio.html',
                'text/html',
              )
            }
          >
            Download recap portfolio
          </button>
          <button
            onClick={() =>
              download(
                backupJSON(save),
                'shiftrun-backup.json',
                'application/json',
              )
            }
          >
            Download full progress backup
          </button>
        </div>
        <p className="meta">
          The portfolio is a standalone, read-only HTML file you can share or
          open during a recap. It includes scores, saved notes and recorded
          response details. Your unpublished progress stays in your browser.
        </p>
      </div>
      <div className="mastery-grid">
        {skills.map((skill) => {
          const total = scenarios.filter((s) => s.skill === skill),
            count = total.filter((s) => unique.has(s.id)).length;
          return (
            <div className="panel" key={skill}>
              <h3>{skill}</h3>
              <p>
                {count}/{total.length} scenario types practiced
              </p>
            </div>
          );
        })}
      </div>
      <div className="panel">
        <h2>Your completed work</h2>
        <p>
          These are self-directed simulations, not real client incidents or
          independently certified experience. Notes and recap answers are
          self-authored and ungraded.
        </p>
        {save.records.length === 0 ? (
          <p>No completed encounters have been saved yet.</p>
        ) : (
          save.records.map((r) => {
            const s = scenarios.find((s) => s.id === r.template)!;
            return (
              <details className="journal" key={r.id}>
                <summary>
                  <span>{s.title}</span>
                  <b>{r.score}/100</b>
                </summary>
                <p>
                  {r.completedAt
                    ? new Date(r.completedAt).toLocaleString()
                    : 'Completion timestamp not recorded'}{' '}
                  · {r.mode || 'Legacy exercise'}
                </p>
                <small>{r.provenance || 'Recorded in the training game'}</small>
                {r.detail && (
                  <>
                    {(() => {
                      const score = scoreDetails(r.detail);
                      return (
                        <>
                          <h3>How the score was calculated</h3>
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
                          <h3>
                            {score.total === 100
                              ? 'What went right'
                              : 'How to improve'}
                          </h3>
                          <ul className="improvement-list">
                            {improvementTips(r.detail).map((tip) => (
                              <li key={tip}>{tip}</li>
                            ))}
                          </ul>
                        </>
                      );
                    })()}
                    <p>
                      Client: {clients[r.detail.client]?.name} ·{' '}
                      {r.detail.reads.length}/3 evidence sources reviewed
                    </p>
                    <p>Assessment: {r.detail.result}</p>
                    <ul>
                      {r.detail.done.map((id) => (
                        <li key={id}>
                          {s.actions.find((a) => a.id === id)?.label}
                        </li>
                      ))}
                    </ul>
                  </>
                )}
                <pre>
                  {r.note || 'No personal notes saved for this encounter.'}
                </pre>
                
              </details>
            );
          })
        )}
      </div>
      {!readOnly && <details className="panel restore-panel">
        <summary>Restore or merge a full progress backup</summary>
        <p>
          Paste a downloaded backup JSON below. Existing completed records and
          notes are merged, not deleted. Invalid backups are rejected. Keep the
          original backup file.
        </p>
        <textarea
          aria-label="Progress backup JSON"
          value={backup}
          onChange={(e) => setBackup(e.target.value)}
          rows={5}
          placeholder="Paste the contents of shiftrun-backup.json"
        />
        <button
          disabled={!backup.trim()}
          onClick={() => {
            try {
              const imported = parseBackup(backup);
              setSave((prev) => mergeSaves(prev, imported));
              setMessage(
                'Backup merged. Download a fresh backup after your next session.',
              );
              setBackup('');
            } catch {
              setMessage(
                'Invalid backup. Your existing progress was not changed.',
              );
            }
          }}
        >
          Merge backup
        </button>
        <p role="status">{message}</p>
      </details>}
    </section>
  );
}


import {useEffect, useMemo, useRef, useState} from 'react';
import {CYCLE_STAGES, getCycleStage} from '../data';

const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value));

const pageState = (index: number, progress: number) => {
  const build = Math.floor(clamp(progress / 0.2) * 14);
  const written = progress < 0.2 ? 0 : Math.floor(clamp((progress - 0.2) / 0.28) * 12);
  const postCheckpointDirty = progress < 0.66 ? 0 : Math.floor(clamp((progress - 0.66) / 0.3) * 9);

  if (progress < 0.58 && index < build && index >= written) return 'dirty';
  if (progress >= 0.66 && index < postCheckpointDirty) return index < 6 ? 'fpi' : 'dirty';
  return 'clean';
};

const stageTarget = (index: number) => CYCLE_STAGES[index].start + 0.008;

type CheckpointCycleProps = {
  autoStartToken: number;
};

export const CheckpointCycle = ({autoStartToken}: CheckpointCycleProps) => {
  const [progress, setProgress] = useState(0.02);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const previousTime = useRef<number | null>(null);
  const stage = getCycleStage(progress);

  useEffect(() => {
    if (autoStartToken > 0) {
      setProgress(0.02);
      setPlaying(true);
    }
  }, [autoStartToken]);

  useEffect(() => {
    if (!playing) {
      previousTime.current = null;
      return;
    }

    let frame = 0;
    const tick = (time: number) => {
      const previous = previousTime.current ?? time;
      previousTime.current = time;
      const delta = time - previous;
      setProgress((current) => {
        const next = current + (delta / 18_000) * speed;
        if (next >= 1) {
          setPlaying(false);
          return 1;
        }
        return next;
      });
      frame = window.requestAnimationFrame(tick);
    };
    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, [playing, speed]);

  const triggerProgress = progress < 0.2 ? clamp(progress / 0.2) : clamp((progress - 0.66) / 0.34);
  const timeoutLevel = Math.round(triggerProgress * 100);
  const walLevel = Math.round(triggerProgress * 68);
  const checkpointActive = progress >= 0.2 && progress < 0.58;
  const fpiActive = progress >= 0.66 && progress < 0.84;

  const goatPosition = useMemo(() => {
    const x = 1 + progress * 98;
    let y = 65;
    if (progress >= 0.62) {
      const t = clamp((progress - 0.62) / 0.38);
      const inverse = 1 - t;
      const svgY = (inverse ** 3 * 24)
        + (3 * inverse ** 2 * t * 35)
        + (3 * inverse * t ** 2 * 55)
        + (t ** 3 * 105);
      y = ((22 + (svgY / 150) * 140) / 170) * 100;
    }
    return {x, y};
  }, [progress]);

  return (
    <div className="experience-panel cycle-panel" id="panel-cycle" role="tabpanel" aria-labelledby="tab-cycle">
      <div className="experience-heading">
        <div>
          <div className="eyebrow"><span /> GUIDED MODEL</div>
          <h2>Follow one durable boundary.</h2>
        </div>
        <div className="model-badge"><span /> MODELED · TIME COMPRESSED</div>
      </div>

      <div className="cycle-layout">
        <div className="engine-wrap">
          <div className="trigger-gauges">
            <div className="gauge-card">
              <div><span>checkpoint_timeout</span><strong>{progress >= 0.2 && progress < 0.66 ? 'REACHED' : `${timeoutLevel}%`}</strong></div>
              <div className="mini-track"><span style={{width: `${progress >= 0.2 && progress < 0.66 ? 100 : timeoutLevel}%`}} /></div>
            </div>
            <div className="gauge-card">
              <div><span>WAL pressure</span><strong>{progress >= 0.2 && progress < 0.66 ? 'BELOW TARGET' : `${walLevel}%`}</strong></div>
              <div className="mini-track purple"><span style={{width: `${progress >= 0.2 && progress < 0.66 ? 68 : walLevel}%`}} /></div>
            </div>
            <div className={checkpointActive ? 'trigger-state active' : 'trigger-state'}>
              <small>MODEL CAUSE</small>
              <strong>{checkpointActive ? 'TIMED CHECKPOINT' : fpiActive ? 'POST-CHECKPOINT CHANGES' : 'WORKLOAD RUNNING'}</strong>
            </div>
          </div>

          <div className="engine-board">
            <div className="wal-lane">
              <div className="lane-label"><span>WAL</span><small>records before data pages</small></div>
              <div className="wal-stream" aria-label={fpiActive ? 'WAL stream with full-page image records' : 'WAL record stream'}>
                {Array.from({length: 14}).map((_, index) => (
                  <span
                    className={fpiActive && index > 3 && index < 10 ? 'wal-block fpi' : 'wal-block'}
                    key={index}
                    style={{animationDelay: `${index * -0.16}s`}}
                  >
                    {fpiActive && index > 3 && index < 10 ? 'FPI' : ''}
                  </span>
                ))}
              </div>
              <div className="wal-destination">pg_wal</div>
            </div>

            <div className="data-flow">
              <div className="client-stack">
                <span className="node-label">STEADY WORKLOAD</span>
                <div className="client-pulses">
                  {Array.from({length: 4}).map((_, index) => <span key={index} style={{animationDelay: `${index * 0.4}s`}} />)}
                </div>
                <small>page modifications</small>
              </div>

              <div className="flow-arrow"><span>→</span></div>

              <div className="buffer-pool">
                <div className="node-title"><span>shared_buffers</span><strong>18 representative pages</strong></div>
                <div className="page-grid">
                  {Array.from({length: 18}).map((_, index) => {
                    const state = pageState(index, progress);
                    return <span className={`buffer-page ${state}`} key={index}>{state === 'fpi' ? '1st' : ''}</span>;
                  })}
                </div>
                <div className="page-legend"><span className="clean-dot" /> clean <span className="dirty-dot" /> dirty <span className="fpi-dot" /> first change</div>
              </div>

              <div className={checkpointActive ? 'checkpointer active' : 'checkpointer'}>
                <span className="checkpointer-ring" />
                <strong>CHECKPOINTER</strong>
                <small>{progress >= 0.48 && progress < 0.58 ? 'sync phase' : checkpointActive ? 'paced writes' : 'waiting'}</small>
              </div>

              <div className="storage-stack">
                <span className="node-label">STORAGE</span>
                <div className="storage-pages">
                  {Array.from({length: 5}).map((_, index) => <span key={index} />)}
                </div>
                <small>heap + index files</small>
              </div>
            </div>

            <div className="boundary-row">
              <div className={progress >= 0.58 ? 'boundary-card active' : 'boundary-card'}>
                <span>global/pg_control</span>
                <strong>{progress >= 0.58 ? 'REDO LOCATION ADVANCED' : 'PREVIOUS REDO LOCATION'}</strong>
              </div>
              <div className={progress >= 0.58 ? 'boundary-line active' : 'boundary-line'}><span /></div>
              <div className="boundary-copy">RECOVERY STARTS FROM THE RECORDED CHECKPOINT</div>
            </div>
          </div>

          <div className="pressure-graph" role="img" aria-label="Conceptual pressure curve around one checkpoint; the jumping goat follows the post-checkpoint spike and settling curve">
            <div className="graph-labels"><span>CONCEPTUAL PRESSURE</span><small>no measured scale</small></div>
            <svg aria-hidden="true" viewBox="0 0 1000 150" preserveAspectRatio="none">
              <defs>
                <linearGradient id="pressureStroke" x1="0" x2="1">
                  <stop offset="0" stopColor="#2AA6DF" />
                  <stop offset="0.62" stopColor="#653DF4" />
                  <stop offset="0.63" stopColor="#F6FE54" />
                  <stop offset="1" stopColor="#FF5A66" />
                </linearGradient>
              </defs>
              <path className="graph-grid-line" d="M0 118 H1000 M0 68 H1000 M0 18 H1000" />
              <path className="pressure-path" d="M0 104 C140 92 260 110 410 96 C500 88 565 97 610 93 L620 24 C700 35 790 55 1000 105" />
              <line className="checkpoint-line" x1="620" x2="620" y1="8" y2="138" />
              <text className="checkpoint-text" x="630" y="18">CHECKPOINT</text>
            </svg>
            <img
              className={progress >= 0.57 ? 'graph-goat visible' : 'graph-goat'}
              src="./assets/goats/goat-jump.png"
              alt=""
              style={{left: `${goatPosition.x}%`, top: `${goatPosition.y}%`}}
            />
            <div className="graph-progress" style={{width: `${progress * 100}%`}} />
          </div>

          <div className="transport-controls">
            <button
              className="round-control"
              type="button"
              aria-label={playing ? 'Pause model' : 'Play model'}
              onClick={() => {
                if (progress >= 1) setProgress(0);
                setPlaying((value) => !value);
              }}
            >
              {playing ? 'Ⅱ' : '▶'}
            </button>
            <button className="text-control" type="button" onClick={() => {setProgress(0.02); setPlaying(false);}}>RESET</button>
            <input
              aria-label="Scrub through the checkpoint cycle"
              className="scrubber"
              max="1000"
              min="0"
              onChange={(event) => {setProgress(Number(event.target.value) / 1000); setPlaying(false);}}
              type="range"
              value={Math.round(progress * 1000)}
            />
            <label className="speed-control">SPEED
              <select value={speed} onChange={(event) => setSpeed(Number(event.target.value))}>
                <option value="0.75">0.75×</option>
                <option value="1">1×</option>
                <option value="1.5">1.5×</option>
              </select>
            </label>
          </div>
        </div>

        <aside className="stage-inspector" aria-live="polite">
          <div className="inspector-progress"><span style={{height: `${Math.max(8, progress * 100)}%`}} /></div>
          <div className="stage-copy">
            <span className="stage-kicker">{stage.kicker}</span>
            <h3>{stage.title}</h3>
            <p>{stage.body}</p>
            <div className="technical-note"><strong>TECHNICAL NOTE</strong><p>{stage.detail}</p></div>
          </div>
          <div className="stage-list" aria-label="Jump to a stage">
            {CYCLE_STAGES.map((item, index) => (
              <button
                aria-current={item.id === stage.id ? 'step' : undefined}
                className={item.id === stage.id ? 'active' : ''}
                key={item.id}
                onClick={() => {setProgress(stageTarget(index)); setPlaying(false);}}
                type="button"
              >
                <span>{String(index + 1).padStart(2, '0')}</span>{item.title}
              </button>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
};

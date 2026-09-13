import {useMemo, useState} from 'react';

const timeoutOptions = [5, 15, 30, 60];

export const TuningLab = () => {
  const [timeout, setTimeoutValue] = useState(30);
  const [maxWal, setMaxWal] = useState(8);
  const [walDemand, setWalDemand] = useState(6);
  const [completionTarget, setCompletionTarget] = useState(0.9);
  const [majorVersion, setMajorVersion] = useState<'14-16' | '17-18'>('17-18');

  const model = useMemo(() => {
    const checkpointWindow = timeout * completionTarget;
    const walPressure = Math.min(135, (walDemand / maxWal) * 100);
    return {
      checkpointWindow,
      walPressure,
      likelyEarly: walDemand > maxWal,
    };
  }, [timeout, maxWal, walDemand, completionTarget]);

  return (
    <div className="experience-panel tune-panel" id="panel-tune" role="tabpanel" aria-labelledby="tab-tune">
      <div className="experience-heading">
        <div>
          <div className="eyebrow"><span /> OPERATOR WORKBENCH</div>
          <h2>Tune three controls as one checkpoint system.</h2>
        </div>
        <div className="model-badge"><span /> ILLUSTRATIVE · NOT AN ESTIMATOR</div>
      </div>

      <div className="tuning-grid">
        <div className="controls-stack">
          <fieldset className="control-field">
            <legend><code>checkpoint_timeout</code><span>{timeout} minutes</span></legend>
            <p>Maximum planned interval between automatic checkpoints. An idle timed checkpoint can be skipped.</p>
            <div className="segmented-control">
              {timeoutOptions.map((option) => (
                <button aria-pressed={timeout === option} className={timeout === option ? 'active' : ''} key={option} onClick={() => setTimeoutValue(option)} type="button">{option}m</button>
              ))}
            </div>
          </fieldset>

          <fieldset className="control-field">
            <legend><code>max_wal_size</code><span>{maxWal} GiB</span></legend>
            <p>A soft target. WAL growth can request a checkpoint before the planned timeout.</p>
            <input aria-label="max_wal_size in GiB" max="32" min="1" onChange={(event) => setMaxWal(Number(event.target.value))} step="1" type="range" value={maxWal} />
            <div className="range-labels"><span>1 GiB</span><span>32 GiB</span></div>
          </fieldset>

          <fieldset className="control-field">
            <legend><code>checkpoint_completion_target</code><span>{completionTarget.toFixed(1)}</span></legend>
            <p>Fraction of the interval available to spread checkpoint writes. PostgreSQL defaults to 0.9.</p>
            <input aria-label="checkpoint_completion_target" max="0.9" min="0.5" onChange={(event) => setCompletionTarget(Number(event.target.value))} step="0.1" type="range" value={completionTarget} />
            <div className="range-labels"><span>more concentrated</span><span>0.9 · default</span></div>
          </fieldset>

          <fieldset className="control-field workload-field">
            <legend><span>Illustrative WAL demand</span><span>{walDemand} GiB / interval</span></legend>
            <p>This is a model input, not a measured estimate. Use your logs to replace it with observed WAL distance.</p>
            <input aria-label="Illustrative WAL demand" max="32" min="1" onChange={(event) => setWalDemand(Number(event.target.value))} step="1" type="range" value={walDemand} />
          </fieldset>
        </div>

        <div className="model-output">
          <div className={model.likelyEarly ? 'model-status warning' : 'model-status healthy'}>
            <small>MODEL SIGNAL</small>
            <strong>{model.likelyEarly ? 'WAL PRESSURE MAY REQUEST AN EARLIER CHECKPOINT' : 'PLANNED INTERVAL RETAINS ILLUSTRATIVE WAL HEADROOM'}</strong>
            <p>{model.likelyEarly
              ? 'The supplied WAL demand is above max_wal_size. PostgreSQL may checkpoint before checkpoint_timeout.'
              : 'The supplied WAL demand remains below the configured soft target in this simplified view. Validate the real behavior in logs.'}</p>
          </div>

          <div className="timeline-model">
            <div className="timeline-heading"><span>PLANNED INTERVAL</span><strong>{timeout} minutes</strong></div>
            <div className="timeline-track">
              <span className="write-window" style={{width: `${completionTarget * 100}%`}} />
              <span className="target-marker" style={{left: `${completionTarget * 100}%`}}><small>{model.checkpointWindow.toFixed(1)}m target</small></span>
              <span className="timeout-marker"><small>{timeout}m timeout</small></span>
            </div>
            <div className="timeline-legend"><span><i className="purple-key" /> checkpoint write window</span><span><i className="yellow-key" /> completion headroom</span></div>
          </div>

          <div className="wal-pressure-model">
            <div className="timeline-heading"><span>WAL AGAINST SOFT TARGET</span><strong>{walDemand} / {maxWal} GiB</strong></div>
            <div className="wal-pressure-track"><span className={model.likelyEarly ? 'warning' : ''} style={{width: `${Math.min(100, model.walPressure)}%`}} /></div>
            <div className="soft-target-label">max_wal_size · soft target</div>
          </div>

          <div className="universal-warning">
            <span>!</span><p><strong>There is no universal safe interval.</strong> Leave disk headroom, validate standby health and recovery, then measure the result.</p>
          </div>
        </div>
      </div>

      <div className="recovery-panel">
        <div className="recovery-copy">
          <div className="eyebrow"><span /> RECOVERY TRADE-OFF</div>
          <h3>Separate the checkpoint interval from replay time.</h3>
          <p>A longer interval can leave more WAL available to replay after a crash. It does not turn sixty minutes between checkpoints into sixty minutes of recovery.</p>
          <div className="recovery-equation"><span>RECOVERY DURATION</span><strong>WAL TO APPLY ÷ EFFECTIVE REPLAY RATE</strong></div>
        </div>
        <div className="recovery-evidence">
          <div className="recovery-case"><span>EXAMPLE 01</span><strong>25.59 s</strong><small>redo elapsed in the first supplied recovery log</small></div>
          <div className="recovery-case"><span>EXAMPLE 02</span><strong>69.08 s</strong><small>redo elapsed in the second supplied recovery log</small></div>
          <div className="recovery-note"><strong>EXAMPLES, NOT A FORECAST</strong><p>The first LSN span and elapsed time imply approximately 80.4 MiB/s. Real recovery depends on WAL volume, workload, hardware, and recovery conditions.</p></div>
        </div>
        <div className="ha-note"><span>HA PATH</span><p>A healthy standby and working automation such as Patroni can fail over without waiting for the failed primary to finish crash recovery. Standby health and failover must be tested.</p></div>
      </div>

      <div className="monitoring-lab">
        <div className="monitoring-heading">
          <div><div className="eyebrow"><span /> VERIFY THE PACE</div><h3>Read the system after every change.</h3></div>
          <div className="version-toggle" aria-label="PostgreSQL version" role="group">
            <button aria-pressed={majorVersion === '14-16'} className={majorVersion === '14-16' ? 'active' : ''} onClick={() => setMajorVersion('14-16')} type="button">PG 14–16</button>
            <button aria-pressed={majorVersion === '17-18'} className={majorVersion === '17-18' ? 'active' : ''} onClick={() => setMajorVersion('17-18')} type="button">PG 17–18</button>
          </div>
        </div>

        <div className="monitoring-grid">
          <article><span>01</span><code>log_checkpoints = on</code><p>Checkpoint cause, buffers, write time, sync time, total time, distance, and estimate.</p></article>
          <article><span>02</span><code>SELECT * FROM pg_stat_wal;</code><p>Cumulative WAL records, full-page images, bytes, writes, syncs, and reset time.</p></article>
          <article><span>03</span><code>SELECT * FROM {majorVersion === '17-18' ? 'pg_stat_checkpointer' : 'pg_stat_bgwriter'};</code><p>{majorVersion === '17-18' ? 'Dedicated checkpointer statistics are available from PostgreSQL 17.' : 'Checkpoint counters remain in pg_stat_bgwriter through PostgreSQL 16.'}</p></article>
        </div>
      </div>
    </div>
  );
};

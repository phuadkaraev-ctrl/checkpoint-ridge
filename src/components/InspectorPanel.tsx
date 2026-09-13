import {useMemo, type CSSProperties} from 'react';
import {
  BENCHMARK,
  RECOVERY_EXAMPLES,
  SOURCE_LINKS,
  getSystemNode,
  formatInteger,
  reductionFromBaseline,
  type Scenario,
  type SystemNodeId,
} from '../data';
import type {ModelSnapshot, TuningInputs} from '../simulation';

type InspectorPanelProps = {
  open: boolean;
  scenario: Scenario;
  selectedNode: SystemNodeId;
  selectedGap: number;
  tuning: TuningInputs;
  snapshot: ModelSnapshot;
  progress: number;
  onClose: () => void;
  onOpen: () => void;
  onGapChange: (gapSeconds: number) => void;
  onTuningChange: (inputs: TuningInputs) => void;
};

const ASSET_BASE = import.meta.env.BASE_URL;

const Meter = ({value, color, label}: {value: number; color: string; label: string}) => (
  <div className="signal-meter">
    <span>{label}</span><div><i style={{width: `${Math.round(value * 100)}%`, background: color}} /></div><strong>{Math.round(value * 100)}%</strong>
  </div>
);

const OverviewModule = () => (
  <div className="inspector-module overview-module">
    <span className="module-label">HOW TO EXPLORE</span>
    <div className="instruction-grid">
      <div><b>01</b><span><strong>Orbit the system</strong><small>Drag the landscape and zoom into a district.</small></span></div>
      <div><b>02</b><span><strong>Run the path</strong><small>Use the scenario rail to follow one technical idea.</small></span></div>
      <div><b>03</b><span><strong>Test the controls</strong><small>Separate measured evidence from modeled direction.</small></span></div>
    </div>
  </div>
);

const CycleModule = ({snapshot}: {snapshot: ModelSnapshot}) => (
  <div className="inspector-module">
    <div className="module-heading"><span className="module-label">LIVE CONCEPTUAL SIGNALS</span><small>not telemetry</small></div>
    <Meter value={snapshot.checkpointIntensity} color="#f6fe54" label="CHECKPOINT" />
    <Meter value={snapshot.storageIntensity} color="#56e3a2" label="STORAGE I/O" />
    <Meter value={snapshot.fpiIntensity} color="#ffad42" label="FPI PRESSURE" />
    <div className="info-note"><i>i</i><p>A checkpoint establishes a new recovery boundary. Data-page writes and WAL records are separate streams; the first post-checkpoint page change can add an FPI to WAL.</p></div>
  </div>
);

const FpiModule = ({snapshot}: {snapshot: ModelSnapshot}) => (
  <div className="inspector-module fpi-module">
    <span className="module-label">THE PROTECTION MECHANISM</span>
    <div className="code-flow">
      <code>CHECKPOINT</code><span>→</span><code>FIRST PAGE CHANGE</code><span>→</span><code>FPI IN WAL</code>
    </div>
    <p>With <code>full_page_writes</code> enabled, PostgreSQL logs the whole page on its first change after a checkpoint. This lets recovery repair a page torn by a partial write.</p>
    <Meter value={snapshot.fpiIntensity} color="#ffad42" label="CONCEPTUAL FPI WAVE" />
    <small className="plain-boundary">The jumping goat follows the exact height of the conceptual line. The line is not a production trace.</small>
  </div>
);

const EvidenceModule = ({selectedGap, onGapChange}: {selectedGap: number; onGapChange: (gap: number) => void}) => {
  const baseline = BENCHMARK[0];
  const selected = BENCHMARK.find((point) => point.gapSeconds === selectedGap) ?? baseline;
  const walReduction = reductionFromBaseline(selected.walGb, baseline.walGb);
  const fpiReduction = reductionFromBaseline(selected.walFpi, baseline.walFpi);
  return (
    <div className="inspector-module evidence-module">
      <div className="module-heading"><span className="module-label">EXACT PUBLISHED OBSERVATIONS</span><span className="measured-tag">MEASURED</span></div>
      <p className="module-intro">Fixed <code>pgbench</code> workload · 2 connections · 1.11 million transactions each</p>
      <div className="benchmark-picker">
        {BENCHMARK.map((point) => (
          <button key={point.gapSeconds} type="button" className={point.gapSeconds === selectedGap ? 'active' : ''} onClick={() => onGapChange(point.gapSeconds)}>
            <small>{point.shortLabel}</small>
            <span><i style={{height: `${18 + (point.walGb / baseline.walGb) * 48}px`}} /> </span>
          </button>
        ))}
      </div>
      <div className="evidence-result">
        <div><small>WAL GENERATED</small><strong>{selected.walGb.toFixed(2)} <em>GB</em></strong><span>{selected === baseline ? 'baseline run' : `${walReduction}% below 5 min`}</span></div>
        <div><small>FULL-PAGE IMAGES</small><strong>{formatInteger(selected.walFpi)}</strong><span>{selected === baseline ? 'baseline run' : `${fpiReduction}% below 5 min`}</span></div>
      </div>
      {selected.gapSeconds === 3600 && <div className="result-callout"><strong>≈5.9× less WAL</strong><span>and ≈9.1× fewer FPIs than the five-minute run.</span></div>}
      <div className="repeated-write-note"><strong>There is another saving.</strong><p>With frequent checkpoints, the same buffer page may be flushed, modified, and flushed again. More time between checkpoints can avoid repeated writes when memory pressure does not force the page out first.</p></div>
      <p className="source-footnote">Four separate observations. Workload and schema determine whether another system behaves similarly.</p>
    </div>
  );
};

const TuneModule = ({tuning, onTuningChange}: {tuning: TuningInputs; onTuningChange: (inputs: TuningInputs) => void}) => {
  const update = <Key extends keyof TuningInputs,>(key: Key, value: TuningInputs[Key]) => onTuningChange({...tuning, [key]: value});
  const hasHeadroom = tuning.maxWalGiB >= tuning.illustrativeWalGiB;
  return (
    <div className="inspector-module tuning-module">
      <span className="module-label">DIRECTIONAL CONTROL MODEL</span>
      <label className="parameter-control">
        <span><code>checkpoint_timeout</code><strong>{tuning.timeoutMinutes} min</strong></span>
        <input type="range" min="5" max="60" step="5" value={tuning.timeoutMinutes} onChange={(event) => update('timeoutMinutes', Number(event.target.value))} />
        <small>Maximum planned time between automatic checkpoints. Thirty minutes or more can be a starting point with physical standbys, but must be validated. An idle timed checkpoint may be skipped.</small>
      </label>
      <label className="parameter-control">
        <span><code>max_wal_size</code><strong>{tuning.maxWalGiB} GiB</strong></span>
        <input type="range" min="1" max="24" step="1" value={tuning.maxWalGiB} onChange={(event) => update('maxWalGiB', Number(event.target.value))} />
        <small>A soft target. If WAL pressure reaches it, PostgreSQL can trigger a checkpoint before the timeout.</small>
      </label>
      <label className="parameter-control">
        <span><code>checkpoint_completion_target</code><strong>{tuning.completionTarget.toFixed(2)}</strong></span>
        <input type="range" min="0.5" max="0.95" step="0.05" value={tuning.completionTarget} onChange={(event) => update('completionTarget', Number(event.target.value))} />
        <small>The default and generally recommended value is 0.9, spreading work across about 90% of the interval.</small>
      </label>
      <label className="parameter-control secondary-control">
        <span><span>Illustrative WAL between checkpoints</span><strong>{tuning.illustrativeWalGiB} GiB</strong></span>
        <input type="range" min="1" max="18" step="1" value={tuning.illustrativeWalGiB} onChange={(event) => update('illustrativeWalGiB', Number(event.target.value))} />
      </label>
      <div className={`headroom-card ${hasHeadroom ? 'safe' : 'risk'}`}>
        <i />
        <span><strong>{hasHeadroom ? 'Directional headroom' : 'Early-checkpoint pressure'}</strong><small>{hasHeadroom ? 'Selected soft WAL target exceeds the illustrative volume.' : 'Illustrative WAL exceeds the selected soft target.'}</small></span>
      </div>
    </div>
  );
};

const RecoveryModule = ({progress}: {progress: number}) => (
  <div className="inspector-module recovery-module">
    <span className="module-label">RECOVERY IS WAL WORK, NOT WALL TIME</span>
    <div className="recovery-equation"><span>replay work</span><b>÷</b><span>replay throughput</span><b>=</b><span>recovery time</span></div>
    <div className="recovery-track"><i style={{width: `${Math.min(100, progress * 111)}%`}} /><span style={{left: `${Math.min(96, progress * 100)}%`}} /></div>
    <div className="recovery-observations">
      {RECOVERY_EXAMPLES.map((item) => <div key={item.wal}><strong>{item.time}</strong><span>{item.wal}</span><small>{item.detail}</small></div>)}
    </div>
    <div className="info-note"><i>HA</i><p>With a healthy standby and an HA solution such as Patroni, applications can fail over without waiting for the failed primary to finish crash recovery.</p></div>
  </div>
);

const MonitoringModule = () => (
  <div className="inspector-module monitoring-module">
    <span className="module-label">VERIFY AFTER TUNING</span>
    <ul>
      <li><code>log_checkpoints</code><span>Timing, write and sync duration, WAL distance</span></li>
      <li><code>pg_stat_wal</code><span>Cumulative WAL statistics · PostgreSQL 14+</span></li>
      <li><code>pg_stat_bgwriter</code><span>Checkpoint statistics through PostgreSQL 16</span></li>
      <li><code>pg_stat_checkpointer</code><span>Checkpoint statistics from PostgreSQL 17</span></li>
    </ul>
  </div>
);

const CommunityCta = () => (
  <div className="inspector-cta">
    <div className="cta-copy">
      <span>KEEP CLIMBING</span>
      <h3>Go deeper. Tune with confidence.</h3>
      <p>Read the full checkpoint analysis, then bring your questions and results to Percona Community.</p>
      <div className="cta-actions">
        <a className="cta-primary" href={SOURCE_LINKS.analysis} target="_blank" rel="noreferrer">Read the full post <b>↗</b></a>
        <a href={SOURCE_LINKS.slack} target="_blank" rel="noreferrer">Join Community Slack <b>↗</b></a>
        <a href={SOURCE_LINKS.community} target="_blank" rel="noreferrer">Join Percona Community <b>↗</b></a>
      </div>
    </div>
    <img src={`${ASSET_BASE}assets/goats/goat-peek.webp`} alt="Percona goat peeking over the community panel" />
  </div>
);

export const InspectorPanel = ({open, scenario, selectedNode, selectedGap, tuning, snapshot, progress, onClose, onOpen, onGapChange, onTuningChange}: InspectorPanelProps) => {
  const node = useMemo(() => getSystemNode(selectedNode), [selectedNode]);
  return (
    <>
      <button type="button" className={`inspector-reopen ${open ? 'hidden' : ''}`} onClick={onOpen}><span>INSPECTOR</span><b>‹</b></button>
      <aside className={`inspector-panel ${open ? 'open' : ''}`} aria-label="Technical inspector">
        <div className="inspector-header">
          <div><span className="inspector-icon">⌁</span><span><small>INSPECTOR</small><strong>{scenario.tab}</strong></span></div>
          <button type="button" onClick={onClose} aria-label="Close inspector">×</button>
        </div>
        <div className="inspector-scroll">
          <div className="selected-node-card" style={{'--node-color': node.color} as CSSProperties}>
            <span className="node-pulse" /><div><small>SELECTED DISTRICT</small><h2>{node.label}</h2><p>{node.role}</p></div>
          </div>
          <p className="node-detail">{node.detail}</p>
          {scenario.id === 'overview' && <OverviewModule />}
          {scenario.id === 'cycle' && <CycleModule snapshot={snapshot} />}
          {scenario.id === 'fpi' && <FpiModule snapshot={snapshot} />}
          {scenario.id === 'evidence' && <EvidenceModule selectedGap={selectedGap} onGapChange={onGapChange} />}
          {scenario.id === 'tune' && <TuneModule tuning={tuning} onTuningChange={onTuningChange} />}
          {scenario.id === 'recovery' && <RecoveryModule progress={progress} />}
          <MonitoringModule />
          <CommunityCta />
          <div className="inspector-sources">
            <span>PRIMARY REFERENCES</span>
            <a href={SOURCE_LINKS.walDocs} target="_blank" rel="noreferrer">WAL configuration ↗</a>
            <a href={SOURCE_LINKS.settingsDocs} target="_blank" rel="noreferrer">Server settings ↗</a>
            <a href={SOURCE_LINKS.monitoringDocs} target="_blank" rel="noreferrer">Monitoring statistics ↗</a>
          </div>
        </div>
      </aside>
    </>
  );
};

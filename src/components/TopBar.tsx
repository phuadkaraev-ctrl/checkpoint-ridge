import type {RenderQuality} from './WorldCanvas';
import type {ModelSnapshot} from '../simulation';
import type {Scenario} from '../data';

type TopBarProps = {
  scenario: Scenario;
  snapshot: ModelSnapshot;
  progress: number;
  quality: RenderQuality;
  soundOn: boolean;
  threeDEnabled: boolean;
  onToggleSound: () => void;
  onResetView: () => void;
  onQualityChange: (quality: RenderQuality) => void;
};

const ASSET_BASE = import.meta.env.BASE_URL;

const SpeakerIcon = ({on}: {on: boolean}) => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M4 10v4h4l5 4V6L8 10H4Z" />
    {on ? <path d="M16 9c1.1 1.5 1.1 4.5 0 6m2.5-8.5c3 3.1 3 7.9 0 11" /> : <path d="m17 9 4 6m0-6-4 6" />}
  </svg>
);

export const TopBar = ({scenario, snapshot, progress, quality, soundOn, threeDEnabled, onToggleSound, onResetView, onQualityChange}: TopBarProps) => (
  <header className="top-deck">
    <a className="sim-brand" href="https://percona.community/" target="_blank" rel="noreferrer" aria-label="Percona Community">
      <img src={`${ASSET_BASE}assets/brand/percona-community-logo.svg`} alt="Percona Community" />
      <span><strong>Checkpoint Ridge</strong><small>PostgreSQL 3D lab</small></span>
    </a>

    <div className="telemetry-strip" aria-label="Current model state">
      <div><small>SCENARIO</small><strong>{scenario.index} / {scenario.tab}</strong></div>
      <div><small>MODEL STEP</small><strong>{String(Math.round(progress * 100)).padStart(2, '0')} / 100</strong></div>
      <div><small>DIRTY-PAGE LOAD</small><strong>{snapshot.dirtyPages}%<em> modeled</em></strong></div>
      <div>
        <small>{scenario.id === 'evidence' ? 'FPI VS 5 MIN' : 'FPI SIGNAL'}</small>
        <strong>{Math.round(snapshot.fpiIntensity * 100)}%<em>{scenario.id === 'evidence' ? ' of baseline' : ' modeled'}</em></strong>
      </div>
      <div className="phase-cell"><small>CURRENT PHASE</small><strong>{snapshot.phase}</strong></div>
    </div>

    <nav className="top-tools" aria-label="Simulation tools">
      <button type="button" onClick={onToggleSound} className={soundOn ? 'active' : ''} aria-label={`Turn interface sound ${soundOn ? 'off' : 'on'}`}>
        <SpeakerIcon on={soundOn} /><span>Sound {soundOn ? 'on' : 'off'}</span>
      </button>
      {threeDEnabled ? (
        <>
          <button type="button" onClick={onResetView} aria-label="Reset camera view">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 7v5h5M6.6 17A8 8 0 1 0 5 9" /></svg><span>Reset view</span>
          </button>
          <label className="quality-control">
            <span className="sr-only">Render quality</span>
            <select value={quality} onChange={(event) => onQualityChange(event.target.value as RenderQuality)}>
              <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option>
            </select>
          </label>
        </>
      ) : (
        <span className="render-mode-badge"><small>DISPLAY</small><strong>2D FALLBACK</strong></span>
      )}
    </nav>
  </header>
);

import {SCENARIOS, type ScenarioId} from '../data';

type ScenarioRailProps = {
  scenario: ScenarioId;
  progress: number;
  playing: boolean;
  speed: number;
  onScenarioChange: (scenario: ScenarioId) => void;
  onProgressChange: (progress: number) => void;
  onTogglePlay: () => void;
  onReset: () => void;
  onSpeedChange: (speed: number) => void;
};

export const ScenarioRail = ({scenario, progress, playing, speed, onScenarioChange, onProgressChange, onTogglePlay, onReset, onSpeedChange}: ScenarioRailProps) => (
  <footer className="scenario-rail">
    <div className="transport-controls" aria-label="Scenario playback">
      <button type="button" className="play-control" onClick={onTogglePlay} aria-label={playing ? 'Pause scenario' : 'Play scenario'}>
        {playing ? <svg viewBox="0 0 24 24"><path d="M7 5h4v14H7zm6 0h4v14h-4z" /></svg> : <svg viewBox="0 0 24 24"><path d="m7 4 12 8-12 8z" /></svg>}
      </button>
      <button type="button" onClick={onReset} aria-label="Restart scenario"><svg viewBox="0 0 24 24"><path d="M5 7v5h5M6.6 17A8 8 0 1 0 5 9" /></svg></button>
      <button type="button" className="speed-control" onClick={() => onSpeedChange(speed >= 2 ? 0.5 : speed + 0.5)} aria-label={`Playback speed ${speed} times`}>{speed}×</button>
    </div>

    <label className="timeline-control">
      <span className="sr-only">Scenario progress</span>
      <input type="range" min={0} max={1000} value={Math.round(progress * 1000)} onChange={(event) => onProgressChange(Number(event.target.value) / 1000)} />
      <span className="timeline-fill" style={{width: `${progress * 100}%`}} />
    </label>

    <nav className="scenario-tabs" aria-label="Simulation scenarios">
      <span className="scenario-label">SCENARIOS</span>
      {SCENARIOS.map((item) => (
        <button key={item.id} type="button" className={scenario === item.id ? 'active' : ''} onClick={() => onScenarioChange(item.id)} aria-pressed={scenario === item.id}>
          <small>{item.index}</small><span>{item.tab}</span>
        </button>
      ))}
    </nav>
    <span className="rail-scroll-hint" aria-hidden="true">SCROLL →</span>
  </footer>
);

import {getCycleStage, type Scenario} from '../data';
import type {ModelSnapshot} from '../simulation';

type NarrativeCardProps = {scenario: Scenario; progress: number; snapshot: ModelSnapshot; threeDEnabled: boolean};

export const NarrativeCard = ({scenario, progress, snapshot, threeDEnabled}: NarrativeCardProps) => {
  const stage = scenario.id === 'cycle' ? getCycleStage(progress) : null;
  const body = !threeDEnabled && scenario.id === 'overview'
    ? 'Follow the directional rails, select a district, or run a guided scenario to see where dirty pages, WAL, storage writes, recovery, and standby replay meet.'
    : stage?.body ?? scenario.body;
  const evidenceClass = scenario.evidence === 'Measured'
    ? 'measured'
    : scenario.evidence === 'Directional model'
      ? 'modeled'
      : scenario.evidence === 'Observed + concept'
        ? 'mixed'
        : '';
  return (
    <section className="narrative-card" aria-live="polite">
      <div className="narrative-meta">
        <span className={`evidence-pill ${evidenceClass}`}>{scenario.evidence}</span>
        <span className="scene-count">{scenario.index} / 05</span>
      </div>
      <p className="narrative-eyebrow">{stage?.kicker ?? scenario.eyebrow}</p>
      <h1>{stage?.title ?? scenario.title}</h1>
      <p className="narrative-copy">{body}</p>
      <div className="technical-boundary">
        <span>TECHNICAL BOUNDARY</span>
        <p>{stage?.detail ?? scenario.boundary}</p>
      </div>
      <div className="gesture-hints" aria-hidden="true">
        {threeDEnabled ? (
          <>
            <span><i className="gesture-orbit" />Drag to orbit</span>
            <span><i className="gesture-zoom" />Scroll to zoom</span>
          </>
        ) : (
          <>
            <span><i className="gesture-path" />Follow the rails</span>
            <span><i className="gesture-scenario" />Run a scenario</span>
          </>
        )}
        <span><i className="gesture-select" />Select a district</span>
      </div>
      <div className="narrative-state"><i /><span>{snapshot.phaseDetail}</span></div>
    </section>
  );
};

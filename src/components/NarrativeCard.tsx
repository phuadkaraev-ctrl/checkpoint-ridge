import {getCycleStage, type Scenario} from '../data';
import type {ModelSnapshot} from '../simulation';

type NarrativeCardProps = {scenario: Scenario; progress: number; snapshot: ModelSnapshot};

export const NarrativeCard = ({scenario, progress, snapshot}: NarrativeCardProps) => {
  const stage = scenario.id === 'cycle' ? getCycleStage(progress) : null;
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
      <p className="narrative-copy">{stage?.body ?? scenario.body}</p>
      <div className="technical-boundary">
        <span>TECHNICAL BOUNDARY</span>
        <p>{stage?.detail ?? scenario.boundary}</p>
      </div>
      <div className="gesture-hints" aria-hidden="true">
        <span><i className="gesture-orbit" />Drag to orbit</span>
        <span><i className="gesture-zoom" />Scroll to zoom</span>
        <span><i className="gesture-select" />Select a district</span>
      </div>
      <div className="narrative-state"><i /><span>{snapshot.phaseDetail}</span></div>
    </section>
  );
};

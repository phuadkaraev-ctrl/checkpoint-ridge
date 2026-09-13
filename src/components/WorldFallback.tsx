import type {CSSProperties} from 'react';
import {SYSTEM_NODES, type ScenarioId, type SystemNodeId} from '../data';
import type {ModelSnapshot} from '../simulation';

type WorldFallbackProps = {
  scenario: ScenarioId;
  selectedNode: SystemNodeId;
  snapshot: ModelSnapshot;
  progress: number;
  onSelectNode: (node: SystemNodeId) => void;
};

type FallbackRail = {
  from: SystemNodeId;
  to: SystemNodeId;
  color: string;
  intensity: number;
  recoveryOnly?: boolean;
};

const FALLBACK_POSITIONS: Record<SystemNodeId, readonly [number, number]> = {
  clients: [16, 75],
  buffers: [36, 56],
  wal: [27, 24],
  checkpointer: [58, 49],
  storage: [80, 73],
  pgcontrol: [78, 29],
  standby: [88, 14],
};

const clampSignal = (value: number) => Math.max(0.08, Math.min(1, value));

const signalForNode = (id: SystemNodeId, snapshot: ModelSnapshot) => {
  switch (id) {
    case 'clients': return 0.46;
    case 'buffers': return snapshot.dirtyPages / 100;
    case 'wal': return snapshot.walIntensity;
    case 'checkpointer': return snapshot.checkpointIntensity;
    case 'storage': return snapshot.storageIntensity;
    case 'pgcontrol': return snapshot.redoAdvanced ? 0.78 : 0.14;
    case 'standby': return snapshot.standbyIntensity;
  }
};

const guideForScenario = (scenario: ScenarioId, snapshot: ModelSnapshot) => {
  if (scenario === 'evidence') {
    return {
      label: 'MEASURED · VS 5 MIN',
      title: `${Math.round(snapshot.walIntensity * 100)}% WAL · ${Math.round(snapshot.fpiIntensity * 100)}% FPI`,
      detail: 'Exact values remain available in the inspector.',
    };
  }
  if (scenario === 'tune') {
    return {label: 'DIRECTIONAL MODEL', title: snapshot.phase, detail: snapshot.phaseDetail};
  }
  if (scenario === 'recovery') {
    return {
      label: 'PRIMARY RESTART · LOCAL PATH',
      title: snapshot.phase,
      detail: 'Standby promotion is shown as a separate HA path.',
    };
  }
  return {
    label: scenario === 'fpi' ? 'CONCEPTUAL FPI SIGNAL' : 'CONCEPTUAL SYSTEM SIGNAL',
    title: snapshot.phase,
    detail: snapshot.phaseDetail,
  };
};

export const WorldFallback = ({scenario, selectedNode, snapshot, progress, onSelectNode}: WorldFallbackProps) => {
  const rails: FallbackRail[] = [
    {from: 'clients', to: 'buffers', color: '#43d9ff', intensity: 0.46},
    {from: 'clients', to: 'wal', color: '#ffad42', intensity: snapshot.walIntensity},
    {from: 'buffers', to: 'checkpointer', color: '#f6fe54', intensity: snapshot.checkpointIntensity},
    {from: 'checkpointer', to: 'storage', color: '#56e3a2', intensity: snapshot.storageIntensity},
    {from: 'checkpointer', to: 'pgcontrol', color: '#ff6685', intensity: snapshot.redoAdvanced ? 0.72 : 0.12},
    {from: 'wal', to: 'standby', color: '#b886ff', intensity: snapshot.standbyIntensity},
    {from: 'pgcontrol', to: 'wal', color: '#ff6685', intensity: progress < 0.3 ? 0.92 : 0.24, recoveryOnly: true},
    {from: 'wal', to: 'storage', color: '#56e3a2', intensity: snapshot.replayIntensity, recoveryOnly: true},
  ];
  const visibleRails = rails.filter((rail) => !rail.recoveryOnly || scenario === 'recovery');
  const guide = guideForScenario(scenario, snapshot);

  return (
    <section className="world-fallback" aria-label="Interactive two-dimensional PostgreSQL checkpoint system map">
      <div className="fallback-map">
        <div className="fallback-compatibility" role="status">
          <span>2D COMPATIBILITY VIEW</span>
          <p>The 3D renderer is unavailable in this browser. Scenario logic and inspector data remain active.</p>
        </div>
        <svg className="fallback-rails" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          <defs>
            <marker id="fallback-arrow" markerWidth="7" markerHeight="7" refX="5.5" refY="3.5" orient="auto">
              <path d="M0 0 7 3.5 0 7Z" fill="#8294ab" />
            </marker>
          </defs>
          <path className="fallback-island" d="M4 73 18 17 55 3 96 13 98 72 77 96 26 91Z" />
          {visibleRails.map((rail) => {
            const from = FALLBACK_POSITIONS[rail.from];
            const to = FALLBACK_POSITIONS[rail.to];
            const style = {
              '--rail-color': rail.color,
              '--rail-opacity': clampSignal(rail.intensity),
            } as CSSProperties;
            return (
              <g key={`${rail.from}-${rail.to}`} className={rail.recoveryOnly ? 'recovery-rail' : ''} style={style}>
                <line className="fallback-rail-base" x1={from[0]} y1={from[1]} x2={to[0]} y2={to[1]} markerEnd="url(#fallback-arrow)" />
                <line className="fallback-rail-flow" x1={from[0]} y1={from[1]} x2={to[0]} y2={to[1]} />
              </g>
            );
          })}
        </svg>

        {SYSTEM_NODES.map((node) => {
          const [x, y] = FALLBACK_POSITIONS[node.id];
          const signal = clampSignal(signalForNode(node.id, snapshot));
          return (
            <button
              key={node.id}
              type="button"
              className={`fallback-node ${selectedNode === node.id ? 'active' : ''}`}
              style={{
                '--node-color': node.color,
                '--node-x': `${x}%`,
                '--node-y': `${y}%`,
                '--signal-width': `${Math.round(signal * 100)}%`,
              } as CSSProperties}
              aria-pressed={selectedNode === node.id}
              aria-label={`Inspect ${node.label}`}
              onClick={() => onSelectNode(node.id)}
            >
              <span className="fallback-node-code"><i />{node.short}</span>
              <strong>{node.label}</strong>
              <span className="fallback-node-meter" aria-hidden="true"><i /></span>
            </button>
          );
        })}

        <div className="fallback-guide">
          <small>{guide.label}</small>
          <strong>{guide.title}</strong>
          <span>{guide.detail}</span>
        </div>
      </div>
    </section>
  );
};

import {SYSTEM_NODES, type ScenarioId, type SystemNodeId} from '../data';

type MinimapProps = {scenario: ScenarioId; selectedNode: SystemNodeId; threeDEnabled: boolean; onSelectNode: (node: SystemNodeId) => void};

const LINKS: readonly [SystemNodeId, SystemNodeId][] = [
  ['clients', 'buffers'], ['clients', 'wal'], ['buffers', 'checkpointer'], ['checkpointer', 'storage'],
  ['checkpointer', 'pgcontrol'], ['wal', 'standby'],
];

const RECOVERY_LINKS: readonly [SystemNodeId, SystemNodeId][] = [['pgcontrol', 'wal'], ['wal', 'storage']];

export const Minimap = ({scenario, selectedNode, threeDEnabled, onSelectNode}: MinimapProps) => {
  const byId = (id: SystemNodeId) => SYSTEM_NODES.find((node) => node.id === id) ?? SYSTEM_NODES[0];
  const links = scenario === 'recovery' ? [...LINKS, ...RECOVERY_LINKS] : LINKS;
  return (
    <aside className="minimap" aria-label="Checkpoint Ridge map">
      <div className="minimap-heading"><span>N</span><strong>SYSTEM MAP</strong><small>{threeDEnabled ? 'ORBIT' : '2D'}</small></div>
      <svg viewBox="0 0 112 96" role="img" aria-label="Clickable map of PostgreSQL system districts">
        <path className="mini-island" d="M8 54 24 21l37-12 41 15 4 43-27 22-49-5Z" />
        {links.map(([from, to]) => {
          const first = byId(from); const second = byId(to);
          const isRecoveryLink = scenario === 'recovery' && RECOVERY_LINKS.some(([start, end]) => start === from && end === to);
          return <line key={`${from}-${to}`} x1={first.map[0]} y1={first.map[1]} x2={second.map[0]} y2={second.map[1]} className={`mini-link ${isRecoveryLink ? 'scenario-link' : ''}`} />;
        })}
        {SYSTEM_NODES.map((node) => (
          <g
            key={node.id}
            className={`mini-node ${selectedNode === node.id ? 'active' : ''}`}
            transform={`translate(${node.map[0]} ${node.map[1]})`}
            role="button"
            tabIndex={0}
            aria-label={`Focus ${node.label}`}
            onClick={() => onSelectNode(node.id)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {event.preventDefault(); onSelectNode(node.id);}
            }}
          >
            <circle r={selectedNode === node.id ? 5.2 : 3.5} style={{fill: node.color}} />
            <text y="-6">{node.short}</text>
          </g>
        ))}
      </svg>
    </aside>
  );
};

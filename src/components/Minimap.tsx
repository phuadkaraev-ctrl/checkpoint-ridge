import {SYSTEM_NODES, type SystemNodeId} from '../data';

type MinimapProps = {selectedNode: SystemNodeId; onSelectNode: (node: SystemNodeId) => void};

const LINKS: readonly [SystemNodeId, SystemNodeId][] = [
  ['clients', 'buffers'], ['clients', 'wal'], ['buffers', 'checkpointer'], ['checkpointer', 'storage'],
  ['checkpointer', 'pgcontrol'], ['wal', 'standby'],
];

export const Minimap = ({selectedNode, onSelectNode}: MinimapProps) => {
  const byId = (id: SystemNodeId) => SYSTEM_NODES.find((node) => node.id === id) ?? SYSTEM_NODES[0];
  return (
    <aside className="minimap" aria-label="Checkpoint Ridge map">
      <div className="minimap-heading"><span>N</span><strong>SYSTEM MAP</strong><small>ORBIT</small></div>
      <svg viewBox="0 0 112 96" role="img" aria-label="Clickable map of PostgreSQL system districts">
        <path className="mini-island" d="M8 54 24 21l37-12 41 15 4 43-27 22-49-5Z" />
        {LINKS.map(([from, to]) => {
          const first = byId(from); const second = byId(to);
          return <line key={`${from}-${to}`} x1={first.map[0]} y1={first.map[1]} x2={second.map[0]} y2={second.map[1]} className="mini-link" />;
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

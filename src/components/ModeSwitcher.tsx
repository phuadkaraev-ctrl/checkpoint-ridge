import type {ExperienceMode} from '../data';

type ModeSwitcherProps = {
  mode: ExperienceMode;
  onChange: (mode: ExperienceMode) => void;
};

const modes: Array<{id: ExperienceMode; number: string; title: string; detail: string}> = [
  {id: 'cycle', number: '01', title: 'Follow the cycle', detail: 'See the mechanism'},
  {id: 'compare', number: '02', title: 'Compare one workload', detail: 'Use measured evidence'},
  {id: 'tune', number: '03', title: 'Tune and verify', detail: 'Test the relationships'},
];

export const ModeSwitcher = ({mode, onChange}: ModeSwitcherProps) => (
  <div className="mode-switcher" role="tablist" aria-label="Checkpoint Ridge modes">
    {modes.map((item, index) => (
      <button
        aria-selected={mode === item.id}
        aria-controls={`panel-${item.id}`}
        className={mode === item.id ? 'mode-card active' : 'mode-card'}
        id={`tab-${item.id}`}
        key={item.id}
        onKeyDown={(event) => {
          const keyOffsets: Record<string, number> = {
            ArrowLeft: -1,
            ArrowUp: -1,
            ArrowRight: 1,
            ArrowDown: 1,
          };
          let nextIndex = index;
          if (event.key === 'Home') nextIndex = 0;
          else if (event.key === 'End') nextIndex = modes.length - 1;
          else if (event.key in keyOffsets) nextIndex = (index + keyOffsets[event.key] + modes.length) % modes.length;
          else return;

          event.preventDefault();
          const nextMode = modes[nextIndex].id;
          onChange(nextMode);
          document.getElementById(`tab-${nextMode}`)?.focus();
        }}
        onClick={() => onChange(item.id)}
        role="tab"
        tabIndex={mode === item.id ? 0 : -1}
        type="button"
      >
        <span className="mode-number">{item.number}</span>
        <span><strong>{item.title}</strong><small>{item.detail}</small></span>
      </button>
    ))}
  </div>
);

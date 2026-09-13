import type {ExperienceMode} from '../data';

type HeaderProps = {
  mode: ExperienceMode;
  onModeChange: (mode: ExperienceMode) => void;
};

const modes: Array<{id: ExperienceMode; label: string}> = [
  {id: 'cycle', label: 'Guided cycle'},
  {id: 'compare', label: 'Compare workload'},
  {id: 'tune', label: 'Tune & verify'},
];

export const Header = ({mode, onModeChange}: HeaderProps) => (
  <header className="site-header">
    <a className="brand-lockup" href="#top" aria-label="Checkpoint Ridge home">
      <span className="brand-mark" aria-hidden="true">▲</span>
      <span>
        <strong>CHECKPOINT RIDGE</strong>
        <small>POSTGRESQL · PERCONA COMMUNITY</small>
      </span>
    </a>

    <nav className="top-nav" aria-label="Experience sections">
      {modes.map((item) => (
        <button
          className={mode === item.id ? 'nav-button active' : 'nav-button'}
          key={item.id}
          onClick={() => onModeChange(item.id)}
          type="button"
        >
          {item.label}
        </button>
      ))}
    </nav>

    <a className="community-logo" href="https://percona.community/" target="_blank" rel="noreferrer">
      <img src="./assets/brand/percona-community-logo.svg" alt="Percona Community" />
    </a>
  </header>
);

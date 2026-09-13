import type {ExperienceMode} from '../data';

type HeroProps = {
  onStart: (mode: ExperienceMode) => void;
};

export const Hero = ({onStart}: HeroProps) => (
  <section className="hero" id="top">
    <div className="mountain-layer mountain-layer-back" aria-hidden="true" />
    <div className="mountain-layer mountain-layer-front" aria-hidden="true" />
    <div className="hero-grid page-shell">
      <div className="hero-copy">
        <div className="eyebrow"><span /> INTERACTIVE POSTGRESQL LAB</div>
        <h1>Make the checkpoint cycle visible.</h1>
        <p className="hero-deck">
          Follow dirty pages, checkpoint writes, full-page images, WAL, and recovery through one technically grounded interactive model.
        </p>
        <div className="hero-actions">
          <button className="button button-primary" type="button" onClick={() => onStart('cycle')}>
            Start the guided cycle <span aria-hidden="true">→</span>
          </button>
          <button className="button button-ghost" type="button" onClick={() => onStart('compare')}>
            Compare measured runs
          </button>
        </div>
        <div className="trust-row" aria-label="Project qualities">
          <span>PostgreSQL 18 reference</span>
          <span>Measured data separated from models</span>
          <span>Runs entirely in your browser</span>
        </div>
      </div>

      <div className="hero-goat-zone" aria-hidden="true">
        <div className="checkpoint-orbit">
          <span className="orbit-dot dot-one" />
          <span className="orbit-dot dot-two" />
          <span className="orbit-dot dot-three" />
          <span className="orbit-label">CHECKPOINT</span>
        </div>
        <img className="hero-goat" src="./assets/goats/goat-front.webp" alt="" />
      </div>
    </div>
    <div className="hero-scroll-cue" aria-hidden="true"><span /> FOLLOW THE WRITE</div>
  </section>
);

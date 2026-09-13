import {SOURCE_LINKS} from '../data';

export const FooterCta = () => (
  <footer className="footer-cta">
    <div className="footer-mountains" aria-hidden="true" />
    <div className="footer-content page-shell">
      <div className="footer-copy">
        <div className="eyebrow light"><span /> TAKE IT TO PRODUCTION</div>
        <h2>Take the next checkpoint with real data.</h2>
        <p>Read the complete technical analysis, compare notes with database practitioners, and bring your measurements into the Percona Community.</p>
        <div className="footer-actions">
          <a className="button button-primary" href={SOURCE_LINKS.analysis} target="_blank" rel="noreferrer">Read the full technical analysis <span aria-hidden="true">↗</span></a>
          <a className="button button-light" href={SOURCE_LINKS.slack} target="_blank" rel="noreferrer">Join Percona Community Slack <span aria-hidden="true">↗</span></a>
        </div>
        <a className="community-text-link" href={SOURCE_LINKS.community} target="_blank" rel="noreferrer">Explore Percona Community →</a>
      </div>
      <div className="cta-goat-zone" aria-hidden="true">
        <div className="community-plinth"><span>THE WAY IS OPEN.</span><small>LEARN · SHARE · KEEP CLIMBING</small></div>
        <img src="./assets/goats/goat-peek.webp" alt="" />
      </div>
    </div>
    <div className="footer-base page-shell"><span>CHECKPOINT RIDGE · OPEN EDUCATIONAL PROJECT</span><span>PERCONA COMMUNITY</span></div>
  </footer>
);

import {SOURCE_LINKS} from '../data';

const sources = [
  {label: 'PRIMARY ANALYSIS', title: 'Importance of Tuning Checkpoint in PostgreSQL', href: SOURCE_LINKS.analysis},
  {label: 'MECHANISM', title: 'PostgreSQL 18 · WAL Configuration', href: SOURCE_LINKS.walDocs},
  {label: 'SETTINGS', title: 'PostgreSQL 18 · WAL Runtime Settings', href: SOURCE_LINKS.settingsDocs},
  {label: 'MONITORING', title: 'PostgreSQL 18 · Cumulative Statistics', href: SOURCE_LINKS.monitoringDocs},
];

export const AccuracySection = () => (
  <section className="accuracy-section page-shell" id="accuracy">
    <div className="accuracy-intro">
      <div className="eyebrow"><span /> ACCURACY BOUNDARY</div>
      <h2>Every moving element makes a claim.</h2>
      <p>Checkpoint Ridge separates source measurements from time-compressed illustrations, and keeps the limits beside the result instead of hiding them in a footer.</p>
    </div>
    <div className="accuracy-columns">
      <article className="accuracy-card measured"><span>MEASURED</span><h3>Four fixed pgbench results</h3><p>Exact WAL and wal_fpi values from the PostgreSQL 18 test. Derived percentages use those unchanged values.</p></article>
      <article className="accuracy-card modeled"><span>MODELED</span><h3>Mechanism and direction</h3><p>Timing is compressed and page counts are representative. The model teaches relationships, not production latency.</p></article>
      <article className="accuracy-card operator"><span>OPERATOR DATA</span><h3>Your system decides</h3><p>Real tuning decisions require checkpoint logs, WAL statistics, recovery tests, storage headroom, and standby validation.</p></article>
    </div>
    <div className="source-list">
      {sources.map((source) => (
        <a href={source.href} key={source.label} target="_blank" rel="noreferrer"><span>{source.label}</span><strong>{source.title}</strong><i aria-hidden="true">↗</i></a>
      ))}
    </div>
  </section>
);

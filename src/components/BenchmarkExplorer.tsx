import {useMemo, useState} from 'react';
import {BENCHMARK, formatInteger, reductionFromBaseline} from '../data';

export const BenchmarkExplorer = () => {
  const [selectedGap, setSelectedGap] = useState(3600);
  const selected = BENCHMARK.find((point) => point.gapSeconds === selectedGap) ?? BENCHMARK[3];
  const baseline = BENCHMARK[0];
  const maxWal = Math.max(...BENCHMARK.map((point) => point.walGb));
  const maxFpi = Math.max(...BENCHMARK.map((point) => point.walFpi));

  const changes = useMemo(() => ({
    wal: reductionFromBaseline(selected.walGb, baseline.walGb),
    fpi: reductionFromBaseline(selected.walFpi, baseline.walFpi),
  }), [selected, baseline]);

  return (
    <div className="experience-panel compare-panel" id="panel-compare" role="tabpanel" aria-labelledby="tab-compare">
      <div className="experience-heading">
        <div>
          <div className="eyebrow"><span /> MEASURED EVIDENCE</div>
          <h2>Hold the workload steady. Move only the checkpoint gap.</h2>
        </div>
        <div className="measured-badge"><span /> MEASURED · POSTGRESQL 18 TEST</div>
      </div>

      <div className="benchmark-lock">
        <div><small>FIXED COMMAND</small><code>pgbench -c 2 -t 1110000</code></div>
        <p>Two clients. 1.11 million transactions per client. Same workload and schema in every run.</p>
      </div>

      <div className="interval-picker" role="radiogroup" aria-label="Checkpoint gap">
        {BENCHMARK.map((point) => (
          <button
            aria-checked={selectedGap === point.gapSeconds}
            className={selectedGap === point.gapSeconds ? 'interval-button active' : 'interval-button'}
            id={`gap-${point.gapSeconds}`}
            key={point.gapSeconds}
            onKeyDown={(event) => {
              const index = BENCHMARK.findIndex((candidate) => candidate.gapSeconds === point.gapSeconds);
              const offset = event.key === 'ArrowLeft' || event.key === 'ArrowUp'
                ? -1
                : event.key === 'ArrowRight' || event.key === 'ArrowDown'
                  ? 1
                  : 0;
              let nextIndex = index;
              if (event.key === 'Home') nextIndex = 0;
              else if (event.key === 'End') nextIndex = BENCHMARK.length - 1;
              else if (offset) nextIndex = (index + offset + BENCHMARK.length) % BENCHMARK.length;
              else return;

              event.preventDefault();
              const nextGap = BENCHMARK[nextIndex].gapSeconds;
              setSelectedGap(nextGap);
              document.getElementById(`gap-${nextGap}`)?.focus();
            }}
            onClick={() => setSelectedGap(point.gapSeconds)}
            role="radio"
            tabIndex={selectedGap === point.gapSeconds ? 0 : -1}
            type="button"
          >
            <strong>{point.shortLabel}</strong><small>{point.gapSeconds} seconds</small>
          </button>
        ))}
      </div>

      <div className="benchmark-grid">
        <article className="metric-card wal-card">
          <div className="metric-topline"><span>WAL GENERATED</span><small>source value</small></div>
          <div className="metric-value">{selected.walGb.toFixed(2)} <span>GB</span></div>
          <div className="bar-chart" role="img" aria-label={`WAL generated: ${selected.walGb.toFixed(2)} gigabytes`}>
            {BENCHMARK.map((point) => (
              <div className={point.gapSeconds === selectedGap ? 'bar-column active' : 'bar-column'} key={point.gapSeconds}>
                <div className="bar-value">{point.walGb.toFixed(2)}</div>
                <div className="bar purple" style={{height: `${(point.walGb / maxWal) * 100}%`}} />
                <span>{point.shortLabel}</span>
              </div>
            ))}
          </div>
          <div className="metric-change">{selectedGap === 300 ? 'BASELINE RUN' : `${changes.wal}% LOWER THAN THE 5-MINUTE RUN`}</div>
        </article>

        <article className="metric-card fpi-card">
          <div className="metric-topline"><span>FULL-PAGE IMAGES</span><small>wal_fpi</small></div>
          <div className="metric-value">{formatInteger(selected.walFpi)}</div>
          <div className="bar-chart" role="img" aria-label={`Full-page images: ${formatInteger(selected.walFpi)}`}>
            {BENCHMARK.map((point) => (
              <div className={point.gapSeconds === selectedGap ? 'bar-column active' : 'bar-column'} key={point.gapSeconds}>
                <div className="bar-value">{Math.round(point.walFpi / 1000)}k</div>
                <div className="bar yellow" style={{height: `${(point.walFpi / maxFpi) * 100}%`}} />
                <span>{point.shortLabel}</span>
              </div>
            ))}
          </div>
          <div className="metric-change">{selectedGap === 300 ? 'BASELINE RUN' : `${changes.fpi}% LOWER THAN THE 5-MINUTE RUN`}</div>
        </article>
      </div>

      <div className="evidence-boundary">
        <strong>WHAT THIS PROVES</strong>
        <p>For this fixed PostgreSQL 18 pgbench run, longer checkpoint gaps coincided with lower WAL and FPI counts.</p>
        <strong>WHAT IT DOES NOT PROVE</strong>
        <p>These values are not a prediction for another workload, schema, memory configuration, or storage system.</p>
      </div>

      <div className="repeated-write-card">
        <div className="repeated-write-copy">
          <div className="eyebrow"><span /> ANOTHER SOURCE OF SAVINGS</div>
          <h3>Give repeated changes a chance to share one checkpoint write.</h3>
          <p>A page written by one checkpoint can become dirty again and be written by a later checkpoint. With more time between checkpoints, several changes may accumulate before one checkpoint write.</p>
          <small>A background writer or buffer eviction can still write a dirty page earlier.</small>
        </div>
        <div className="write-patterns" aria-label="Conceptual comparison of repeated page writes">
          <div className="write-pattern">
            <span>FREQUENT CHECKPOINTS</span>
            <div><i className="page-event dirty-event">DIRTY</i><b>→</b><i className="page-event write-event">WRITE</i><b>→</b><i className="page-event dirty-event">DIRTY</i><b>→</b><i className="page-event write-event">WRITE</i></div>
            <small>Two checkpoint opportunities to write the page</small>
          </div>
          <div className="write-pattern calmer">
            <span>MORE TIME BETWEEN</span>
            <div><i className="page-event dirty-event">DIRTY</i><b>→</b><i className="page-event dirty-event">DIRTY</i><b>→</b><i className="page-event write-event">WRITE</i></div>
            <small>Several changes may reach one checkpoint write</small>
          </div>
        </div>
      </div>
    </div>
  );
};

export type ExperienceMode = 'cycle' | 'compare' | 'tune';

export type BenchmarkPoint = {
  gapSeconds: 300 | 900 | 1800 | 3600;
  label: string;
  shortLabel: string;
  walGb: number;
  walFpi: number;
};

export const BENCHMARK: readonly BenchmarkPoint[] = [
  {gapSeconds: 300, label: '5 minutes', shortLabel: '5 min', walGb: 11.93793559, walFpi: 1_476_817},
  {gapSeconds: 900, label: '15 minutes', shortLabel: '15 min', walGb: 5.382575691, walFpi: 608_279},
  {gapSeconds: 1800, label: '30 minutes', shortLabel: '30 min', walGb: 3.611122672, walFpi: 372_899},
  {gapSeconds: 3600, label: '60 minutes', shortLabel: '60 min', walGb: 2.030713106, walFpi: 161_776},
] as const;

export const SOURCE_LINKS = {
  analysis: 'https://www.percona.com/blog/importance-of-tuning-checkpoint-in-postgresql/',
  walDocs: 'https://www.postgresql.org/docs/18/wal-configuration.html',
  settingsDocs: 'https://www.postgresql.org/docs/18/runtime-config-wal.html',
  monitoringDocs: 'https://www.postgresql.org/docs/18/monitoring-stats.html',
  community: 'https://percona.community/',
  slack: 'https://join.slack.com/t/percona/shared_invite/zt-3zqzw80xz-864PxCOIiiilYSVMnoN5ow',
} as const;

export type CycleStage = {
  id: string;
  start: number;
  end: number;
  kicker: string;
  title: string;
  body: string;
  detail: string;
};

export const CYCLE_STAGES: readonly CycleStage[] = [
  {
    id: 'pressure',
    start: 0,
    end: 0.2,
    kicker: '01 · BUILD PRESSURE',
    title: 'Transactions leave pages dirty in memory.',
    body: 'A steady workload modifies pages in shared_buffers. The data pages do not need to reach storage at every commit.',
    detail: 'This model focuses on checkpoint work. The background writer or buffer eviction can write a dirty page earlier.',
  },
  {
    id: 'write',
    start: 0.2,
    end: 0.48,
    kicker: '02 · SPREAD THE WRITE',
    title: 'Checkpoint writes are paced, not dumped at once.',
    body: 'PostgreSQL works through the dirty data pages and spreads checkpoint I/O across the available completion window.',
    detail: 'checkpoint_completion_target controls how much of the interval is available for this pacing.',
  },
  {
    id: 'sync',
    start: 0.48,
    end: 0.58,
    kicker: '03 · SYNCHRONIZE',
    title: 'Written files are synchronized with storage.',
    body: 'The checkpoint finishes the durability work for the files written during the checkpoint.',
    detail: 'The write phase and the final synchronization phase are shown separately on purpose.',
  },
  {
    id: 'boundary',
    start: 0.58,
    end: 0.66,
    kicker: '04 · ADVANCE THE BOUNDARY',
    title: 'The recorded redo location moves forward.',
    body: 'Recovery can begin from the new checkpoint. Older WAL becomes eligible for removal or recycling only when recovery, archiving, and retention no longer need it.',
    detail: 'Eligibility is not the same as immediate deletion: archiving, replicas, and slots can retain WAL.',
  },
  {
    id: 'fpi',
    start: 0.66,
    end: 0.84,
    kicker: '05 · WATCH THE FIRST CHANGE',
    title: 'The first page modification carries more WAL.',
    body: 'With full_page_writes enabled, the first modification of each page after the checkpoint records a full-page image in WAL so recovery can repair a torn data page.',
    detail: 'It is the first modification of each page—not every modification and not the checkpoint write itself.',
  },
  {
    id: 'settle',
    start: 0.84,
    end: 1.01,
    kicker: '06 · LET THE ACTIVITY SETTLE',
    title: 'Later changes avoid repeating that page’s FPI.',
    body: 'WAL and I/O pressure can fall as more active pages have already crossed their first post-checkpoint modification.',
    detail: 'The size and shape of the effect depend on workload, schema, memory pressure, and storage.',
  },
] as const;

export const getCycleStage = (progress: number): CycleStage =>
  CYCLE_STAGES.find((stage) => progress >= stage.start && progress < stage.end) ?? CYCLE_STAGES[0];

export const formatInteger = (value: number) => new Intl.NumberFormat('en-US').format(value);

export const reductionFromBaseline = (value: number, baseline: number) =>
  Math.round((1 - value / baseline) * 1000) / 10;

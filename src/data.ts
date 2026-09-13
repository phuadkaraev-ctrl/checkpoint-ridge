export type ScenarioId =
  | 'overview'
  | 'cycle'
  | 'fpi'
  | 'evidence'
  | 'tune'
  | 'recovery';

export type EvidenceClass =
  | 'Concept'
  | 'Measured'
  | 'Directional model'
  | 'Observed + concept';

export type SystemNodeId =
  | 'clients'
  | 'buffers'
  | 'wal'
  | 'checkpointer'
  | 'storage'
  | 'pgcontrol'
  | 'standby';

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
  focus: SystemNodeId;
};

export const CYCLE_STAGES: readonly CycleStage[] = [
  {
    id: 'pressure',
    start: 0,
    end: 0.2,
    kicker: '01 · DIRTY PAGES ACCUMULATE',
    title: 'Transactions keep changing pages in memory.',
    body: 'A steady workload modifies pages in shared_buffers. WAL provides the durability path, so those data pages do not need to reach storage at every commit.',
    detail: 'Dirty pages may also be written earlier by the background writer or buffer eviction.',
    focus: 'buffers',
  },
  {
    id: 'write',
    start: 0.2,
    end: 0.48,
    kicker: '02 · CHECKPOINT WRITES',
    title: 'Checkpoint I/O is paced across its window.',
    body: 'PostgreSQL identifies dirty data pages and gradually writes them toward storage.',
    detail: 'checkpoint_completion_target controls how much of the interval is available for pacing.',
    focus: 'checkpointer',
  },
  {
    id: 'sync',
    start: 0.48,
    end: 0.58,
    kicker: '03 · FILES ARE SYNCHRONIZED',
    title: 'The durability boundary reaches storage.',
    body: 'PostgreSQL synchronizes files written during the checkpoint to durable storage before completing it.',
    detail: 'The paced page-write phase and final file-synchronization phase are shown separately on purpose.',
    focus: 'storage',
  },
  {
    id: 'boundary',
    start: 0.58,
    end: 0.66,
    kicker: '04 · REDO MOVES FORWARD',
    title: 'The recovery boundary moves forward.',
    body: 'A checkpoint record in WAL and updated checkpoint information in global/pg_control identify the new recovery boundary.',
    detail: 'Older WAL may now be recyclable, but archiving, standbys, replication slots, backups, and retention settings can still require it.',
    focus: 'pgcontrol',
  },
  {
    id: 'fpi',
    start: 0.66,
    end: 0.84,
    kicker: '05 · FIRST CHANGES GET HEAVIER',
    title: 'The first post-checkpoint page change adds an FPI.',
    body: 'With full_page_writes enabled, the first modification of each page after a checkpoint records a full-page image in WAL.',
    detail: 'It is the first modification of each page—not every change and not the checkpoint write itself.',
    focus: 'wal',
  },
  {
    id: 'settle',
    start: 0.84,
    end: 1.01,
    kicker: '06 · ACTIVITY SETTLES',
    title: 'Later changes avoid repeating that page’s FPI.',
    body: 'WAL and I/O pressure can fall as active pages cross their first post-checkpoint modification.',
    detail: 'The size and shape of the effect depend on workload, schema, memory pressure, and storage.',
    focus: 'buffers',
  },
] as const;

export type Scenario = {
  id: ScenarioId;
  index: string;
  tab: string;
  eyebrow: string;
  title: string;
  body: string;
  boundary: string;
  evidence: EvidenceClass;
  focus: SystemNodeId;
  autoPlay: boolean;
};

export const SCENARIOS: readonly Scenario[] = [
  {
    id: 'overview',
    index: '00',
    tab: 'System map',
    eyebrow: 'POSTGRESQL CHECKPOINT RIDGE',
    title: 'Explore the checkpoint system as one connected landscape.',
    body: 'Orbit the ridge, select a district, or run a guided scenario to see where dirty pages, WAL, storage writes, recovery, and standby replay meet.',
    boundary: 'This is an explanatory system map. Only the benchmark view reports measured values.',
    evidence: 'Concept',
    focus: 'buffers',
    autoPlay: true,
  },
  {
    id: 'cycle',
    index: '01',
    tab: 'Checkpoint path',
    eyebrow: 'GUIDED SYSTEM RUN',
    title: 'Follow one checkpoint from dirty memory to a new redo boundary.',
    body: 'The camera follows a simplified technical sequence: dirty pages, paced writes, file synchronization, the recovery boundary, then the FPI wave.',
    boundary: 'This sequence explains the mechanism but omits lower-level internals. Its signals are not production telemetry.',
    evidence: 'Concept',
    focus: 'buffers',
    autoPlay: true,
  },
  {
    id: 'fpi',
    index: '02',
    tab: 'FPI wave',
    eyebrow: 'WHY THE SAWTOOTH APPEARS',
    title: 'A steady workload can still produce uneven WAL pressure.',
    body: 'After a checkpoint, many pages are candidates for their first post-checkpoint modification. Full-page images rise, then taper as those first changes are crossed.',
    boundary: 'The curve is conceptual. Its exact shape is workload dependent.',
    evidence: 'Concept',
    focus: 'wal',
    autoPlay: true,
  },
  {
    id: 'evidence',
    index: '03',
    tab: 'Measured test',
    eyebrow: 'FIXED PGBENCH WORKLOAD',
    title: 'One fixed pgbench command. Four configured checkpoint gaps.',
    body: 'Two clients each ran 1.11 million transactions. The interface preserves the four WAL and wal_fpi observations reported by the author.',
    boundary: 'Do not interpolate these results to another system. Workload and schema determine the savings.',
    evidence: 'Measured',
    focus: 'wal',
    autoPlay: false,
  },
  {
    id: 'tune',
    index: '04',
    tab: 'Tuning console',
    eyebrow: 'THREE CONTROLS, ONE SYSTEM',
    title: 'Plan the interval, make room for WAL, and spread the I/O.',
    body: 'Adjust checkpoint_timeout, max_wal_size, and checkpoint_completion_target. The visual response is directional so you can reason about the trade-offs safely.',
    boundary: 'There is no universal safe value. Validate against your workload, WAL rate, storage, archiving, replication, and recovery requirements.',
    evidence: 'Directional model',
    focus: 'checkpointer',
    autoPlay: false,
  },
  {
    id: 'recovery',
    index: '05',
    tab: 'Recovery ground',
    eyebrow: 'THE COMMON FEAR',
    title: 'A 60-minute checkpoint gap does not mean 60-minute recovery.',
    body: 'Recovery depends on the WAL that must be replayed and the speed at which PostgreSQL can apply it. Longer gaps can increase replay work, while tuning can also reduce WAL generation.',
    boundary: 'The two log examples are observed. The replay animation and HA branch are conceptual and do not predict recovery time.',
    evidence: 'Observed + concept',
    focus: 'pgcontrol',
    autoPlay: true,
  },
] as const;

export type SystemNode = {
  id: SystemNodeId;
  short: string;
  label: string;
  role: string;
  detail: string;
  color: string;
  world: readonly [number, number, number];
  map: readonly [number, number];
};

export const SYSTEM_NODES: readonly SystemNode[] = [
  {id: 'clients', short: 'CLIENTS', label: 'Client backends', role: 'Generate transactions and change table pages.', detail: 'With the default synchronous_commit behavior, commits wait for local WAL flush. Modified data pages can remain dirty in shared_buffers.', color: '#43d9ff', world: [-6, 0, 3], map: [28, 77]},
  {id: 'buffers', short: 'BUFFER POOL', label: 'shared_buffers', role: 'Holds cached pages, including modified dirty pages.', detail: 'Checkpoint processing identifies dirty pages here, but checkpoints are not the only way a dirty page reaches storage.', color: '#7c63ff', world: [-3, 0, 1.5], map: [45, 51]},
  {id: 'wal', short: 'WAL', label: 'WAL ridge', role: 'Records changes needed for durability and recovery.', detail: 'With full_page_writes enabled, the first modification of a page after a checkpoint includes a full-page image.', color: '#ffad42', world: [-4, 0, -3], map: [32, 24]},
  {id: 'checkpointer', short: 'CHECKPOINTER', label: 'Checkpointer', role: 'Coordinates checkpoint writes and completion.', detail: 'Writes can be spread across the completion window before final synchronization.', color: '#f6fe54', world: [0, 0, 0], map: [58, 45]},
  {id: 'storage', short: 'STORAGE', label: 'Data storage', role: 'Receives written data pages and file synchronization.', detail: 'I/O capacity and latency affect how smoothly checkpoint work can be absorbed.', color: '#56e3a2', world: [4, 0, 2.5], map: [75, 67]},
  {id: 'pgcontrol', short: 'PG_CONTROL', label: 'global/pg_control', role: 'Stores control information for the latest checkpoint.', detail: 'Together with the checkpoint record in WAL, it identifies the redo point from which crash recovery begins.', color: '#ff6685', world: [3.5, 0, -3], map: [74, 28]},
  {id: 'standby', short: 'STANDBY', label: 'Physical standby', role: 'Receives and replays WAL from the primary.', detail: 'Lower WAL volume can reduce pressure on archiving, storage, replication, and network bandwidth.', color: '#b886ff', world: [6.5, 0, -4], map: [88, 16]},
] as const;

export type RecoveryExample = {
  startLsn: string;
  endLsn: string;
  bytes: number;
  timeSeconds: number;
  throughputMiB: number;
};

export const RECOVERY_EXAMPLES: readonly RecoveryExample[] = [
  {
    startLsn: '14/EB49CB90',
    endLsn: '15/6BEECAD8',
    bytes: 2_158_296_904,
    timeSeconds: 25.59,
    throughputMiB: 80.4,
  },
  {
    startLsn: '15/6BEECB78',
    endLsn: '16/83686B48',
    bytes: 4_688_814_032,
    timeSeconds: 69.08,
    throughputMiB: 64.7,
  },
] as const;

export const getCycleStage = (progress: number): CycleStage =>
  CYCLE_STAGES.find((stage) => progress >= stage.start && progress < stage.end) ?? CYCLE_STAGES[0];

export const getScenario = (id: ScenarioId): Scenario =>
  SCENARIOS.find((scenario) => scenario.id === id) ?? SCENARIOS[0];

export const getSystemNode = (id: SystemNodeId): SystemNode =>
  SYSTEM_NODES.find((node) => node.id === id) ?? SYSTEM_NODES[0];

export const formatInteger = (value: number) => new Intl.NumberFormat('en-US').format(value);

export const reductionFromBaseline = (value: number, baseline: number) =>
  Math.round((1 - value / baseline) * 1000) / 10;

export const ratioToBaseline = (value: number, baseline: number) => value / baseline;

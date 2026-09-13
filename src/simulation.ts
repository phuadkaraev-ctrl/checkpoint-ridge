import {BENCHMARK, getCycleStage, ratioToBaseline, type ScenarioId} from './data';

export type TuningInputs = {
  timeoutMinutes: number;
  maxWalGiB: number;
  completionTarget: number;
  walRateGiBPerHour: number;
};

export type BenchmarkRatios = {
  wal: number;
  fpi: number;
};

export type TuningDerived = {
  projectedWalGiB: number;
  walTriggerMinutes: number;
  effectiveIntervalMinutes: number;
  bindingTrigger: 'timeout' | 'wal';
  headroomGiB: number;
};

export type ModelSnapshot = {
  phase: string;
  phaseDetail: string;
  dirtyPages: number;
  walIntensity: number;
  fpiIntensity: number;
  checkpointIntensity: number;
  storageIntensity: number;
  replayIntensity: number;
  standbyIntensity: number;
  redoAdvanced: boolean;
  goatVisible: boolean;
};

const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value));
const ease = (value: number) => {
  const x = clamp(value);
  return x * x * (3 - 2 * x);
};

export const getFpiSignal = (progress: number, cycles = 2) => {
  const bounded = Math.min(0.999999, clamp(progress));
  const cycleProgress = (bounded * cycles) % 1;
  const fpi = 0.18 + 0.82 * (1 - ease(cycleProgress));
  const checkpoint = cycleProgress < 0.075
    ? 1 - (cycleProgress / 0.075) * 0.5
    : 0.1;
  return {cycleProgress, fpi: clamp(fpi), checkpoint: clamp(checkpoint)};
};

export const getTuningDerived = (tuning: TuningInputs): TuningDerived => {
  const walRate = Math.max(0.1, tuning.walRateGiBPerHour);
  const projectedWalGiB = walRate * (tuning.timeoutMinutes / 60);
  const walTriggerMinutes = (tuning.maxWalGiB / walRate) * 60;
  const bindingTrigger = walTriggerMinutes < tuning.timeoutMinutes ? 'wal' : 'timeout';
  return {
    projectedWalGiB,
    walTriggerMinutes,
    effectiveIntervalMinutes: Math.min(tuning.timeoutMinutes, walTriggerMinutes),
    bindingTrigger,
    headroomGiB: tuning.maxWalGiB - projectedWalGiB,
  };
};

const cycleSnapshot = (progress: number): ModelSnapshot => {
  const stage = getCycleStage(progress);
  const local = clamp((progress - stage.start) / (stage.end - stage.start));
  const isWriting = stage.id === 'write';
  const isSync = stage.id === 'sync';
  const isFpi = stage.id === 'fpi';
  const settling = stage.id === 'settle';
  const postCheckpointSignal = getFpiSignal(clamp((progress - 0.66) / 0.35), 1);
  const dirtyPages = stage.id === 'pressure'
    ? 22 + Math.round(local * 66)
    : isWriting
      ? 88 - Math.round(ease(local) * 64)
      : isSync
        ? 24 - Math.round(ease(local) * 2)
        : stage.id === 'boundary'
          ? 22 + Math.round(local * 2)
          : isFpi
            ? 24 + Math.round(ease(local) * 28)
            : 52 + Math.round(ease(local) * 16);

  return {
    phase: stage.kicker.replace(/^\d+ · /, ''),
    phaseDetail: stage.title,
    dirtyPages,
    walIntensity: isFpi || settling ? 0.24 + postCheckpointSignal.fpi * 0.72 : 0.34 + 0.08 * Math.sin(progress * 20),
    fpiIntensity: isFpi || settling ? postCheckpointSignal.fpi : 0.08,
    checkpointIntensity: isWriting ? 0.45 + 0.5 * Math.sin(local * Math.PI) : isSync ? 1 : isFpi ? postCheckpointSignal.checkpoint : 0.12,
    storageIntensity: isWriting ? 0.62 : isSync ? 1 : 0.18,
    replayIntensity: 0.06,
    standbyIntensity: stage.id === 'boundary' ? 0.26 : 0.08,
    redoAdvanced: progress >= 0.62,
    goatVisible: isFpi || settling,
  };
};

export const getModelSnapshot = (
  scenario: ScenarioId,
  progress: number,
  tuning: TuningInputs,
  evidenceRatios: BenchmarkRatios,
): ModelSnapshot => {
  if (scenario === 'cycle') return cycleSnapshot(progress);

  if (scenario === 'fpi') {
    const signal = getFpiSignal(progress);
    return {
      phase: signal.cycleProgress < 0.075
        ? 'NEW CHECKPOINT CYCLE'
        : signal.fpi > 0.64
          ? 'FPI PRESSURE HIGH'
          : 'FPI PRESSURE TAPERS',
      phaseDetail: signal.cycleProgress < 0.075
        ? 'A new first-change FPI window has opened'
        : 'First changes cross the active page set',
      dirtyPages: 28 + Math.round(ease(signal.cycleProgress) * 40),
      walIntensity: 0.24 + signal.fpi * 0.72,
      fpiIntensity: signal.fpi,
      checkpointIntensity: signal.checkpoint,
      storageIntensity: 0.22 + signal.fpi * 0.48,
      replayIntensity: 0.08,
      standbyIntensity: 0.12,
      redoAdvanced: signal.cycleProgress < 0.12,
      goatVisible: true,
    };
  }

  if (scenario === 'evidence') {
    return {
      phase: 'PUBLISHED PGBENCH OBSERVATION',
      phaseDetail: 'WAL and FPI signals are normalized to the five-minute run',
      dirtyPages: 50,
      walIntensity: clamp(evidenceRatios.wal),
      fpiIntensity: clamp(evidenceRatios.fpi),
      checkpointIntensity: clamp(0.18 + evidenceRatios.fpi * 0.5),
      storageIntensity: clamp(0.2 + evidenceRatios.wal * 0.58),
      replayIntensity: 0.08,
      standbyIntensity: clamp(0.12 + evidenceRatios.wal * 0.3),
      redoAdvanced: true,
      goatVisible: false,
    };
  }

  if (scenario === 'tune') {
    const derived = getTuningDerived(tuning);
    const intervalRelief = clamp((derived.effectiveIntervalMinutes - 5) / 55);
    const capacityHeadroom = clamp(tuning.maxWalGiB / Math.max(derived.projectedWalGiB, 0.1));
    const pacing = clamp(tuning.completionTarget);
    const walPressure = derived.bindingTrigger === 'wal' ? 1 - capacityHeadroom : 0;
    return {
      phase: derived.bindingTrigger === 'wal' ? 'WAL TRIGGER BINDS FIRST' : 'TIMEOUT TRIGGER PLANNED',
      phaseDetail: derived.bindingTrigger === 'wal'
        ? `Soft WAL target is reached at about ${Math.round(derived.walTriggerMinutes)} minutes`
        : `Modeled interval remains ${Math.round(derived.effectiveIntervalMinutes)} minutes`,
      dirtyPages: 38 + Math.round(intervalRelief * 38),
      walIntensity: clamp(0.76 - intervalRelief * 0.38 + walPressure * 0.28),
      fpiIntensity: clamp(0.82 - intervalRelief * 0.55 + walPressure * 0.35),
      checkpointIntensity: clamp(0.72 - intervalRelief * 0.34 + walPressure * 0.38),
      storageIntensity: clamp(0.84 - pacing * 0.54 + walPressure * 0.28),
      replayIntensity: clamp(0.2 + intervalRelief * 0.38),
      standbyIntensity: clamp(0.16 + intervalRelief * 0.18),
      redoAdvanced: true,
      goatVisible: false,
    };
  }

  if (scenario === 'recovery') {
    const replay = ease(progress);
    return {
      phase: replay < 0.25 ? 'CRASH BOUNDARY' : replay < 0.9 ? 'WAL REPLAY' : 'RECOVERY COMPLETE',
      phaseDetail: replay < 0.25
        ? 'Read the latest checkpoint record and redo location'
        : replay < 0.9
          ? 'Replay local WAL from the redo point into data files'
          : 'Primary recovery is complete; standby failover is a separate HA path',
      dirtyPages: Math.round(18 * (1 - replay)), walIntensity: 0.34, fpiIntensity: 0.12, checkpointIntensity: 0.1,
      storageIntensity: 0.28 + replay * 0.35,
      replayIntensity: replay < 0.9 ? 0.9 : 0.14,
      standbyIntensity: replay > 0.9 ? 0.34 : 0.08,
      redoAdvanced: replay > 0.9,
      goatVisible: false,
    };
  }

  const overviewPulse = 0.5 + 0.5 * Math.sin(progress * Math.PI * 2);
  return {phase: 'LIVE SYSTEM MAP', phaseDetail: 'Choose a district or launch a guided scenario', dirtyPages: 48 + Math.round(overviewPulse * 20), walIntensity: 0.38 + overviewPulse * 0.16, fpiIntensity: 0.18, checkpointIntensity: 0.26, storageIntensity: 0.32, replayIntensity: 0.08, standbyIntensity: 0.18, redoAdvanced: true, goatVisible: false};
};

export const benchmarkRatios = (gapSeconds: number): BenchmarkRatios => {
  const selected = BENCHMARK.find((point) => point.gapSeconds === gapSeconds) ?? BENCHMARK[0];
  return {
    wal: ratioToBaseline(selected.walGb, BENCHMARK[0].walGb),
    fpi: ratioToBaseline(selected.walFpi, BENCHMARK[0].walFpi),
  };
};

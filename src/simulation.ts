import {BENCHMARK, getCycleStage, type ScenarioId} from './data';

export type TuningInputs = {
  timeoutMinutes: number;
  maxWalGiB: number;
  completionTarget: number;
  illustrativeWalGiB: number;
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
  redoAdvanced: boolean;
  goatVisible: boolean;
};

const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value));
const ease = (value: number) => {
  const x = clamp(value);
  return x * x * (3 - 2 * x);
};

const cycleSnapshot = (progress: number): ModelSnapshot => {
  const stage = getCycleStage(progress);
  const local = clamp((progress - stage.start) / (stage.end - stage.start));
  const isWriting = stage.id === 'write';
  const isSync = stage.id === 'sync';
  const isFpi = stage.id === 'fpi';
  const settling = stage.id === 'settle';
  const dirtyPages = stage.id === 'pressure'
    ? 22 + Math.round(local * 66)
    : isWriting
      ? 88 - Math.round(ease(local) * 64)
      : isSync || stage.id === 'boundary'
        ? 22
        : 28 + Math.round(local * 35);

  return {
    phase: stage.kicker.replace(/^\d+ · /, ''),
    phaseDetail: stage.title,
    dirtyPages,
    walIntensity: isFpi ? 0.92 : settling ? 0.7 - local * 0.46 : 0.34 + 0.08 * Math.sin(progress * 20),
    fpiIntensity: isFpi ? 1 - local * 0.28 : settling ? 0.55 - local * 0.42 : 0.08,
    checkpointIntensity: isWriting ? 0.45 + 0.5 * Math.sin(local * Math.PI) : isSync ? 1 : 0.12,
    storageIntensity: isWriting ? 0.62 : isSync ? 1 : 0.18,
    replayIntensity: stage.id === 'boundary' ? 0.3 : 0.08,
    redoAdvanced: progress >= 0.62,
    goatVisible: isFpi || settling,
  };
};

export const getModelSnapshot = (
  scenario: ScenarioId,
  progress: number,
  tuning: TuningInputs,
  evidenceWalRatio: number,
): ModelSnapshot => {
  if (scenario === 'cycle') return cycleSnapshot(progress);

  if (scenario === 'fpi') {
    const wave = 0.5 + 0.5 * Math.sin(progress * Math.PI * 4 - Math.PI / 2);
    return {
      phase: wave > 0.68 ? 'POST-CHECKPOINT FPI WAVE' : 'ACTIVITY TAPERS',
      phaseDetail: 'Conceptual intensity under a steady workload',
      dirtyPages: 45 + Math.round(progress * 20),
      walIntensity: 0.22 + wave * 0.76,
      fpiIntensity: 0.12 + wave * 0.88,
      checkpointIntensity: wave < 0.15 ? 0.95 : 0.12,
      storageIntensity: 0.24 + wave * 0.48,
      replayIntensity: 0.12,
      redoAdvanced: wave < 0.2,
      goatVisible: true,
    };
  }

  if (scenario === 'evidence') {
    return {phase: 'MEASURED PGBENCH RUN', phaseDetail: 'Exact observation selected in the inspector', dirtyPages: 52, walIntensity: clamp(evidenceWalRatio), fpiIntensity: clamp(evidenceWalRatio * 0.9), checkpointIntensity: clamp(0.22 + evidenceWalRatio * 0.58), storageIntensity: clamp(0.2 + evidenceWalRatio * 0.64), replayIntensity: 0.18, redoAdvanced: true, goatVisible: false};
  }

  if (scenario === 'tune') {
    const timeoutRelief = clamp((tuning.timeoutMinutes - 5) / 55);
    const capacityHeadroom = clamp(tuning.maxWalGiB / Math.max(tuning.illustrativeWalGiB, 0.1));
    const pacing = clamp(tuning.completionTarget);
    const prematureRisk = capacityHeadroom < 1 ? 1 - capacityHeadroom : 0;
    return {
      phase: prematureRisk > 0.15 ? 'WAL-SIZE PRESSURE' : 'PLANNED CHECKPOINT WINDOW',
      phaseDetail: prematureRisk > 0.15 ? 'The modeled WAL volume exceeds the selected soft WAL target' : 'The selected controls leave directional headroom',
      dirtyPages: 38 + Math.round(timeoutRelief * 38),
      walIntensity: clamp(0.76 - timeoutRelief * 0.38 + prematureRisk * 0.28),
      fpiIntensity: clamp(0.82 - timeoutRelief * 0.55 + prematureRisk * 0.35),
      checkpointIntensity: clamp(0.72 - timeoutRelief * 0.34 + prematureRisk * 0.38),
      storageIntensity: clamp(0.84 - pacing * 0.54 + prematureRisk * 0.28),
      replayIntensity: clamp(0.2 + timeoutRelief * 0.38),
      redoAdvanced: true,
      goatVisible: false,
    };
  }

  if (scenario === 'recovery') {
    const replay = ease(progress);
    return {
      phase: replay < 0.25 ? 'CRASH BOUNDARY' : replay < 0.9 ? 'WAL REPLAY' : 'RECOVERY COMPLETE',
      phaseDetail: replay < 0.9 ? 'Apply WAL after the last completed checkpoint' : 'The standby path remains available for HA',
      dirtyPages: Math.round(18 * (1 - replay)), walIntensity: 0.34, fpiIntensity: 0.12, checkpointIntensity: 0.1,
      storageIntensity: 0.28 + replay * 0.35, replayIntensity: replay < 0.9 ? 0.9 : 0.14, redoAdvanced: replay > 0.9, goatVisible: false,
    };
  }

  const overviewPulse = 0.5 + 0.5 * Math.sin(progress * Math.PI * 2);
  return {phase: 'LIVE SYSTEM MAP', phaseDetail: 'Choose a district or launch a guided scenario', dirtyPages: 48 + Math.round(overviewPulse * 20), walIntensity: 0.38 + overviewPulse * 0.16, fpiIntensity: 0.18, checkpointIntensity: 0.26, storageIntensity: 0.32, replayIntensity: 0.18, redoAdvanced: true, goatVisible: false};
};

export const benchmarkRatio = (gapSeconds: number) => {
  const selected = BENCHMARK.find((point) => point.gapSeconds === gapSeconds) ?? BENCHMARK[0];
  return selected.walGb / BENCHMARK[0].walGb;
};

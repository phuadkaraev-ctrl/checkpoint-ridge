import {describe, expect, it} from 'vitest';
import {BENCHMARK, CYCLE_STAGES, RECOVERY_EXAMPLES, SCENARIOS, SYSTEM_NODES, getCycleStage, reductionFromBaseline} from './data';
import {benchmarkRatios, getFpiSignal, getModelSnapshot, getTuningDerived} from './simulation';

describe('verified checkpoint content', () => {
  it('preserves the four PostgreSQL 18 pgbench measurements exactly', () => {
    expect(BENCHMARK).toEqual([
      {gapSeconds: 300, label: '5 minutes', shortLabel: '5 min', walGb: 11.93793559, walFpi: 1_476_817},
      {gapSeconds: 900, label: '15 minutes', shortLabel: '15 min', walGb: 5.382575691, walFpi: 608_279},
      {gapSeconds: 1800, label: '30 minutes', shortLabel: '30 min', walGb: 3.611122672, walFpi: 372_899},
      {gapSeconds: 3600, label: '60 minutes', shortLabel: '60 min', walGb: 2.030713106, walFpi: 161_776},
    ]);
  });

  it('keeps every point in the guided cycle covered by one stage', () => {
    for (let index = 0; index <= 100; index += 1) {
      expect(getCycleStage(index / 100)).toBeDefined();
    }
    expect(CYCLE_STAGES[0].start).toBe(0);
    expect(CYCLE_STAGES.at(-1)?.end).toBeGreaterThan(1);
  });

  it('derives benchmark reductions without changing source measurements', () => {
    expect(reductionFromBaseline(BENCHMARK[3].walGb, BENCHMARK[0].walGb)).toBe(83);
    expect(reductionFromBaseline(BENCHMARK[3].walFpi, BENCHMARK[0].walFpi)).toBe(89);
  });

  it('keeps WAL and FPI evidence on separate measured ratios', () => {
    const ratios = benchmarkRatios(3600);
    expect(ratios.wal).toBeCloseTo(2.030713106 / 11.93793559, 12);
    expect(ratios.fpi).toBeCloseTo(161_776 / 1_476_817, 12);
    expect(ratios.wal).not.toBeCloseTo(ratios.fpi, 3);
  });

  it('uses the same FPI signal for the scenario snapshot', () => {
    const progress = 0.37;
    const signal = getFpiSignal(progress);
    const snapshot = getModelSnapshot('fpi', progress, {timeoutMinutes: 30, maxWalGiB: 8, completionTarget: 0.9, walRateGiBPerHour: 12}, benchmarkRatios(3600));
    expect(snapshot.fpiIntensity).toBeCloseTo(signal.fpi, 12);
  });

  it('stops extending the modeled interval when the soft WAL trigger binds first', () => {
    const atFifty = getTuningDerived({timeoutMinutes: 50, maxWalGiB: 8, completionTarget: 0.9, walRateGiBPerHour: 12});
    const atSixty = getTuningDerived({timeoutMinutes: 60, maxWalGiB: 8, completionTarget: 0.9, walRateGiBPerHour: 12});
    expect(atFifty.bindingTrigger).toBe('wal');
    expect(atSixty.bindingTrigger).toBe('wal');
    expect(atFifty.effectiveIntervalMinutes).toBeCloseTo(40, 12);
    expect(atSixty.effectiveIntervalMinutes).toBeCloseTo(40, 12);
  });

  it('preserves both recovery-log calculations', () => {
    expect(RECOVERY_EXAMPLES).toEqual([
      {startLsn: '14/EB49CB90', endLsn: '15/6BEECAD8', bytes: 2_158_296_904, timeSeconds: 25.59, throughputMiB: 80.4},
      {startLsn: '15/6BEECB78', endLsn: '16/83686B48', bytes: 4_688_814_032, timeSeconds: 69.08, throughputMiB: 64.7},
    ]);
  });

  it('keeps every scenario and system district uniquely addressable', () => {
    expect(new Set(SCENARIOS.map((scenario) => scenario.id)).size).toBe(SCENARIOS.length);
    expect(new Set(SYSTEM_NODES.map((node) => node.id)).size).toBe(SYSTEM_NODES.length);
    expect(SCENARIOS).toHaveLength(6);
    expect(SYSTEM_NODES).toHaveLength(7);
  });

  it('keeps every modeled signal within a normalized boundary', () => {
    const tuning = {timeoutMinutes: 30, maxWalGiB: 8, completionTarget: 0.9, walRateGiBPerHour: 12};
    for (const scenario of SCENARIOS) {
      for (let step = 0; step <= 100; step += 1) {
        const snapshot = getModelSnapshot(scenario.id, step / 100, tuning, benchmarkRatios(3600));
        for (const signal of [snapshot.walIntensity, snapshot.fpiIntensity, snapshot.checkpointIntensity, snapshot.storageIntensity, snapshot.replayIntensity, snapshot.standbyIntensity]) {
          expect(signal).toBeGreaterThanOrEqual(0);
          expect(signal).toBeLessThanOrEqual(1);
        }
        expect(snapshot.dirtyPages).toBeGreaterThanOrEqual(0);
        expect(snapshot.dirtyPages).toBeLessThanOrEqual(100);
      }
    }
  });
});

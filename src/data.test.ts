import {describe, expect, it} from 'vitest';
import {BENCHMARK, CYCLE_STAGES, SCENARIOS, SYSTEM_NODES, getCycleStage, reductionFromBaseline} from './data';
import {getModelSnapshot} from './simulation';

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

  it('keeps every scenario and system district uniquely addressable', () => {
    expect(new Set(SCENARIOS.map((scenario) => scenario.id)).size).toBe(SCENARIOS.length);
    expect(new Set(SYSTEM_NODES.map((node) => node.id)).size).toBe(SYSTEM_NODES.length);
    expect(SCENARIOS).toHaveLength(6);
    expect(SYSTEM_NODES).toHaveLength(7);
  });

  it('keeps every modeled signal within a normalized boundary', () => {
    const tuning = {timeoutMinutes: 30, maxWalGiB: 8, completionTarget: 0.9, illustrativeWalGiB: 6};
    for (const scenario of SCENARIOS) {
      for (let step = 0; step <= 100; step += 1) {
        const snapshot = getModelSnapshot(scenario.id, step / 100, tuning, BENCHMARK[3].walGb / BENCHMARK[0].walGb);
        for (const signal of [snapshot.walIntensity, snapshot.fpiIntensity, snapshot.checkpointIntensity, snapshot.storageIntensity, snapshot.replayIntensity]) {
          expect(signal).toBeGreaterThanOrEqual(0);
          expect(signal).toBeLessThanOrEqual(1);
        }
        expect(snapshot.dirtyPages).toBeGreaterThanOrEqual(0);
        expect(snapshot.dirtyPages).toBeLessThanOrEqual(100);
      }
    }
  });
});

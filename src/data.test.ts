import {describe, expect, it} from 'vitest';
import {BENCHMARK, CYCLE_STAGES, getCycleStage, reductionFromBaseline} from './data';

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
});

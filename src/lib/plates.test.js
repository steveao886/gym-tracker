import { describe, it, expect } from 'vitest';
import { calculatePlates } from './plates';

describe('calculatePlates', () => {
  it('returns no plates when target is at or below the bar weight', () => {
    expect(calculatePlates(45)).toEqual({ plates: [], perSideWeight: 0, remainder: 0 });
    expect(calculatePlates(30)).toEqual({ plates: [], perSideWeight: 0, remainder: 0 });
  });

  it('splits the net weight evenly per side using the largest plates first', () => {
    // 225 - 45 = 180 net, 90 per side = 2 x 45
    expect(calculatePlates(225)).toEqual({ plates: [45, 45], perSideWeight: 90, remainder: 0 });
  });

  it('mixes plate sizes greedily', () => {
    // 185 - 45 = 140 net, 70 per side = 45 + 25
    expect(calculatePlates(185).plates).toEqual([45, 25]);
    // 95 - 45 = 50 net, 25 per side = 25
    expect(calculatePlates(95).plates).toEqual([25]);
  });

  it('uses 2.5 plates and reports leftover that cannot be loaded', () => {
    // 100 - 45 = 55 net, 27.5 per side = 25 + 2.5
    expect(calculatePlates(100)).toEqual({ plates: [25, 2.5], perSideWeight: 27.5, remainder: 0 });
    // 101 - 45 = 56 net, 28 per side = 25 + 2.5, leaving 0.5 unloadable
    expect(calculatePlates(101).remainder).toBeCloseTo(0.5);
  });

  it('respects a custom bar weight', () => {
    // 65 - 35 = 30 net, 15 per side = 10 + 5
    expect(calculatePlates(65, 35).plates).toEqual([10, 5]);
  });
});

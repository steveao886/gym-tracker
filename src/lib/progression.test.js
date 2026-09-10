import { describe, it, expect } from 'vitest';
import { applyWorkoutLog, isLowerBody, incrementFor } from './progression';

const makeData = () => ({
  history: [{ id: 'log-old' }],
  exerciseLibrary: [
    { id: 'bench_press', currentWeight: 135 },
    { id: 'back_squat', currentWeight: 185 },
    { id: 'rdl', currentWeight: 155 },
    { id: 'pull_ups', currentWeight: 0 },
    { id: 'cable_face_pull', currentWeight: 40 }
  ],
  weeklySchedule: [
    { dayIndex: 0, dayName: '周一', items: [{ id: 'i1', type: 'routine', routineId: 'push', completed: false }] },
    { dayIndex: 1, dayName: '周二', items: [{ id: 'i2', type: 'routine', routineId: 'legs', completed: false }] }
  ]
});

const makeLog = (exercises) => ({ id: 'log-new', routineId: 'push', exercises });

describe('isLowerBody / incrementFor', () => {
  it('treats squat, deadlift and rdl as lower body', () => {
    expect(isLowerBody('back_squat')).toBe(true);
    expect(isLowerBody('deadlift')).toBe(true);
    expect(isLowerBody('rdl')).toBe(true);
    expect(isLowerBody('bench_press')).toBe(false);
  });

  it('increments lower body by 10 and upper body by 5', () => {
    expect(incrementFor('back_squat')).toBe(10);
    expect(incrementFor('bench_press')).toBe(5);
  });
});

describe('applyWorkoutLog', () => {
  it('prepends the log to history', () => {
    const next = applyWorkoutLog(makeData(), makeLog([]));
    expect(next.history.map(h => h.id)).toEqual(['log-new', 'log-old']);
  });

  it('bumps the working weight when the target reps were met', () => {
    const log = makeLog([
      { id: 'bench_press', weight: 135, completed: true, targetMet: true },
      { id: 'back_squat', weight: 185, completed: true, targetMet: true }
    ]);
    const next = applyWorkoutLog(makeData(), log);
    const weight = (id) => next.exerciseLibrary.find(e => e.id === id).currentWeight;
    expect(weight('bench_press')).toBe(140);
    expect(weight('back_squat')).toBe(195);
  });

  it('keeps the logged weight without a bump when the target was not met', () => {
    const log = makeLog([{ id: 'bench_press', weight: 130, completed: true, targetMet: false }]);
    const next = applyWorkoutLog(makeData(), log);
    expect(next.exerciseLibrary.find(e => e.id === 'bench_press').currentWeight).toBe(130);
  });

  it('never bumps bodyweight exercises', () => {
    const log = makeLog([{ id: 'pull_ups', weight: 0, completed: true, targetMet: true }]);
    const next = applyWorkoutLog(makeData(), log);
    expect(next.exerciseLibrary.find(e => e.id === 'pull_ups').currentWeight).toBe(0);
  });

  it('ignores exercises that were not completed', () => {
    const log = makeLog([{ id: 'bench_press', weight: 200, completed: false, targetMet: true }]);
    const next = applyWorkoutLog(makeData(), log);
    expect(next.exerciseLibrary.find(e => e.id === 'bench_press').currentWeight).toBe(135);
  });

  it('marks the matching routine on the board as completed', () => {
    const next = applyWorkoutLog(makeData(), makeLog([]));
    expect(next.weeklySchedule[0].items[0].completed).toBe(true);
    expect(next.weeklySchedule[1].items[0].completed).toBe(false);
  });

  it('does not mutate the input data', () => {
    const data = makeData();
    const snapshot = JSON.stringify(data);
    applyWorkoutLog(data, makeLog([{ id: 'bench_press', weight: 135, completed: true, targetMet: true }]));
    expect(JSON.stringify(data)).toBe(snapshot);
  });
});

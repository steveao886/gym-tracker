import { describe, it, expect } from 'vitest';
import { resetWeek } from './resetWeek';
import { getDefaultWeeklySchedule } from '../constants/defaultData';

const makeData = () => ({
  version: '1.0.0',
  settings: { githubToken: 'tok', githubRepo: 'u/r' },
  history: [{ id: 'log-1', routineTitle: '卧推日' }],
  exerciseLibrary: [{ id: 'bench_press', currentWeight: 155 }],
  peakRecords: { bench: { peakLbs: 225 } },
  routineTemplates: [{ id: 'r1' }],
  backlog: [{ id: 'postponed', type: 'sport', sportType: 'running', title: '欠的慢跑' }],
  weeklySchedule: [
    { dayIndex: 0, dayName: '周一', items: [{ id: 'moved-here', type: 'routine', routineId: 'x', completed: true }] },
    { dayIndex: 1, dayName: '周二', items: [] },
    { dayIndex: 2, dayName: '周三', items: [] },
    { dayIndex: 3, dayName: '周四', items: [] },
    { dayIndex: 4, dayName: '周五', items: [] },
    { dayIndex: 5, dayName: '周六', items: [] },
    { dayIndex: 6, dayName: '周日', items: [] }
  ]
});

describe('resetWeek', () => {
  it('restores the seven-day grid to the template', () => {
    const next = resetWeek(makeData());
    expect(next.weeklySchedule).toEqual(getDefaultWeeklySchedule());
  });

  it('clears items a user had dragged onto other days', () => {
    const next = resetWeek(makeData());
    const allIds = next.weeklySchedule.flatMap(d => d.items).map(i => i.id);
    expect(allIds).not.toContain('moved-here');
  });

  it('leaves the backlog untouched so postponed items survive', () => {
    const next = resetWeek(makeData());
    expect(next.backlog).toEqual([{ id: 'postponed', type: 'sport', sportType: 'running', title: '欠的慢跑' }]);
  });

  it('preserves history, working weights, peaks and settings', () => {
    const data = makeData();
    const next = resetWeek(data);
    expect(next.history).toEqual(data.history);
    expect(next.exerciseLibrary).toEqual(data.exerciseLibrary);
    expect(next.peakRecords).toEqual(data.peakRecords);
    expect(next.settings).toEqual(data.settings);
  });

  it('starts every restored item uncompleted', () => {
    const next = resetWeek(makeData());
    expect(next.weeklySchedule.flatMap(d => d.items).every(i => i.completed === false)).toBe(true);
  });

  it('does not mutate the input data', () => {
    const data = makeData();
    const snapshot = JSON.stringify(data);
    resetWeek(data);
    expect(JSON.stringify(data)).toBe(snapshot);
  });

  it('produces a grid that is independent of later resets', () => {
    const first = resetWeek(makeData());
    first.weeklySchedule[3].items.push({ id: 'scratch' });
    const second = resetWeek(makeData());
    expect(second.weeklySchedule[3].items.map(i => i.id)).not.toContain('scratch');
  });
});

import { describe, it, expect } from 'vitest';
import {
  getTodayIndex,
  moveItem,
  shiftItem,
  addItem,
  deleteItem,
  checkDayConflict
} from './schedule';

const item = (id, extra = {}) => ({ id, type: 'routine', routineId: 'r1', completed: false, ...extra });

const makeState = () => ({
  schedule: [
    { dayIndex: 0, dayName: '周一', items: [item('a')] },
    { dayIndex: 1, dayName: '周二', items: [] },
    { dayIndex: 2, dayName: '周三', items: [item('b')] },
    { dayIndex: 3, dayName: '周四', items: [] },
    { dayIndex: 4, dayName: '周五', items: [] },
    { dayIndex: 5, dayName: '周六', items: [] },
    { dayIndex: 6, dayName: '周日', items: [item('c')] }
  ],
  backlog: [item('z', { type: 'sport', sportType: 'running', title: '慢跑' })]
});

const idsOfDay = (state, dayIdx) => state.schedule[dayIdx].items.map(i => i.id);
const idsOfBacklog = (state) => state.backlog.map(i => i.id);

describe('getTodayIndex', () => {
  it('maps Monday to 0 and Sunday to 6', () => {
    expect(getTodayIndex(new Date('2026-09-07T12:00:00'))).toBe(0); // Monday
    expect(getTodayIndex(new Date('2026-09-09T12:00:00'))).toBe(2); // Wednesday
    expect(getTodayIndex(new Date('2026-09-13T12:00:00'))).toBe(6); // Sunday
  });
});

describe('moveItem', () => {
  it('moves an item between two days', () => {
    const next = moveItem(makeState(), item('a'), 0, 3);
    expect(idsOfDay(next, 0)).toEqual([]);
    expect(idsOfDay(next, 3)).toEqual(['a']);
  });

  it('moves an item from a day into the backlog', () => {
    const next = moveItem(makeState(), item('b'), 2, 'backlog');
    expect(idsOfDay(next, 2)).toEqual([]);
    expect(idsOfBacklog(next)).toEqual(['z', 'b']);
  });

  it('moves an item from the backlog into a day', () => {
    const state = makeState();
    const next = moveItem(state, state.backlog[0], 'backlog', 1);
    expect(idsOfBacklog(next)).toEqual([]);
    expect(idsOfDay(next, 1)).toEqual(['z']);
  });

  it('never duplicates an item already in the backlog', () => {
    const state = makeState();
    const dup = { ...state.backlog[0] };
    const next = moveItem(state, dup, 0, 'backlog');
    expect(idsOfBacklog(next)).toEqual(['z']);
  });

  it('returns the same state when source and target are equal', () => {
    const state = makeState();
    const next = moveItem(state, item('a'), 0, 0);
    expect(next).toBe(state);
  });

  it('does not mutate the input state', () => {
    const state = makeState();
    const snapshot = JSON.stringify(state);
    moveItem(state, item('a'), 0, 5);
    expect(JSON.stringify(state)).toBe(snapshot);
  });
});

describe('shiftItem', () => {
  it('shifts an item forward by one day', () => {
    const next = shiftItem(makeState(), 0, 'a', 1);
    expect(idsOfDay(next, 1)).toEqual(['a']);
  });

  it('wraps from Sunday to Monday and from Monday to Sunday', () => {
    const forward = shiftItem(makeState(), 6, 'c', 1);
    expect(idsOfDay(forward, 0)).toEqual(['a', 'c']);

    const backward = shiftItem(makeState(), 0, 'a', -1);
    expect(idsOfDay(backward, 6)).toEqual(['c', 'a']);
  });

  it('leaves state untouched when the item is not on that day', () => {
    const state = makeState();
    expect(shiftItem(state, 1, 'nope', 1)).toBe(state);
  });
});

describe('addItem', () => {
  it('appends a new item with a generated id and completed=false', () => {
    const next = addItem(makeState(), 1, { type: 'sport', sportType: 'tennis', title: '网球' }, 'item-new');
    expect(next.schedule[1].items).toEqual([
      { id: 'item-new', completed: false, type: 'sport', sportType: 'tennis', title: '网球' }
    ]);
  });
});

describe('deleteItem', () => {
  it('removes an item from a day', () => {
    const next = deleteItem(makeState(), 2, 'b');
    expect(idsOfDay(next, 2)).toEqual([]);
  });

  it('removes an item from the backlog', () => {
    const next = deleteItem(makeState(), 'backlog', 'z');
    expect(idsOfBacklog(next)).toEqual([]);
  });
});

describe('checkDayConflict', () => {
  const templates = [
    { id: 'legs', title: '深蹲日', isLegHeavy: true },
    { id: 'push', title: '推日', isLegHeavy: false }
  ];
  const tennis = { id: 't', type: 'sport', sportType: 'tennis' };

  it('flags tennis on the same day as a leg-heavy routine', () => {
    const legs = { id: 'l', type: 'routine', routineId: 'legs' };
    expect(checkDayConflict([tennis, legs], templates)).toEqual({ heavyItem: legs, routineTitle: '深蹲日' });
  });

  it('returns null when there is tennis but no leg-heavy routine', () => {
    const push = { id: 'p', type: 'routine', routineId: 'push' };
    expect(checkDayConflict([tennis, push], templates)).toBeNull();
  });

  it('returns null when there is a leg-heavy routine but no tennis', () => {
    const legs = { id: 'l', type: 'routine', routineId: 'legs' };
    expect(checkDayConflict([legs], templates)).toBeNull();
  });
});

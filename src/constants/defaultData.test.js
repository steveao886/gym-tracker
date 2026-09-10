import { describe, it, expect } from 'vitest';
import { getDefaultWeeklySchedule, ROUTINE_TEMPLATES, INITIAL_APP_DATA } from './defaultData';

const dayNamed = (schedule, name) => schedule.find(d => d.dayName === name);
const routineIdsOn = (schedule, name) =>
  dayNamed(schedule, name).items.filter(i => i.type === 'routine').map(i => i.routineId);
const sportTypesOn = (schedule, name) =>
  dayNamed(schedule, name).items.filter(i => i.type === 'sport').map(i => i.sportType);

describe('getDefaultWeeklySchedule', () => {
  it('covers Monday through Sunday with matching day indexes', () => {
    const schedule = getDefaultWeeklySchedule();
    expect(schedule.map(d => d.dayName)).toEqual(['周一', '周二', '周三', '周四', '周五', '周六', '周日']);
    expect(schedule.map(d => d.dayIndex)).toEqual([0, 1, 2, 3, 4, 5, 6]);
  });

  it('leaves Monday through Wednesday empty', () => {
    const schedule = getDefaultWeeklySchedule();
    expect(dayNamed(schedule, '周一').items).toEqual([]);
    expect(dayNamed(schedule, '周二').items).toEqual([]);
    expect(dayNamed(schedule, '周三').items).toEqual([]);
  });

  it('pairs bodyweight conditioning with an evening tennis session on Thursday', () => {
    const schedule = getDefaultWeeklySchedule();
    expect(routineIdsOn(schedule, '周四')).toEqual(['routine_outdoor_bodyweight']);
    expect(sportTypesOn(schedule, '周四')).toEqual(['tennis']);
  });

  it('runs push, pull then legs across Friday to Sunday', () => {
    const schedule = getDefaultWeeklySchedule();
    expect(routineIdsOn(schedule, '周五')).toEqual(['routine_chest_triceps']);
    expect(routineIdsOn(schedule, '周六')).toEqual(['routine_back_biceps']);
    expect(routineIdsOn(schedule, '周日')).toEqual(['routine_squat_core']);
  });

  it('keeps the two leg-heavy routines off the same week grid', () => {
    const schedule = getDefaultWeeklySchedule();
    const legHeavyIds = ROUTINE_TEMPLATES.filter(r => r.isLegHeavy).map(r => r.id);
    const scheduledLegHeavy = schedule
      .flatMap(d => d.items)
      .filter(i => i.type === 'routine' && legHeavyIds.includes(i.routineId));
    expect(scheduledLegHeavy).toHaveLength(1);
  });

  it('starts every item uncompleted and gives each a unique id', () => {
    const items = getDefaultWeeklySchedule().flatMap(d => d.items);
    expect(items.every(i => i.completed === false)).toBe(true);
    expect(new Set(items.map(i => i.id)).size).toBe(items.length);
  });

  it('returns an independent copy on every call', () => {
    const first = getDefaultWeeklySchedule();
    first[3].items.push({ id: 'scratch' });
    expect(getDefaultWeeklySchedule()[3].items.map(i => i.id)).not.toContain('scratch');
  });

  it('references routine ids that actually exist in the templates', () => {
    const known = ROUTINE_TEMPLATES.map(r => r.id);
    const referenced = getDefaultWeeklySchedule()
      .flatMap(d => d.items)
      .filter(i => i.type === 'routine')
      .map(i => i.routineId);
    referenced.forEach(id => expect(known).toContain(id));
  });
});

describe('INITIAL_APP_DATA', () => {
  it('parks the deadlift session in the backlog rather than the grid', () => {
    const backlogRoutines = INITIAL_APP_DATA.backlog
      .filter(i => i.type === 'routine')
      .map(i => i.routineId);
    expect(backlogRoutines).toContain('routine_deadlift_shoulders');
  });
});

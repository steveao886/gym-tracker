import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { WeeklyBoard } from './WeeklyBoard';
import { ROUTINE_TEMPLATES, getDefaultWeeklySchedule } from '../constants/defaultData';
import { getTodayIndex } from '../lib/schedule';

const cardFor = (title) => screen.getByText(title).closest('[draggable]');
const ids = (day) => day.items.map(i => i.id);

const setup = (props = {}) => {
  const onUpdateBoard = vi.fn();
  const onOpenWorkout = vi.fn();
  const schedule = props.schedule || getDefaultWeeklySchedule();
  const backlog = props.backlog || [
    { id: 'b1', type: 'sport', sportType: 'running', title: '户外慢跑 5km', durationMin: 30 }
  ];
  render(
    <WeeklyBoard
      schedule={schedule}
      backlog={backlog}
      routineTemplates={ROUTINE_TEMPLATES}
      onUpdateBoard={onUpdateBoard}
      onOpenWorkout={onOpenWorkout}
    />
  );
  const lastUpdate = () => onUpdateBoard.mock.calls.at(-1)[0];
  return { onUpdateBoard, onOpenWorkout, lastUpdate };
};

describe('WeeklyBoard', () => {
  it('moves a card to the next day with the forward button', () => {
    const { lastUpdate } = setup();
    const card = cardFor('卧推主导 · 胸与三头');
    fireEvent.click(within(card).getByTitle('后移到明天 (→)'));

    const { schedule } = lastUpdate();
    expect(ids(schedule[4])).toEqual([]);
    expect(ids(schedule[5])).toContain('item-fri-push');
  });

  it('sends a card to the backlog with the inbox button', () => {
    const { lastUpdate } = setup();
    const card = cardFor('卧推主导 · 胸与三头');
    fireEvent.click(within(card).getByTitle('存入自由备选池'));

    const { schedule, backlog } = lastUpdate();
    expect(ids(schedule[4])).toEqual([]);
    expect(backlog.map(i => i.id)).toEqual(['b1', 'item-fri-push']);
  });

  it('deletes a card', () => {
    const { lastUpdate } = setup();
    const card = cardFor('卧推主导 · 胸与三头');
    fireEvent.click(within(card).getByTitle('删除此项'));
    expect(ids(lastUpdate().schedule[4])).toEqual([]);
  });

  it('opens the workout logger when a routine card is clicked', () => {
    const { onOpenWorkout } = setup();
    fireEvent.click(cardFor('卧推主导 · 胸与三头'));
    expect(onOpenWorkout).toHaveBeenCalledWith(expect.objectContaining({ id: 'routine_chest_triceps' }));
  });

  it('moves a backlog item to today', () => {
    const { lastUpdate } = setup();
    fireEvent.click(screen.getByTitle('移到今天'));
    const { schedule, backlog } = lastUpdate();
    expect(backlog).toEqual([]);
    expect(ids(schedule[getTodayIndex()])).toContain('b1');
  });

  it('adds a tennis session from the day menu', () => {
    const { lastUpdate } = setup();
    fireEvent.click(screen.getAllByTitle('添加项目')[1]); // 周二
    fireEvent.click(screen.getByText(/网球 \(1\.5小时\)/));
    const day = lastUpdate().schedule[1];
    expect(day.items.at(-1)).toMatchObject({ type: 'sport', sportType: 'tennis', completed: false });
  });

  it('shows a conflict warning when tennis and a leg-heavy routine share a day, and can defer the routine', () => {
    const schedule = getDefaultWeeklySchedule();
    // 周四模版里已有晚间网球，再加一个重腿套餐即触发冲突
    schedule[3].items.push({ id: 'legs', type: 'routine', routineId: 'routine_squat_core', completed: false });
    const { lastUpdate } = setup({ schedule });

    expect(screen.getByText('网球与深蹲主导 · 下肢与核心同日')).toBeInTheDocument();
    fireEvent.click(screen.getByText('一键顺延至明天'));

    const next = lastUpdate().schedule;
    expect(ids(next[3])).not.toContain('legs');
    expect(ids(next[4])).toContain('legs');
  });
});

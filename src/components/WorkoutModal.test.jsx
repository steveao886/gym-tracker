import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { WorkoutModal } from './WorkoutModal';
import { EXERCISE_LIBRARY, ROUTINE_TEMPLATES } from '../constants/defaultData';

vi.mock('canvas-confetti', () => ({ default: vi.fn() }));

const chest = ROUTINE_TEMPLATES.find(r => r.id === 'routine_chest_triceps');

const setup = () => {
  const onSaveWorkout = vi.fn();
  const onClose = vi.fn();
  render(
    <WorkoutModal
      isOpen
      routine={chest}
      exerciseLibrary={EXERCISE_LIBRARY}
      onSaveWorkout={onSaveWorkout}
      onClose={onClose}
    />
  );
  const payload = () => onSaveWorkout.mock.calls.at(-1)[0];
  const row = (name) => screen.getByText(name).closest('.rounded-xl');
  return { onSaveWorkout, onClose, payload, row };
};

describe('WorkoutModal', () => {
  it('renders nothing when closed', () => {
    const { container } = render(<WorkoutModal isOpen={false} routine={chest} exerciseLibrary={EXERCISE_LIBRARY} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('prefills every exercise with the current working weight from the library', () => {
    const { row } = setup();
    expect(within(row('杠铃平板卧推')).getByText('@ 135 lbs')).toBeInTheDocument();
    expect(within(row('杠铃上斜卧推')).getByText('@ 115 lbs')).toBeInTheDocument();
  });

  it('one-tap completion saves every exercise as completed with target met and closes', () => {
    const { payload, onClose } = setup();
    fireEvent.click(screen.getByText('按计划全部完成 (一键打卡)'));

    const log = payload();
    expect(log.routineId).toBe('routine_chest_triceps');
    expect(log.exercises).toHaveLength(chest.exercises.length);
    expect(log.exercises.every(e => e.completed && e.targetMet)).toBe(true);
    expect(onClose).toHaveBeenCalled();
  });

  it('records an adjusted weight and an unmet target when saving modified state', () => {
    const { payload, row } = setup();
    const bench = row('杠铃平板卧推');
    fireEvent.click(within(bench).getByTitle('减 5 磅'));
    fireEvent.click(within(bench).getByText('✔ 次数已做满'));
    fireEvent.click(screen.getByText('保存已修改状态'));

    const benchLog = payload().exercises.find(e => e.id === 'bench_press');
    expect(benchLog).toMatchObject({ weight: 130, completed: true, targetMet: false });
  });

  it('keeps a skipped exercise out of the completed set', () => {
    const { payload, row } = setup();
    const dips = row('双杠臂屈伸 (前倾偏胸)');
    fireEvent.click(within(dips).getByRole('button')); // the check toggle is the only button once unchecked
    fireEvent.click(screen.getByText('保存已修改状态'));

    expect(payload().exercises.find(e => e.id === 'dips_chest').completed).toBe(false);
  });

  it('never lets the weight go below zero', () => {
    const { row } = setup();
    const fly = row('单滑轮单臂绳索夹胸'); // 30 lbs
    const minus = within(fly).getByTitle('减 5 磅');
    for (let i = 0; i < 10; i++) fireEvent.click(minus);
    expect(within(fly).queryByText(/@ -/)).not.toBeInTheDocument();
  });
});

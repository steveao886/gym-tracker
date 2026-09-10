import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatsDashboard } from './StatsDashboard';
import { EXERCISE_LIBRARY } from '../constants/defaultData';

describe('StatsDashboard', () => {
  it('takes peak weights from the exercise library rather than a hard-coded list', () => {
    const library = EXERCISE_LIBRARY.map(ex =>
      ex.id === 'bench_press' ? { ...ex, currentWeight: 150, peakLbs: 300 } : ex
    );
    render(<StatsDashboard history={[]} exerciseLibrary={library} schedule={[]} />);

    expect(screen.getByText('/ 巅峰 300 lbs')).toBeInTheDocument();
    expect(screen.getByText('已恢复 50%')).toBeInTheDocument();
  });

  it('counts strength sessions logged in the last 7 days', () => {
    const now = Date.now();
    const day = 24 * 60 * 60 * 1000;
    const history = [
      { id: 'a', date: new Date(now - 1 * day).toISOString(), routineTitle: 'A', exercises: [] },
      { id: 'b', date: new Date(now - 3 * day).toISOString(), routineTitle: 'B', exercises: [] },
      { id: 'c', date: new Date(now - 10 * day).toISOString(), routineTitle: 'C', exercises: [] }
    ];
    render(<StatsDashboard history={history} exerciseLibrary={EXERCISE_LIBRARY} schedule={[]} />);

    const tile = screen.getByText('本周力量打卡').closest('.rounded-2xl');
    expect(tile).toHaveTextContent('2');
    expect(screen.getByText('共 3 条记录')).toBeInTheDocument();
  });

  it('sums scheduled tennis time', () => {
    const schedule = [
      { dayIndex: 0, dayName: '周一', items: [{ id: 't1', type: 'sport', sportType: 'tennis', durationMin: 90 }] },
      { dayIndex: 1, dayName: '周二', items: [{ id: 't2', type: 'sport', sportType: 'tennis', durationMin: 60 }] }
    ];
    render(<StatsDashboard history={[]} exerciseLibrary={EXERCISE_LIBRARY} schedule={schedule} />);

    expect(screen.getByText('2.5')).toBeInTheDocument();
    expect(screen.getByText('小时 (2场)')).toBeInTheDocument();
  });
});

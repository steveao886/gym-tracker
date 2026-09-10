import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import App from './App';
import { INITIAL_APP_DATA } from './constants/defaultData';
import { githubApi } from './services/githubApi';

vi.mock('./services/githubApi', () => ({
  githubApi: {
    syncData: vi.fn().mockResolvedValue({ success: true }),
    testConnection: vi.fn().mockResolvedValue({ repoName: 'u/r', isPrivate: true }),
    fetchData: vi.fn()
  }
}));

// 撒花动画依赖 canvas，在 jsdom 中无意义
vi.mock('canvas-confetti', () => ({ default: vi.fn() }));

const STORAGE_KEY = 'GYM_TRACKER_DATA_V1';

const seed = (overrides = {}) => {
  const data = {
    ...INITIAL_APP_DATA,
    ...overrides,
    settings: { ...INITIAL_APP_DATA.settings, ...(overrides.settings || {}) }
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  return data;
};

const stored = () => JSON.parse(localStorage.getItem(STORAGE_KEY));

const openWorkout = (title) => fireEvent.click(screen.getByText(title).closest('[draggable]'));

beforeEach(() => {
  vi.clearAllMocks();
});

describe('App: GitHub auto-sync', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('pushes the new schedule to GitHub after a board change', async () => {
    seed({ settings: { githubToken: 'tok', githubRepo: 'u/r' } });
    render(<App />);

    const card = screen.getByText('卧推主导 · 胸与三头').closest('[draggable]');
    fireEvent.click(card.querySelector('[title="后移到明天 (→)"]'));

    await act(async () => {
      vi.advanceTimersByTime(3100);
    });

    expect(githubApi.syncData).toHaveBeenCalled();
    const pushed = githubApi.syncData.mock.calls.at(-1)[3];
    expect(pushed.weeklySchedule[4].items).toEqual([]);
    expect(pushed.weeklySchedule[5].items.map(i => i.id)).toContain('item-fri-push');
  });
});

describe('App: exercise library weight input', () => {
  it('keeps the input mounted while it is empty and persists the retyped value', () => {
    seed();
    render(<App />);
    fireEvent.click(screen.getByText('动作库'));

    const input = screen.getAllByRole('spinbutton')[0]; // 杠铃平板卧推
    expect(input).toHaveValue(135);

    fireEvent.change(input, { target: { value: '' } });
    expect(input).toBeInTheDocument();
    expect(stored().exerciseLibrary[0].currentWeight).toBe(135);

    fireEvent.change(input, { target: { value: '140' } });
    expect(stored().exerciseLibrary[0].currentWeight).toBe(140);
  });

  it('restores the previous weight when the field is left empty', () => {
    seed();
    render(<App />);
    fireEvent.click(screen.getByText('动作库'));

    const input = screen.getAllByRole('spinbutton')[0];
    fireEvent.change(input, { target: { value: '' } });
    fireEvent.blur(input);

    expect(input).toHaveValue(135);
    expect(stored().exerciseLibrary[0].currentWeight).toBe(135);
  });
});

describe('App: settings', () => {
  it('syncs with the freshly entered token and repo when testing the connection', async () => {
    seed();
    render(<App />);
    fireEvent.click(screen.getByTitle('设置与数据同步'));

    fireEvent.change(screen.getByPlaceholderText('github_pat_11A...'), { target: { value: 'ghp_new' } });
    fireEvent.change(screen.getByPlaceholderText('你的用户名/gym-data'), { target: { value: 'me/gym-data' } });
    fireEvent.click(screen.getByText('测试连通性并立即同步'));

    await waitFor(() => expect(githubApi.syncData).toHaveBeenCalled());
    const [token, repo, branch, data] = githubApi.syncData.mock.calls.at(-1);
    expect(token).toBe('ghp_new');
    expect(repo).toBe('me/gym-data');
    expect(branch).toBe('main');
    expect(data.settings.githubToken).toBe('ghp_new');
  });

  it('preserves settings fields that the form does not edit', () => {
    seed({ settings: { githubToken: 'tok', githubRepo: 'u/r', lastSynced: '2026-01-01T00:00:00.000Z' } });
    render(<App />);
    fireEvent.click(screen.getByTitle('设置与数据同步'));
    fireEvent.click(screen.getByText('保存设置'));

    expect(stored().settings).toMatchObject({
      githubToken: 'tok',
      githubRepo: 'u/r',
      lastSynced: '2026-01-01T00:00:00.000Z',
      autoSync: true
    });
  });
});

describe('App: workout logging', () => {
  it('shows the exercises of whichever routine was opened last', () => {
    seed();
    render(<App />);

    openWorkout('卧推主导 · 胸与三头');
    expect(screen.getByText('杠铃平板卧推')).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText('关闭'));

    openWorkout('背部主导 · 经典拉');
    expect(screen.getByText('T-Bar 地雷管划船')).toBeInTheDocument();
    expect(screen.queryByText('杠铃平板卧推')).not.toBeInTheDocument();
  });

  it('one-tap completion writes history, bumps weights and marks the board item done', () => {
    seed();
    render(<App />);

    openWorkout('卧推主导 · 胸与三头');
    fireEvent.click(screen.getByText('按计划全部完成 (一键打卡)'));

    const data = stored();
    expect(data.history).toHaveLength(1);
    expect(data.history[0].routineId).toBe('routine_chest_triceps');
    expect(data.exerciseLibrary.find(e => e.id === 'bench_press').currentWeight).toBe(140);
    expect(data.weeklySchedule[4].items[0].completed).toBe(true);

    fireEvent.click(screen.getByText('大盘与巅峰'));
    expect(screen.getByText('卧推主导 · 胸与三头')).toBeInTheDocument();
  });
});

describe('App: reset week', () => {
  it('restores the template grid while keeping history and working weights', () => {
    seed();
    render(<App />);

    // 先打一次卡，制造历史与加重，再把周五的卡片挪走
    openWorkout('阳光后院 · 纯自重与体能');
    fireEvent.click(screen.getByText('按计划全部完成 (一键打卡)'));
    const pushCard = screen.getByText('卧推主导 · 胸与三头').closest('[draggable]');
    fireEvent.click(pushCard.querySelector('[title="存入自由备选池"]'));

    const moved = stored();
    expect(moved.weeklySchedule[4].items).toEqual([]);
    expect(moved.history).toHaveLength(1);

    fireEvent.click(screen.getByTitle('设置与数据同步'));
    fireEvent.click(screen.getByRole('button', { name: '重排本周' }));
    fireEvent.click(screen.getByRole('button', { name: '确认重排' }));

    const after = stored();
    expect(after.weeklySchedule[4].items.map(i => i.routineId)).toEqual(['routine_chest_triceps']);
    expect(after.weeklySchedule[0].items).toEqual([]);
    expect(after.history).toHaveLength(1);
    expect(after.exerciseLibrary.find(e => e.id === 'push_ups')).toBeDefined();
  });

  it('clears the completed flag set by an earlier check-in', () => {
    seed();
    render(<App />);

    openWorkout('阳光后院 · 纯自重与体能');
    fireEvent.click(screen.getByText('按计划全部完成 (一键打卡)'));
    expect(stored().weeklySchedule[3].items[0].completed).toBe(true);

    fireEvent.click(screen.getByTitle('设置与数据同步'));
    fireEvent.click(screen.getByRole('button', { name: '重排本周' }));
    fireEvent.click(screen.getByRole('button', { name: '确认重排' }));

    expect(stored().weeklySchedule[3].items[0].completed).toBe(false);
  });
});

import { describe, it, expect, vi } from 'vitest';
import { storage } from './storage';
import { INITIAL_APP_DATA } from '../constants/defaultData';

const KEY = 'GYM_TRACKER_DATA_V1';

describe('storage.loadData', () => {
  it('seeds localStorage with the defaults on first run', () => {
    const data = storage.loadData();
    expect(data).toEqual(INITIAL_APP_DATA);
    expect(JSON.parse(localStorage.getItem(KEY))).toEqual(INITIAL_APP_DATA);
  });

  it('merges stored settings over the defaults', () => {
    localStorage.setItem(KEY, JSON.stringify({ settings: { githubToken: 'tok' }, history: [{ id: 'h1' }] }));
    const data = storage.loadData();
    expect(data.settings).toMatchObject({ githubToken: 'tok', autoSync: true, githubBranch: 'main' });
    expect(data.history).toEqual([{ id: 'h1' }]);
    expect(data.exerciseLibrary).toEqual(INITIAL_APP_DATA.exerciseLibrary);
  });

  it('falls back to the defaults when the stored JSON is corrupt', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    localStorage.setItem(KEY, '{not json');
    expect(storage.loadData()).toEqual(INITIAL_APP_DATA);
  });
});

describe('storage.saveData', () => {
  it('persists the given data', () => {
    expect(storage.saveData({ a: 1 })).toBe(true);
    expect(JSON.parse(localStorage.getItem(KEY))).toEqual({ a: 1 });
  });
});

describe('storage.importJSON', () => {
  it('parses a valid backup file', async () => {
    const file = new File([JSON.stringify({ history: [1, 2] })], 'backup.json', { type: 'application/json' });
    await expect(storage.importJSON(file)).resolves.toEqual({ history: [1, 2] });
  });

  it('rejects an invalid file', async () => {
    const file = new File(['nope'], 'bad.json', { type: 'application/json' });
    await expect(storage.importJSON(file)).rejects.toThrow('Invalid JSON format');
  });
});

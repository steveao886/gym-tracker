// 本地优先 (Local-First) 存储服务
import { INITIAL_APP_DATA } from '../constants/defaultData';

const STORAGE_KEY = 'GYM_TRACKER_DATA_V1';

export const storage = {
  loadData: () => {
    try {
      const serialized = localStorage.getItem(STORAGE_KEY);
      if (!serialized) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_APP_DATA));
        return INITIAL_APP_DATA;
      }
      const parsed = JSON.parse(serialized);
      // 数据结构版本合并保障
      return {
        ...INITIAL_APP_DATA,
        ...parsed,
        settings: { ...INITIAL_APP_DATA.settings, ...(parsed.settings || {}) },
        peakRecords: { ...INITIAL_APP_DATA.peakRecords, ...(parsed.peakRecords || {}) }
      };
    } catch (e) {
      console.error('Failed to load local storage data:', e);
      return INITIAL_APP_DATA;
    }
  },

  saveData: (data) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      return true;
    } catch (e) {
      console.error('Failed to save to local storage:', e);
      return false;
    }
  },

  exportJSON: (data) => {
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gym-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  },

  importJSON: (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const imported = JSON.parse(e.target.result);
          resolve(imported);
        } catch (err) {
          reject(new Error('Invalid JSON format'));
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }
};

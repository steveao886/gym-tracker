import { getDefaultWeeklySchedule } from '../constants/defaultData';

// 重排本周：把七天网格恢复成模版，其余数据原样保留。
// 备选池不动，因为那里存的是用户自己延期的项目，清掉会丢东西。
export const resetWeek = (data) => ({
  ...data,
  weeklySchedule: getDefaultWeeklySchedule()
});

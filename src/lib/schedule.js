// 周排期看板的纯逻辑：与 React 无关，便于单元测试
// state 形如 { schedule: Day[], backlog: Item[] }，所有函数均返回新对象，不修改入参

// 获取某日期是周几 (0=周一, ... 6=周日)
export const getTodayIndex = (date = new Date()) => {
  const day = date.getDay(); // JS: 0 is Sunday
  return day === 0 ? 6 : day - 1;
};

const cloneState = ({ schedule, backlog }) => ({
  schedule: schedule.map(d => ({ ...d, items: [...d.items] })),
  backlog: [...backlog]
});

// 原子化移动：day -> day, day -> backlog, backlog -> day
export const moveItem = (state, item, fromLocation, toLocation) => {
  if (fromLocation === toLocation) return state;

  const next = cloneState(state);

  if (fromLocation === 'backlog') {
    next.backlog = next.backlog.filter(i => i.id !== item.id);
  } else {
    const fromIdx = Number(fromLocation);
    next.schedule[fromIdx].items = next.schedule[fromIdx].items.filter(i => i.id !== item.id);
  }

  if (toLocation === 'backlog') {
    if (!next.backlog.some(i => i.id === item.id)) {
      next.backlog.push(item);
    }
  } else {
    next.schedule[Number(toLocation)].items.push(item);
  }

  return next;
};

// 前移 (delta=-1) 或后移 (delta=+1)，跨周首尾循环
export const shiftItem = (state, fromDayIdx, itemId, delta) => {
  const day = state.schedule[fromDayIdx];
  const item = day?.items.find(i => i.id === itemId);
  if (!item) return state;

  const targetDayIdx = (fromDayIdx + delta + 7) % 7;
  return moveItem(state, item, fromDayIdx, targetDayIdx);
};

export const addItem = (state, dayIndex, newItem, id = 'item-' + Date.now()) => {
  const next = cloneState(state);
  next.schedule[dayIndex].items.push({ id, completed: false, ...newItem });
  return next;
};

export const deleteItem = (state, location, itemId) => {
  const next = cloneState(state);
  if (location === 'backlog') {
    next.backlog = next.backlog.filter(i => i.id !== itemId);
  } else {
    next.schedule[location].items = next.schedule[location].items.filter(i => i.id !== itemId);
  }
  return next;
};

// 冲突检测：某一天是否同时有网球和重负荷腿部训练
export const checkDayConflict = (dayItems, routineTemplates) => {
  const hasTennis = dayItems.some(i => i.type === 'sport' && i.sportType === 'tennis');
  if (!hasTennis) return null;

  const heavyItem = dayItems.find(i => {
    if (i.type !== 'routine') return false;
    const routine = routineTemplates.find(r => r.id === i.routineId);
    return Boolean(routine && routine.isLegHeavy);
  });
  if (!heavyItem) return null;

  const routine = routineTemplates.find(r => r.id === heavyItem.routineId);
  return { heavyItem, routineTitle: routine ? routine.title : '下肢重训' };
};

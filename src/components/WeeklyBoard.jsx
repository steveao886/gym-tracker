import React, { useState } from 'react';
import {
  Calendar,
  Dumbbell,
  Activity,
  Plus,
  Trash2,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  Archive,
  Inbox,
  Clock,
  Sparkles,
  MoveHorizontal,
  ChevronDown,
  CornerDownRight,
  Send
} from 'lucide-react';

export const WeeklyBoard = ({
  schedule = [],
  routineTemplates = [],
  onOpenWorkout,
  backlog = [],
  onUpdateBoard,
  onUpdateSchedule,
  onUpdateBacklog
}) => {
  const [draggedItem, setDraggedItem] = useState(null); // { item, fromDay }
  const [dragOverTarget, setDragOverTarget] = useState(null); // number | 'backlog' | null
  const [activeMenuDay, setActiveMenuDay] = useState(null);
  const [activeMoveItemId, setActiveMoveItemId] = useState(null);

  // 获取今天是周几 (0=周一, ... 6=周日)
  const currentDayIndex = (() => {
    const day = new Date().getDay(); // 0 is Sunday in JS
    return day === 0 ? 6 : day - 1;
  })();

  // 统一的原子化更新方法，避免 React 状态覆盖
  const commitChanges = (newSchedule, newBacklog) => {
    if (onUpdateBoard) {
      onUpdateBoard({ schedule: newSchedule, backlog: newBacklog });
    } else {
      if (onUpdateSchedule) onUpdateSchedule(newSchedule);
      if (onUpdateBacklog) onUpdateBacklog(newBacklog);
    }
  };

  // 冲突检测：某一天是否同时有网球和重负荷腿部 (Squat/Deadlift)
  const checkDayConflict = (dayItems) => {
    const hasTennis = dayItems.some(i => i.type === 'sport' && i.sportType === 'tennis');
    if (!hasTennis) return null;

    const heavyLegItem = dayItems.find(i => {
      if (i.type !== 'routine') return false;
      const routine = routineTemplates.find(r => r.id === i.routineId);
      return routine && routine.isLegHeavy;
    });

    if (heavyLegItem) {
      const routine = routineTemplates.find(r => r.id === heavyLegItem.routineId);
      return {
        heavyItem: heavyLegItem,
        routineTitle: routine ? routine.title : '下肢重训'
      };
    }
    return null;
  };

  // --- 拖拽生命周期处理 ---
  const handleDragStart = (e, item, fromDay) => {
    setDraggedItem({ item, fromDay });
    e.dataTransfer.effectAllowed = 'move';
    try {
      e.dataTransfer.setData('application/json', JSON.stringify({ item, fromDay }));
    } catch (err) {}
  };

  const handleDragOver = (e, target) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverTarget !== target) {
      setDragOverTarget(target);
    }
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e, targetDayOrBacklog) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverTarget(null);

    // 优先从 state 获取，兜底从 dataTransfer 解析
    let item = draggedItem?.item;
    let fromDay = draggedItem?.fromDay;

    if (!item) {
      try {
        const json = e.dataTransfer.getData('application/json');
        if (json) {
          const parsed = JSON.parse(json);
          item = parsed.item;
          fromDay = parsed.fromDay;
        }
      } catch (err) {}
    }

    if (!item || fromDay === undefined || fromDay === null) {
      setDraggedItem(null);
      return;
    }

    // 拖入相同位置，无操作
    if (fromDay === targetDayOrBacklog) {
      setDraggedItem(null);
      return;
    }

    // 执行跨列/跨备选池移动
    moveItemAtomic(item, fromDay, targetDayOrBacklog);
    setDraggedItem(null);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
    setDragOverTarget(null);
  };

  // 原子化移动方法 (支持拖拽或直接点击按钮调用)
  const moveItemAtomic = (item, fromLocation, toLocation) => {
    const newSchedule = schedule.map(d => ({ ...d, items: [...d.items] }));
    let newBacklog = [...backlog];

    // 1. 从来源移除
    if (fromLocation === 'backlog') {
      newBacklog = newBacklog.filter(i => i.id !== item.id);
    } else {
      const fromIdx = Number(fromLocation);
      newSchedule[fromIdx].items = newSchedule[fromIdx].items.filter(i => i.id !== item.id);
    }

    // 2. 添加到目标
    if (toLocation === 'backlog') {
      // 避免重复
      if (!newBacklog.some(i => i.id === item.id)) {
        newBacklog.push(item);
      }
    } else {
      const toIdx = Number(toLocation);
      newSchedule[toIdx].items.push(item);
    }

    commitChanges(newSchedule, newBacklog);
    setActiveMoveItemId(null);
  };

  // 快捷前移 (昨天) 或 后移 (明天)
  const handleShiftDayDelta = (fromDayIdx, itemId, delta) => {
    const targetDayIdx = (fromDayIdx + delta + 7) % 7;
    const day = schedule[fromDayIdx];
    const item = day?.items.find(i => i.id === itemId);
    if (!item) return;

    moveItemAtomic(item, fromDayIdx, targetDayIdx);
  };

  // 快捷存入备选池
  const handleSendToBacklog = (fromDayIdx, itemId) => {
    const day = schedule[fromDayIdx];
    const item = day?.items.find(i => i.id === itemId);
    if (!item) return;

    moveItemAtomic(item, fromDayIdx, 'backlog');
  };

  // 快捷从备选池移入今天或指定天
  const handleMoveBacklogToDay = (item, targetDayIdx) => {
    moveItemAtomic(item, 'backlog', targetDayIdx);
  };

  // 冲突自动避让：将当天的腿部移动到明天
  const handleResolveConflictShift = (dayIdx, heavyItemId) => {
    handleShiftDayDelta(dayIdx, heavyItemId, 1);
  };

  // 添加新活动
  const handleAddItem = (dayIndex, newItem) => {
    const newSchedule = schedule.map((d, idx) => {
      if (idx === dayIndex) {
        return {
          ...d,
          items: [...d.items, { id: 'item-' + Date.now(), completed: false, ...newItem }]
        };
      }
      return d;
    });
    commitChanges(newSchedule, backlog);
    setActiveMenuDay(null);
  };

  // 删除项目
  const handleDeleteItem = (dayIndex, itemId) => {
    if (dayIndex === 'backlog') {
      const newBacklog = backlog.filter(i => i.id !== itemId);
      commitChanges(schedule, newBacklog);
    } else {
      const newSchedule = schedule.map((d, idx) => {
        if (idx === dayIndex) {
          return { ...d, items: d.items.filter(i => i.id !== itemId) };
        }
        return d;
      });
      commitChanges(newSchedule, backlog);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* 顶部周看板控制栏 */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-dark-surface p-4 rounded-2xl border border-dark-border">
        <div className="flex items-center gap-2.5">
          <Calendar className="w-5 h-5 text-athletic-lime" />
          <div>
            <h2 className="font-bold text-text-primary text-base sm:text-lg">
              本周动态排期看板
            </h2>
            <div className="text-[11px] text-text-secondary">
              支持卡片自由拖拽、← 前移 / → 后移，或一键存入下方自由备选池
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="px-2.5 py-1 rounded-lg bg-dark-card border border-dark-border text-text-secondary">
            今日: <strong className="text-athletic-lime">{schedule[currentDayIndex]?.dayName || '今天'}</strong>
          </span>
        </div>
      </div>

      {/* 7 天周看板网格 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-3">
        {schedule.map((day) => {
          const isToday = day.dayIndex === currentDayIndex;
          const isOver = dragOverTarget === day.dayIndex;
          const conflict = checkDayConflict(day.items);

          return (
            <div
              key={day.dayIndex}
              onDragOver={(e) => handleDragOver(e, day.dayIndex)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, day.dayIndex)}
              className={`rounded-2xl border transition-all flex flex-col min-h-[280px] p-3 relative ${
                isOver
                  ? 'border-athletic-lime bg-athletic-lime/10 ring-2 ring-athletic-lime/40 shadow-xl'
                  : isToday
                  ? 'bg-dark-surface/90 border-athletic-lime/50 shadow-lg shadow-athletic-lime/5'
                  : 'bg-dark-surface/40 border-dark-border hover:border-dark-muted'
              }`}
            >
              {/* Day Header */}
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-dark-border/60">
                <div className="flex items-center gap-1.5">
                  <span className={`font-bold text-sm ${isToday ? 'text-athletic-lime' : 'text-text-primary'}`}>
                    {day.dayName}
                  </span>
                  {isToday && (
                    <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-athletic-lime text-black tracking-wide">
                      TODAY
                    </span>
                  )}
                </div>

                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setActiveMenuDay(activeMenuDay === day.dayIndex ? null : day.dayIndex)}
                    className="p-1 rounded-md text-text-secondary hover:text-text-primary hover:bg-dark-hover"
                    title="添加项目"
                  >
                    <Plus className="w-4 h-4" />
                  </button>

                  {/* 弹出添加菜单 */}
                  {activeMenuDay === day.dayIndex && (
                    <div className="absolute right-0 top-7 z-30 w-52 bg-dark-card border border-dark-border rounded-xl shadow-2xl p-2 text-xs space-y-1">
                      <div className="px-2 py-1 text-[10px] font-mono text-text-secondary uppercase tracking-wider">
                        添加运动
                      </div>
                      <button
                        type="button"
                        onClick={() => handleAddItem(day.dayIndex, { type: 'sport', sportType: 'tennis', title: '网球 1.5h', durationMin: 90 })}
                        className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-dark-hover text-text-primary flex items-center gap-2"
                      >
                        🎾 网球 (1.5小时)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAddItem(day.dayIndex, { type: 'sport', sportType: 'running', title: '慢跑 30min', durationMin: 30 })}
                        className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-dark-hover text-text-primary flex items-center gap-2"
                      >
                        🏃 户外慢跑 (30分钟)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAddItem(day.dayIndex, { type: 'sport', sportType: 'rest', title: '休息日 / 散步' })}
                        className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-dark-hover text-text-primary flex items-center gap-2"
                      >
                        🛌 纯休息日
                      </button>

                      <div className="border-t border-dark-border my-1" />
                      <div className="px-2 py-1 text-[10px] font-mono text-text-secondary uppercase tracking-wider">
                        力量套餐
                      </div>
                      {routineTemplates.map(rt => (
                        <button
                          key={rt.id}
                          type="button"
                          onClick={() => handleAddItem(day.dayIndex, { type: 'routine', routineId: rt.id })}
                          className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-dark-hover text-text-primary truncate"
                        >
                          🏋️ {rt.title}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* 冲突警告 (如果当天有网球与下肢深蹲) */}
              {conflict && (
                <div className="mb-2 p-2 rounded-xl bg-athletic-coral/10 border border-athletic-coral/30 text-[11px] text-athletic-coral animate-in fade-in">
                  <div className="flex items-center gap-1 font-semibold mb-1">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    <span>网球与{conflict.routineTitle}同日</span>
                  </div>
                  <p className="text-[10px] text-text-secondary mb-1.5 leading-tight">
                    下肢可能过度疲劳影响跑动。
                  </p>
                  <button
                    type="button"
                    onClick={() => handleResolveConflictShift(day.dayIndex, conflict.heavyItem.id)}
                    className="w-full py-1 px-1.5 rounded bg-athletic-coral text-white font-bold text-[10px] flex items-center justify-center gap-1 hover:brightness-110 active:scale-95 transition-all"
                  >
                    <span>一键顺延至明天</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              )}

              {/* 日程卡片列表 */}
              <div className="flex-1 space-y-2">
                {day.items.length === 0 ? (
                  <div className={`h-full flex flex-col items-center justify-center py-8 text-xs border border-dashed rounded-xl transition-colors ${
                    isOver ? 'border-athletic-lime text-athletic-lime' : 'border-dark-border/40 text-text-secondary/40'
                  }`}>
                    <span>{isOver ? '松手即可放入' : '无安排'}</span>
                    <span className="text-[10px]">{isOver ? '✨' : '可拖入项目'}</span>
                  </div>
                ) : (
                  day.items.map((item) => {
                    const isRoutine = item.type === 'routine';
                    const routine = isRoutine ? routineTemplates.find(r => r.id === item.routineId) : null;

                    return (
                      <div
                        key={item.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, item, day.dayIndex)}
                        onDragEnd={handleDragEnd}
                        onClick={() => {
                          if (isRoutine && routine) onOpenWorkout(routine);
                        }}
                        className={`group relative p-2.5 rounded-xl border transition-all cursor-grab active:cursor-grabbing shadow-sm hover:shadow-md select-none ${
                          isRoutine
                            ? 'bg-dark-card border-dark-border hover:border-athletic-lime/60'
                            : item.sportType === 'tennis'
                            ? 'bg-amber-950/20 border-amber-500/40 text-amber-300'
                            : item.sportType === 'running'
                            ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-300'
                            : 'bg-dark-bg/60 border-dark-border text-text-secondary'
                        }`}
                      >
                        {/* 顶栏：标签 + 快捷操作按钮 (前移、后移、存入备选池、删除) */}
                        <div className="flex items-start justify-between gap-1.5 mb-1">
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-dark-bg text-athletic-lime font-bold border border-dark-border">
                            {isRoutine ? routine?.tag : (item.sportType === 'tennis' ? '🎾 网球' : item.sportType === 'running' ? '🏃 跑步' : '🛌 休息')}
                          </span>

                          <div className="flex items-center gap-0.5 opacity-90 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                            {/* ← 前移到昨天 */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleShiftDayDelta(day.dayIndex, item.id, -1);
                              }}
                              className="p-1 rounded hover:bg-dark-hover text-text-secondary hover:text-text-primary"
                              title="前移到昨天 (←)"
                            >
                              <ArrowLeft className="w-3.5 h-3.5" />
                            </button>

                            {/* → 后移到明天 */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleShiftDayDelta(day.dayIndex, item.id, 1);
                              }}
                              className="p-1 rounded hover:bg-dark-hover text-text-secondary hover:text-text-primary"
                              title="后移到明天 (→)"
                            >
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>

                            {/* 📥 存入备选池 */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSendToBacklog(day.dayIndex, item.id);
                              }}
                              className="p-1 rounded hover:bg-dark-hover text-text-secondary hover:text-athletic-cyan"
                              title="存入自由备选池"
                            >
                              <Inbox className="w-3.5 h-3.5" />
                            </button>

                            {/* 垃圾桶删除 */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteItem(day.dayIndex, item.id);
                              }}
                              className="p-1 rounded hover:bg-dark-hover text-text-secondary hover:text-athletic-coral"
                              title="删除此项"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* 标题 */}
                        <div className="font-semibold text-xs text-text-primary group-hover:text-athletic-lime transition-colors">
                          {isRoutine ? routine?.title : item.title}
                        </div>

                        {/* 提示文案 */}
                        <div className="mt-1 flex items-center justify-between text-[10px] text-text-secondary font-mono">
                          {isRoutine ? (
                            <>
                              <span>{routine?.exercises.length} 个动作</span>
                              <span className="text-athletic-cyan">练后点此打卡 →</span>
                            </>
                          ) : (
                            <span>{item.durationMin ? `时长: ${item.durationMin} 分钟` : '活动日'}</span>
                          )}
                        </div>

                        {/* 移动端快捷移动展开面板 */}
                        {activeMoveItemId === item.id && (
                          <div
                            onClick={(e) => e.stopPropagation()}
                            className="mt-2 p-2 bg-dark-bg rounded-lg border border-dark-border text-[11px] space-y-1.5"
                          >
                            <div className="text-text-secondary font-semibold">快速移动到:</div>
                            <div className="grid grid-cols-4 gap-1">
                              {schedule.map(s => (
                                <button
                                  key={s.dayIndex}
                                  type="button"
                                  onClick={() => moveItemAtomic(item, day.dayIndex, s.dayIndex)}
                                  className="p-1 rounded bg-dark-card hover:bg-dark-hover text-center font-mono text-[10px]"
                                >
                                  {s.dayName}
                                </button>
                              ))}
                            </div>
                            <button
                              type="button"
                              onClick={() => moveItemAtomic(item, day.dayIndex, 'backlog')}
                              className="w-full py-1 rounded bg-dark-card hover:bg-dark-hover text-center text-[10px] text-athletic-cyan"
                            >
                              📥 放入自由备选池
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 底部自由备选池 (Backlog Pool) */}
      <div
        onDragOver={(e) => handleDragOver(e, 'backlog')}
        onDragLeave={handleDragLeave}
        onDrop={(e) => handleDrop(e, 'backlog')}
        className={`p-4 rounded-2xl border-2 border-dashed transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
          dragOverTarget === 'backlog'
            ? 'border-athletic-lime bg-athletic-lime/10 ring-4 ring-athletic-lime/30 shadow-2xl'
            : 'bg-dark-surface border-dark-border/80'
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-dark-card border border-dark-border flex items-center justify-center text-athletic-lime shrink-0">
            <Inbox className="w-4 h-4" />
          </div>
          <div>
            <div className="font-semibold text-xs text-text-primary flex items-center gap-2">
              <span>自由备选池 (暂存区)</span>
              <span className="px-1.5 py-0.2 rounded bg-dark-card border border-dark-border font-mono text-[10px] text-athletic-lime">
                {backlog.length} 个备选
              </span>
            </div>
            <div className="text-[11px] text-text-secondary">
              {dragOverTarget === 'backlog' ? (
                <strong className="text-athletic-lime font-bold">✨ 松开鼠标/手指，立即存入备选池！</strong>
              ) : (
                '有事耽误的项目可拖入此处或点击卡片上的 📥 按钮存入，不记缺勤；随时可拖回上方任意一天'
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {backlog.length === 0 ? (
            <div className="text-xs text-text-secondary/50 py-2 italic border border-dashed border-dark-border/50 px-3 rounded-lg">
              (暂无备选项目，直接将上方卡片拖拽到此处，或点击卡片上的 📥)
            </div>
          ) : (
            backlog.map(item => {
              const routine = item.type === 'routine' ? routineTemplates.find(r => r.id === item.routineId) : null;
              const title = item.title || routine?.title;

              return (
                <div
                  key={item.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, item, 'backlog')}
                  onDragEnd={handleDragEnd}
                  className="px-3 py-2 rounded-xl bg-dark-card border border-dark-border hover:border-athletic-lime text-xs text-text-primary cursor-grab active:cursor-grabbing transition-all flex items-center gap-2 shadow-sm"
                >
                  <span className="font-semibold">{title}</span>

                  <div className="flex items-center gap-1 border-l border-dark-border pl-1.5 ml-1">
                    {/* 一键移入今天 */}
                    <button
                      type="button"
                      onClick={() => handleMoveBacklogToDay(item, currentDayIndex)}
                      className="px-1.5 py-0.5 rounded bg-dark-surface hover:bg-dark-hover text-[10px] font-mono text-athletic-lime border border-dark-border"
                      title="移到今天"
                    >
                      移到今天
                    </button>

                    {/* 选择指定天 */}
                    <select
                      onChange={(e) => {
                        if (e.target.value !== '') {
                          handleMoveBacklogToDay(item, Number(e.target.value));
                        }
                      }}
                      defaultValue=""
                      className="px-1 py-0.5 rounded bg-dark-surface text-[10px] font-mono text-text-secondary border border-dark-border focus:outline-none"
                    >
                      <option value="" disabled>排期到...</option>
                      {schedule.map(s => (
                        <option key={s.dayIndex} value={s.dayIndex}>{s.dayName}</option>
                      ))}
                    </select>

                    {/* 删除 */}
                    <button
                      type="button"
                      onClick={() => handleDeleteItem('backlog', item.id)}
                      className="p-0.5 text-text-secondary hover:text-athletic-coral"
                      title="从备选池删除"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

    </div>
  );
};

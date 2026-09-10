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
  CheckCircle2,
  Clock,
  Sparkles,
  MoveHorizontal,
  ChevronDown
} from 'lucide-react';

export const WeeklyBoard = ({
  schedule,
  onUpdateSchedule,
  routineTemplates,
  onOpenWorkout,
  backlog = [],
  onUpdateBacklog
}) => {
  const [draggedItem, setDraggedItem] = useState(null); // { fromDay: number | 'backlog', item: object }
  const [activeMenuDay, setActiveMenuDay] = useState(null);

  // 获取今天是周几 (0=周一, ... 6=周日)
  const currentDayIndex = (() => {
    const day = new Date().getDay(); // 0 is Sunday in JS
    return day === 0 ? 6 : day - 1;
  })();

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

  // 拖拽处理
  const handleDragStart = (e, item, fromDay) => {
    setDraggedItem({ item, fromDay });
    e.dataTransfer.setData('text/plain', JSON.stringify({ item, fromDay }));
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e, targetDayIndex) => {
    e.preventDefault();
    if (!draggedItem) return;

    const { item, fromDay } = draggedItem;

    if (fromDay === targetDayIndex) {
      setDraggedItem(null);
      return;
    }

    const newSchedule = schedule.map(d => ({ ...d, items: [...d.items] }));
    let newBacklog = [...backlog];

    // 1. 从原处移除
    if (fromDay === 'backlog') {
      newBacklog = newBacklog.filter(i => i.id !== item.id);
    } else {
      newSchedule[fromDay].items = newSchedule[fromDay].items.filter(i => i.id !== item.id);
    }

    // 2. 加入新目标
    if (targetDayIndex === 'backlog') {
      newBacklog.push(item);
    } else {
      newSchedule[targetDayIndex].items.push(item);
    }

    onUpdateSchedule(newSchedule);
    if (onUpdateBacklog) onUpdateBacklog(newBacklog);
    setDraggedItem(null);
  };

  // 快捷冲突自动避让：将当天的腿部移动到第二天
  const handleResolveConflictShift = (dayIdx, heavyItemId) => {
    const nextDayIdx = (dayIdx + 1) % 7;
    const newSchedule = schedule.map(d => ({ ...d, items: [...d.items] }));

    const itemToMove = newSchedule[dayIdx].items.find(i => i.id === heavyItemId);
    if (!itemToMove) return;

    newSchedule[dayIdx].items = newSchedule[dayIdx].items.filter(i => i.id !== heavyItemId);
    newSchedule[nextDayIdx].items.push(itemToMove);

    onUpdateSchedule(newSchedule);
  };

  // 快捷添加活动
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
    onUpdateSchedule(newSchedule);
    setActiveMenuDay(null);
  };

  // 快捷删除项目
  const handleDeleteItem = (dayIndex, itemId) => {
    const newSchedule = schedule.map((d, idx) => {
      if (idx === dayIndex) {
        return {
          ...d,
          items: d.items.filter(i => i.id !== itemId)
        };
      }
      return d;
    });
    onUpdateSchedule(newSchedule);
  };

  // 移动项目到前一天/后一天 (移动端手势辅助)
  const handleShiftItemDay = (currentDay, itemId, delta) => {
    const targetDay = (currentDay + delta + 7) % 7;
    const newSchedule = schedule.map(d => ({ ...d, items: [...d.items] }));
    const item = newSchedule[currentDay].items.find(i => i.id === itemId);
    if (!item) return;

    newSchedule[currentDay].items = newSchedule[currentDay].items.filter(i => i.id !== itemId);
    newSchedule[targetDay].items.push(item);
    onUpdateSchedule(newSchedule);
  };

  return (
    <div className="space-y-6">
      
      {/* 顶部周进度指示条 */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-dark-surface p-4 rounded-2xl border border-dark-border">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-athletic-lime" />
          <h2 className="font-bold text-text-primary text-base sm:text-lg">
            本周动态排期看板
          </h2>
          <span className="text-xs text-text-secondary hidden sm:inline">
            (卡片可随意拖拽，网球与深蹲冲突时将自动提示)
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="px-2.5 py-1 rounded-lg bg-dark-card border border-dark-border text-text-secondary">
            今日: <strong className="text-athletic-lime">{schedule[currentDayIndex]?.dayName}</strong>
          </span>
        </div>
      </div>

      {/* 7 天周看板网格 (在手机上横向滑动或网格适配) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-3">
        {schedule.map((day) => {
          const isToday = day.dayIndex === currentDayIndex;
          const conflict = checkDayConflict(day.items);

          return (
            <div
              key={day.dayIndex}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, day.dayIndex)}
              className={`rounded-2xl border transition-all flex flex-col min-h-[260px] p-3 ${
                isToday
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
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-athletic-lime text-black tracking-wide">
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
                        添加运动或套餐
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
                    下肢可能过度疲劳影响场上蹬地。
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
                  <div className="h-full flex flex-col items-center justify-center py-6 text-text-secondary/40 text-xs border border-dashed border-dark-border/40 rounded-xl">
                    <span>无安排</span>
                    <span className="text-[10px]">可拖入项目</span>
                  </div>
                ) : (
                  day.items.map((item) => {
                    if (item.type === 'routine') {
                      const routine = routineTemplates.find(r => r.id === item.routineId);
                      if (!routine) return null;

                      return (
                        <div
                          key={item.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, item, day.dayIndex)}
                          onClick={() => onOpenWorkout(routine)}
                          className="group relative p-2.5 rounded-xl bg-dark-card border border-dark-border hover:border-athletic-lime/50 transition-all cursor-pointer shadow-sm hover:shadow-md"
                        >
                          <div className="flex items-start justify-between gap-1.5 mb-1">
                            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-dark-bg text-athletic-lime font-bold border border-dark-border">
                              {routine.tag}
                            </span>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleShiftItemDay(day.dayIndex, item.id, 1);
                                }}
                                className="p-0.5 text-text-secondary hover:text-text-primary"
                                title="移到明天"
                              >
                                <ArrowRight className="w-3 h-3" />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteItem(day.dayIndex, item.id);
                                }}
                                className="p-0.5 text-text-secondary hover:text-athletic-coral"
                                title="删除"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>

                          <div className="font-semibold text-xs text-text-primary group-hover:text-athletic-lime transition-colors">
                            {routine.title}
                          </div>

                          <div className="mt-1 flex items-center justify-between text-[10px] text-text-secondary font-mono">
                            <span>{routine.exercises.length} 个动作</span>
                            <span className="text-athletic-cyan">练后点此打卡 →</span>
                          </div>
                        </div>
                      );
                    }

                    // 运动类型卡片 (网球/跑步/散步)
                    return (
                      <div
                        key={item.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, item, day.dayIndex)}
                        className={`group relative p-2.5 rounded-xl border transition-all cursor-grab active:cursor-grabbing ${
                          item.sportType === 'tennis'
                            ? 'bg-amber-950/20 border-amber-500/40 text-amber-300'
                            : item.sportType === 'running'
                            ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-300'
                            : 'bg-dark-bg/60 border-dark-border text-text-secondary'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs flex items-center gap-1.5">
                            {item.sportType === 'tennis' && '🎾'}
                            {item.sportType === 'running' && '🏃'}
                            {item.sportType === 'rest' && '🛌'}
                            {item.title}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleDeleteItem(day.dayIndex, item.id)}
                            className="opacity-0 group-hover:opacity-100 p-0.5 text-text-secondary hover:text-athletic-coral transition-opacity"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                        {item.durationMin && (
                          <div className="mt-1 text-[10px] font-mono opacity-75">
                            时长: {item.durationMin} 分钟
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

      {/* 底部待办备选池 (Backlog Pool) */}
      <div
        onDragOver={handleDragOver}
        onDrop={(e) => handleDrop(e, 'backlog')}
        className="p-4 rounded-2xl bg-dark-surface border border-dashed border-dark-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
      >
        <div className="flex items-center gap-2">
          <MoveHorizontal className="w-4 h-4 text-athletic-lime" />
          <div>
            <div className="font-semibold text-xs text-text-primary">
              自由备选池 (暂存区)
            </div>
            <div className="text-[11px] text-text-secondary">
              本周没时间练的项目可以拖到这里，不计入缺勤，随时拖回任意一天
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {backlog.length === 0 ? (
            <span className="text-xs text-text-secondary/50 italic">
              (暂无备选项目，可从上方拖下)
            </span>
          ) : (
            backlog.map(item => (
              <div
                key={item.id}
                draggable
                onDragStart={(e) => handleDragStart(e, item, 'backlog')}
                className="px-2.5 py-1.5 rounded-lg bg-dark-card border border-dark-border text-xs text-text-primary cursor-grab active:cursor-grabbing hover:border-athletic-lime transition-all flex items-center gap-1.5"
              >
                <span>{item.title || routineTemplates.find(r => r.id === item.routineId)?.title}</span>
                <span className="text-[10px] text-text-secondary">↕ 拖动</span>
              </div>
            ))
          )}
        </div>
      </div>

    </div>
  );
};

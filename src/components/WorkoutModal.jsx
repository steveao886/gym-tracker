import React, { useState } from 'react';
import { X, Check, Dumbbell, ArrowUpRight, Flame, Plus, Minus, RotateCcw, AlertCircle } from 'lucide-react';
import confetti from 'canvas-confetti';
import { PlateCalculator } from './PlateCalculator';

export const WorkoutModal = ({
  isOpen,
  onClose,
  routine,
  exerciseLibrary,
  onSaveWorkout,
  peakRecords = {}
}) => {
  if (!isOpen || !routine) return null;

  // 初始状态：将动作库中最新的当前工作重量与目标组次数预填
  const [exercisesState, setExercisesState] = useState(() => {
    return routine.exercises.map((item) => {
      const libItem = exerciseLibrary.find(e => e.id === item.id) || {};
      const currentWt = libItem.currentWeight !== undefined ? libItem.currentWeight : item.targetWeight;
      return {
        id: item.id,
        name: libItem.name || item.id,
        category: libItem.target || libItem.category || '复合动作',
        sets: item.sets || 3,
        reps: item.reps || '8-10',
        weight: currentWt,
        isBarbell: libItem.category === 'barbell',
        isBodyweight: libItem.category === 'bodyweight',
        peakLbs: libItem.peakLbs || (peakRecords[item.id] ? peakRecords[item.id].peakLbs : null),
        completed: true, // 默认打勾：计划即打卡！
        targetMet: true // 是否达到满次数以触发下一次加重
      };
    });
  });

  const [notes, setNotes] = useState('');

  const handleToggleComplete = (idx) => {
    setExercisesState(prev => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], completed: !copy[idx].completed };
      return copy;
    });
  };

  const handleAdjustWeight = (idx, delta) => {
    setExercisesState(prev => {
      const copy = [...prev];
      const newWeight = Math.max(0, copy[idx].weight + delta);
      copy[idx] = { ...copy[idx], weight: newWeight };
      return copy;
    });
  };

  const handleToggleTargetMet = (idx) => {
    setExercisesState(prev => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], targetMet: !copy[idx].targetMet };
      return copy;
    });
  };

  const handleSave = (quickFullComplete = false) => {
    // 触发庆祝粒子
    try {
      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.8 },
        colors: ['#00E599', '#00D2FF', '#FFB800']
      });
    } catch (e) {}

    const workoutLog = {
      id: 'log-' + Date.now(),
      date: new Date().toISOString(),
      routineId: routine.id,
      routineTitle: routine.title,
      exercises: exercisesState.map(ex => ({
        id: ex.id,
        name: ex.name,
        sets: ex.sets,
        reps: ex.reps,
        weight: ex.weight,
        completed: quickFullComplete ? true : ex.completed,
        targetMet: quickFullComplete ? true : ex.targetMet
      })),
      notes
    };

    onSaveWorkout(workoutLog);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-dark-surface border border-dark-border rounded-2xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-dark-border flex items-center justify-between bg-dark-card/50">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded text-[11px] font-semibold tracking-wider uppercase bg-athletic-lime/10 text-athletic-lime border border-athletic-lime/30">
                {routine.tag}
              </span>
              <span className="text-xs text-text-secondary">练后快速确认</span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-text-primary tracking-tight">
              {routine.title}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-text-secondary hover:text-text-primary hover:bg-dark-hover rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
          <div className="bg-dark-bg/60 border border-dark-border/80 rounded-xl p-3 text-xs text-text-secondary flex items-start gap-2">
            <Flame className="w-4 h-4 text-athletic-lime shrink-0 mt-0.5" />
            <span>
              <strong>极简原则：</strong>所有项目已按今日预设工作重量预填。如果练得完全一致，直接点击底部<strong>“按计划全部完成”</strong>即可！
            </span>
          </div>

          {exercisesState.map((ex, idx) => {
            const recoveryPercent = ex.peakLbs && ex.weight > 0
              ? Math.min(100, Math.round((ex.weight / ex.peakLbs) * 100))
              : null;

            return (
              <div
                key={ex.id}
                className={`p-3.5 rounded-xl border transition-all ${
                  ex.completed
                    ? 'bg-dark-card border-dark-border hover:border-dark-muted'
                    : 'bg-dark-bg/40 border-dark-border/40 opacity-60'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <button
                      type="button"
                      onClick={() => handleToggleComplete(idx)}
                      className={`mt-0.5 w-6 h-6 rounded-md flex items-center justify-center border transition-all ${
                        ex.completed
                          ? 'bg-athletic-lime border-athletic-lime text-black'
                          : 'border-dark-border bg-dark-bg text-transparent'
                      }`}
                    >
                      <Check className="w-4 h-4 stroke-[3]" />
                    </button>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`font-semibold text-sm sm:text-base ${ex.completed ? 'text-text-primary' : 'line-through text-text-secondary'}`}>
                          {ex.name}
                        </span>
                        <span className="text-[11px] text-text-secondary font-mono">
                          ({ex.category})
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-text-secondary">
                        <span className="font-mono text-text-primary">
                          {ex.sets} 组 × {ex.reps} 次
                        </span>

                        {ex.weight > 0 && (
                          <span className="font-mono text-athletic-lime font-bold">
                            @ {ex.weight} lbs
                          </span>
                        )}

                        {recoveryPercent && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-athletic-cyan/10 text-athletic-cyan font-mono border border-athletic-cyan/20">
                            已恢复 {recoveryPercent}% (巅峰 {ex.peakLbs}#)
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 快速调节重量 */}
                  {ex.weight > 0 && ex.completed && (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleAdjustWeight(idx, -5)}
                        className="p-1 rounded bg-dark-surface hover:bg-dark-hover border border-dark-border text-text-secondary hover:text-text-primary text-xs"
                        title="减 5 磅"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-14 text-center font-mono text-xs font-bold text-text-primary">
                        {ex.weight} #
                      </span>
                      <button
                        type="button"
                        onClick={() => handleAdjustWeight(idx, 5)}
                        className="p-1 rounded bg-dark-surface hover:bg-dark-hover border border-dark-border text-text-secondary hover:text-text-primary text-xs"
                        title="加 5 磅"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                {/* 杠铃片挂法速查 */}
                {ex.isBarbell && ex.weight > 45 && ex.completed && (
                  <div className="mt-2.5 pt-2.5 border-t border-dark-border/50">
                    <PlateCalculator targetWeight={ex.weight} compact={false} />
                  </div>
                )}

                {/* 双重递进标记 (做满次数下次推荐加重) */}
                {ex.completed && ex.weight > 0 && (
                  <div className="mt-2 flex items-center justify-between text-[11px] text-text-secondary">
                    <span className="flex items-center gap-1">
                      <ArrowUpRight className="w-3.5 h-3.5 text-athletic-lime" />
                      下周双重递进：做满 {ex.reps} 次下次将自动推荐加重 (+5/+10#)
                    </span>
                    <button
                      type="button"
                      onClick={() => handleToggleTargetMet(idx)}
                      className={`px-2 py-0.5 rounded text-[10px] font-mono border transition-colors ${
                        ex.targetMet
                          ? 'bg-athletic-lime/10 border-athletic-lime/40 text-athletic-lime'
                          : 'bg-dark-bg border-dark-border text-text-secondary'
                      }`}
                    >
                      {ex.targetMet ? '✔ 次数已做满' : '未做满，下周保持原重'}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-dark-border bg-dark-card flex flex-col sm:flex-row items-center gap-2.5">
          <button
            type="button"
            onClick={() => handleSave(true)}
            className="w-full sm:flex-1 py-3 px-5 rounded-xl bg-athletic-lime hover:bg-athletic-limeHover text-black font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg shadow-athletic-lime/20 active:scale-[0.99] transition-all"
          >
            <Check className="w-5 h-5 stroke-[3]" />
            按计划全部完成 (一键打卡)
          </button>
          <button
            type="button"
            onClick={() => handleSave(false)}
            className="w-full sm:w-auto py-3 px-4 rounded-xl bg-dark-surface hover:bg-dark-hover border border-dark-border text-text-primary text-xs font-semibold transition-colors"
          >
            保存已修改状态
          </button>
        </div>

      </div>
    </div>
  );
};

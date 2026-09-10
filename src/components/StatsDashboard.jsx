import React from 'react';
import { Trophy, TrendingUp, Calendar, Zap, Activity, Clock, Flame, CheckCircle } from 'lucide-react';

export const StatsDashboard = ({
  history = [],
  exerciseLibrary = [],
  peakRecords = {},
  schedule = []
}) => {
  // 统计本周完成情况
  const completedStrengthThisWeek = history.filter(h => {
    const d = new Date(h.date);
    const now = new Date();
    const diffDays = (now - d) / (1000 * 60 * 60 * 24);
    return diffDays <= 7;
  }).length;

  // 统计本周排期中的网球时长
  let tennisMinutes = 0;
  let tennisCount = 0;
  schedule.forEach(day => {
    day.items.forEach(item => {
      if (item.type === 'sport' && item.sportType === 'tennis') {
        tennisCount++;
        tennisMinutes += (item.durationMin || 90);
      }
    });
  });

  // 巅峰恢复计算列表
  const peakExercises = [
    { id: 'bench_press', key: 'bench', name: '杠铃平板卧推', peak: 225 },
    { id: 'back_squat', key: 'squat', name: '标准杠铃后深蹲', peak: 315 },
    { id: 'deadlift', key: 'deadlift', name: '传统杠铃硬拉', peak: 405 },
    { id: 'barbell_ohp', key: 'ohp', name: '杠铃站姿推举', peak: 135 },
    { id: 'tbar_row', key: 'row', name: 'T-Bar 地雷管划船', peak: 160 },
  ];

  return (
    <div className="space-y-6">
      
      {/* 顶部总体活跃统计卡片 (Apple Fitness / Whoop 风格) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-dark-surface border border-dark-border flex flex-col justify-between">
          <div className="flex items-center justify-between text-text-secondary text-xs">
            <span>本周力量打卡</span>
            <Flame className="w-4 h-4 text-athletic-lime" />
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl sm:text-3xl font-bold font-mono text-text-primary">
              {completedStrengthThisWeek}
            </span>
            <span className="text-xs text-text-secondary">次完成</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-dark-surface border border-dark-border flex flex-col justify-between">
          <div className="flex items-center justify-between text-text-secondary text-xs">
            <span>本周网球安排</span>
            <Activity className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl sm:text-3xl font-bold font-mono text-amber-400">
              {(tennisMinutes / 60).toFixed(1)}
            </span>
            <span className="text-xs text-text-secondary">小时 ({tennisCount}场)</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-dark-surface border border-dark-border flex flex-col justify-between">
          <div className="flex items-center justify-between text-text-secondary text-xs">
            <span>历史总打卡</span>
            <Trophy className="w-4 h-4 text-athletic-cyan" />
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl sm:text-3xl font-bold font-mono text-athletic-cyan">
              {history.length}
            </span>
            <span className="text-xs text-text-secondary">次记录</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-dark-surface border border-dark-border flex flex-col justify-between">
          <div className="flex items-center justify-between text-text-secondary text-xs">
            <span>减脂活跃度</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl sm:text-3xl font-bold font-mono text-emerald-400">
              HIGH
            </span>
            <span className="text-xs text-text-secondary">稳步回升</span>
          </div>
        </div>
      </div>

      {/* 核心三项 + 大复合「巅峰恢复进度条」(Peak Recovery Trackers) */}
      <div className="p-5 rounded-2xl bg-dark-surface border border-dark-border space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-athletic-gold" />
            <h3 className="font-bold text-text-primary text-base sm:text-lg">
              力量巅峰回血进度条 (Peak Recovery Trackers)
            </h3>
          </div>
          <span className="text-xs text-text-secondary hidden sm:inline">
            基准：卧推225# · 深蹲315# · 硬拉405# (总计近千磅)
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {peakExercises.map((item) => {
            const exercise = exerciseLibrary.find(e => e.id === item.id);
            const currentWeight = exercise ? exercise.currentWeight : 0;
            const percent = Math.min(100, Math.round((currentWeight / item.peak) * 100));

            return (
              <div
                key={item.id}
                className="p-3.5 rounded-xl bg-dark-card border border-dark-border/80 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm text-text-primary">
                    {item.name}
                  </span>
                  <div className="flex items-center gap-1.5 font-mono text-xs">
                    <span className="text-athletic-lime font-bold">
                      {currentWeight} lbs
                    </span>
                    <span className="text-text-secondary">/ 巅峰 {item.peak} lbs</span>
                  </div>
                </div>

                {/* 进度条 */}
                <div className="w-full h-2.5 bg-dark-bg rounded-full overflow-hidden border border-dark-border/60">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-600 via-athletic-lime to-athletic-cyan rounded-full transition-all duration-500"
                    style={{ width: `${percent}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] font-mono text-text-secondary">
                  <span>已恢复 {percent}%</span>
                  <span>{percent >= 80 ? '🔥 老炮归位' : percent >= 50 ? '⚡ 稳健回升中' : '🌱 适应磨合期'}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 历史打卡日志 (Recent History) */}
      <div className="p-5 rounded-2xl bg-dark-surface border border-dark-border space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-athletic-cyan" />
            <h3 className="font-bold text-text-primary text-base sm:text-lg">
              最近打卡记录
            </h3>
          </div>
          <span className="text-xs font-mono text-text-secondary">
            共 {history.length} 条记录
          </span>
        </div>

        {history.length === 0 ? (
          <div className="py-8 text-center text-text-secondary/50 text-xs">
            暂无历史打卡。在看板点击任意力量训练卡片，即可快速打卡并自动更新恢复进度！
          </div>
        ) : (
          <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
            {history.slice(0, 10).map((log) => (
              <div
                key={log.id}
                className="p-3 rounded-xl bg-dark-card border border-dark-border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-text-primary">
                      {log.routineTitle}
                    </span>
                    <span className="text-[10px] font-mono text-text-secondary">
                      {new Date(log.date).toLocaleDateString()} {new Date(log.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2 text-text-secondary">
                    {log.exercises.filter(e => e.completed).map(e => (
                      <span key={e.id} className="font-mono text-[11px] bg-dark-bg px-1.5 py-0.5 rounded border border-dark-border/60">
                        {e.name}: {e.weight > 0 ? `${e.weight}#` : ''} {e.sets}×{e.reps}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-1 text-athletic-lime font-mono text-[11px] shrink-0">
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>已同步</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};

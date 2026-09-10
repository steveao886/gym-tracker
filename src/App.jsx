import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Dumbbell,
  Calendar,
  Trophy,
  Settings as SettingsIcon,
  RefreshCw,
  ListFilter
} from 'lucide-react';
import { storage } from './services/storage';
import { githubApi } from './services/githubApi';
import { WeeklyBoard } from './components/WeeklyBoard';
import { StatsDashboard } from './components/StatsDashboard';
import { WorkoutModal } from './components/WorkoutModal';
import { SettingsModal } from './components/SettingsModal';
import { PlateCalculator } from './components/PlateCalculator';
import { WeightInput } from './components/WeightInput';
import { applyWorkoutLog } from './lib/progression';
import { resetWeek } from './lib/resetWeek';

export function App() {
  const [appData, setAppData] = useState(() => storage.loadData());
  const [activeTab, setActiveTab] = useState('schedule'); // 'schedule' | 'stats' | 'exercises'
  const [activeWorkoutRoutine, setActiveWorkoutRoutine] = useState(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [syncStatus, setSyncStatus] = useState('idle'); // 'idle' | 'syncing' | 'synced' | 'error'
  const [syncMessage, setSyncMessage] = useState('');

  // 始终指向最新数据，供异步同步与弹窗回调使用，避免闭包拿到过期状态
  const appDataRef = useRef(appData);
  appDataRef.current = appData;

  // 每次本地状态变化，先立即持久化到 LocalStorage (Local-First)
  const updateData = useCallback((newDataOrFn) => {
    setAppData((prev) => {
      const nextData = typeof newDataOrFn === 'function' ? newDataOrFn(prev) : newDataOrFn;
      storage.saveData(nextData);
      return nextData;
    });
  }, []);

  // 触发后台同步到 GitHub
  const triggerGitHubSync = useCallback(async (dataOverride) => {
    const currentData = dataOverride || appDataRef.current;
    const { githubToken, githubRepo, githubBranch } = currentData.settings;
    if (!githubToken || !githubRepo) {
      setSyncStatus('idle');
      return;
    }

    setSyncStatus('syncing');
    try {
      await githubApi.syncData(
        githubToken,
        githubRepo,
        githubBranch || 'main',
        currentData
      );
      setSyncStatus('synced');
      setSyncMessage(`已同步至 GitHub [${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}]`);
      // 记录同步时间
      setAppData(prev => {
        const updated = {
          ...prev,
          settings: { ...prev.settings, lastSynced: new Date().toISOString() }
        };
        storage.saveData(updated);
        return updated;
      });
    } catch (err) {
      console.warn('Background sync failed:', err);
      setSyncStatus('error');
      setSyncMessage(err.message || '同步失败');
    }
  }, []);

  // 当 appData 改变并且已配置 GitHub 时，进行静默同步
  useEffect(() => {
    if (appData.settings.githubToken && appData.settings.githubRepo) {
      const timer = setTimeout(() => {
        triggerGitHubSync(appData);
      }, 3000); // 3秒防抖
      return () => clearTimeout(timer);
    }
  }, [appData.weeklySchedule, appData.backlog, appData.history, appData.exerciseLibrary]);

  // 处理练后打卡完成 (双重递进逻辑见 lib/progression)
  const handleSaveWorkout = (workoutLog) => {
    updateData((prev) => applyWorkoutLog(prev, workoutLog));
  };

  return (
    <div className="min-h-screen bg-dark-bg text-text-primary flex flex-col selection:bg-athletic-lime/20 selection:text-athletic-lime pb-16">
      
      {/* 顶部主导航栏 (Navbar) */}
      <header className="sticky top-0 z-40 bg-dark-bg/85 backdrop-blur-md border-b border-dark-border px-4 sm:px-6 py-3.5">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
          
          {/* Logo & 品牌 */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-athletic-lime flex items-center justify-center shadow-lg shadow-athletic-lime/10">
              <Dumbbell className="w-4 h-4 text-black stroke-[2.5]" />
            </div>
            <div>
              <div className="font-bold text-sm sm:text-base tracking-tight text-text-primary flex items-center gap-1.5">
                <span>GYM TRACKER</span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-dark-surface border border-dark-border text-athletic-lime">
                  v1.0
                </span>
              </div>
              <div className="text-[10px] text-text-secondary hidden sm:block">
                老将回归 · 渐进超负荷与动态周排期
              </div>
            </div>
          </div>

          {/* 中间 Tab 切换 */}
          <div className="flex items-center bg-dark-surface p-1 rounded-xl border border-dark-border text-xs font-semibold">
            <button
              onClick={() => setActiveTab('schedule')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === 'schedule'
                  ? 'bg-athletic-lime text-black shadow-sm font-bold'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>周看板</span>
            </button>

            <button
              onClick={() => setActiveTab('stats')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === 'stats'
                  ? 'bg-athletic-lime text-black shadow-sm font-bold'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              <Trophy className="w-3.5 h-3.5" />
              <span>大盘与巅峰</span>
            </button>

            <button
              onClick={() => setActiveTab('exercises')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === 'exercises'
                  ? 'bg-athletic-lime text-black shadow-sm font-bold'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              <ListFilter className="w-3.5 h-3.5" />
              <span>动作库</span>
            </button>
          </div>

          {/* 右侧：同步状态 & 设置入口 */}
          <div className="flex items-center gap-2">
            <div
              onClick={() => triggerGitHubSync()}
              title={syncMessage || '点击立即同步'}
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-dark-surface border border-dark-border text-[11px] font-mono text-text-secondary cursor-pointer hover:border-dark-muted transition-colors"
            >
              {syncStatus === 'syncing' ? (
                <RefreshCw className="w-3.5 h-3.5 text-athletic-lime animate-spin" />
              ) : syncStatus === 'synced' ? (
                <span className="w-2 h-2 rounded-full bg-athletic-lime shadow-sm shadow-athletic-lime/50" />
              ) : syncStatus === 'error' ? (
                <span className="w-2 h-2 rounded-full bg-athletic-coral" />
              ) : (
                <span className="w-2 h-2 rounded-full bg-zinc-500" />
              )}
              <span className="truncate max-w-[120px]">
                {syncStatus === 'syncing' ? '同步中...' : syncStatus === 'synced' ? '已同步' : appData.settings.githubToken ? '点击同步' : '本地运行'}
              </span>
            </div>

            <button
              onClick={() => setIsSettingsOpen(true)}
              className="p-2 rounded-xl bg-dark-surface hover:bg-dark-hover border border-dark-border text-text-secondary hover:text-text-primary transition-colors"
              title="设置与数据同步"
            >
              <SettingsIcon className="w-4 h-4" />
            </button>
          </div>

        </div>
      </header>

      {/* 主视图区域 (Main Body) */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-3 sm:px-6 py-6">
        
        {activeTab === 'schedule' && (
          <WeeklyBoard
            schedule={appData.weeklySchedule}
            routineTemplates={appData.routineTemplates}
            onOpenWorkout={(routine) => setActiveWorkoutRoutine(routine)}
            backlog={appData.backlog}
            onUpdateBoard={({ schedule, backlog }) => {
              updateData((prev) => ({
                ...prev,
                ...(schedule !== undefined ? { weeklySchedule: schedule } : {}),
                ...(backlog !== undefined ? { backlog } : {})
              }));
            }}
          />
        )}

        {activeTab === 'stats' && (
          <StatsDashboard
            history={appData.history}
            exerciseLibrary={appData.exerciseLibrary}
            peakRecords={appData.peakRecords}
            schedule={appData.weeklySchedule}
          />
        )}

        {activeTab === 'exercises' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between bg-dark-surface p-4 rounded-2xl border border-dark-border">
              <div>
                <h2 className="font-bold text-text-primary text-base sm:text-lg">
                  当前动作库与工作重量设置
                </h2>
                <p className="text-xs text-text-secondary mt-0.5">
                  所有项目均基于你的深蹲架、杠铃大片、单滑轮及自重环境配置。可在此微调基线重量。
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {appData.exerciseLibrary.map((ex) => (
                <div
                  key={ex.id}
                  className="p-4 rounded-xl bg-dark-surface border border-dark-border flex flex-col justify-between gap-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-semibold text-text-primary text-sm">
                        {ex.name}
                      </div>
                      <div className="text-[11px] text-text-secondary font-mono mt-0.5">
                        {ex.target} · {ex.category}
                      </div>
                    </div>
                    {ex.peakLbs && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-dark-card border border-dark-border text-athletic-gold">
                        巅峰 {ex.peakLbs}#
                      </span>
                    )}
                  </div>

                  {(ex.category !== 'bodyweight' || ex.currentWeight > 0) && (
                    <div className="pt-2 border-t border-dark-border/50 flex flex-col gap-2">
                      <div className="flex items-center justify-between text-xs font-mono">
                        <span className="text-text-secondary">当前基准工作重量:</span>
                        <div className="flex items-center gap-2">
                          <WeightInput
                            value={ex.currentWeight}
                            onCommit={(val) => {
                              updateData((prev) => ({
                                ...prev,
                                exerciseLibrary: prev.exerciseLibrary.map(item =>
                                  item.id === ex.id ? { ...item, currentWeight: val } : item
                                )
                              }));
                            }}
                            className="w-20 px-2 py-1 rounded bg-dark-card border border-dark-border text-center font-bold text-athletic-lime text-xs font-mono focus:outline-none focus:border-athletic-lime"
                          />
                          <span className="text-text-secondary">lbs</span>
                        </div>
                      </div>

                      {ex.category === 'barbell' && ex.currentWeight > 45 && (
                        <PlateCalculator targetWeight={ex.currentWeight} compact={true} />
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

      </main>

      {/* 练后打卡弹窗 (Zero-Friction Logger Modal) */}
      <WorkoutModal
        isOpen={!!activeWorkoutRoutine}
        onClose={() => setActiveWorkoutRoutine(null)}
        routine={activeWorkoutRoutine}
        exerciseLibrary={appData.exerciseLibrary}
        onSaveWorkout={handleSaveWorkout}
        peakRecords={appData.peakRecords}
      />

      {/* 设置与 GitHub 同步弹窗 */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={appData.settings}
        onUpdateSettings={(newSettings) => updateData((prev) => ({ ...prev, settings: { ...prev.settings, ...newSettings } }))}
        onExportJSON={() => storage.exportJSON(appData)}
        onImportJSON={async (file) => {
          try {
            const imported = await storage.importJSON(file);
            updateData(imported);
            setIsSettingsOpen(false);
          } catch (e) {
            alert('导入失败：无效的 JSON 格式');
          }
        }}
        allData={appData}
        onResetWeek={() => updateData((prev) => resetWeek(prev))}
        onTriggerSync={(newSettings) => {
          const base = appDataRef.current;
          triggerGitHubSync(newSettings ? { ...base, settings: { ...base.settings, ...newSettings } } : undefined);
        }}
      />

    </div>
  );
}

export default App;

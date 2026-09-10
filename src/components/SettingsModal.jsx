import React, { useState } from 'react';
import { X, Key, RefreshCw, Download, Upload, CheckCircle2, AlertCircle, ExternalLink, ShieldCheck, CalendarRange } from 'lucide-react';
import { githubApi } from '../services/githubApi';

// 外层只负责开关；表单在打开时才挂载并初始化 hooks，避免在 return null 之后调用 useState
export const SettingsModal = ({ isOpen, ...rest }) => {
  if (!isOpen) return null;
  return <SettingsForm {...rest} />;
};

const SettingsForm = ({
  onClose,
  settings,
  onUpdateSettings,
  onExportJSON,
  onImportJSON,
  allData,
  onTriggerSync,
  onResetWeek
}) => {
  const [token, setToken] = useState(settings.githubToken || '');
  const [repo, setRepo] = useState(settings.githubRepo || '');
  const [branch, setBranch] = useState(settings.githubBranch || 'main');
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState(null); // { success: boolean, msg: string }
  const [isConfirmingReset, setIsConfirmingReset] = useState(false);

  const handleSave = () => {
    onUpdateSettings({
      githubToken: token.trim(),
      githubRepo: repo.trim(),
      githubBranch: branch.trim()
    });
    onClose();
  };

  const handleTestConnection = async () => {
    if (!token || !repo) {
      setTestResult({ success: false, msg: '请先填写 GitHub Token 和 私有仓库名' });
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    try {
      const res = await githubApi.testConnection(token, repo);
      setTestResult({
        success: true,
        msg: `连接成功！已找到仓库: ${res.repoName} (${res.isPrivate ? '私有' : '公开'})`
      });
      // 立即用刚填写的配置触发一次全量同步 (显式传入，避免拿到保存前的旧设置)
      const nextSettings = {
        githubToken: token.trim(),
        githubRepo: repo.trim(),
        githubBranch: branch.trim()
      };
      onUpdateSettings(nextSettings);
      if (onTriggerSync) {
        onTriggerSync(nextSettings);
      }
    } catch (err) {
      setTestResult({ success: false, msg: err.message || '连接失败' });
    } finally {
      setIsTesting(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      onImportJSON(file);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-dark-surface border border-dark-border rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-dark-border flex items-center justify-between bg-dark-card/50">
          <div className="flex items-center gap-2">
            <Key className="w-5 h-5 text-athletic-lime" />
            <h2 className="text-lg font-bold text-text-primary">
              设置与 GitHub 数据同步
            </h2>
          </div>
          <button
            type="button"
            aria-label="关闭"
            onClick={onClose}
            className="p-1.5 text-text-secondary hover:text-text-primary hover:bg-dark-hover rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs">
          
          <div className="p-3 rounded-xl bg-dark-bg border border-dark-border flex items-start gap-2.5 text-text-secondary leading-relaxed">
            <ShieldCheck className="w-4 h-4 text-athletic-lime shrink-0 mt-0.5" />
            <div>
              <strong>数据完全私有：</strong>本网页代码公开托管在 GitHub Pages，但训练记录仅保存在你的私有仓库中。Token 只保存在本机浏览器 <code>localStorage</code>，不会流向任何第三方。
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="font-semibold text-text-primary flex items-center justify-between">
              <span>GitHub Personal Access Token (PAT)</span>
              <a
                href="https://github.com/settings/tokens?type=beta"
                target="_blank"
                rel="noreferrer"
                className="text-athletic-cyan hover:underline flex items-center gap-1 font-normal text-[11px]"
              >
                创建 Fine-grained Token <ExternalLink className="w-3 h-3" />
              </a>
            </label>
            <input
              type="password"
              placeholder="github_pat_11A..."
              value={token}
              onChange={(e) => setToken(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-dark-card border border-dark-border focus:border-athletic-lime focus:outline-none font-mono text-text-primary text-xs"
            />
            <p className="text-[10px] text-text-secondary">
              权限建议：只需勾选你的私有数据仓库，赋予 <strong>Contents: Read and write</strong> 即可。
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="font-semibold text-text-primary">
              私有数据仓库 (Private Repo)
            </label>
            <input
              type="text"
              placeholder="你的用户名/gym-data"
              value={repo}
              onChange={(e) => setRepo(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-dark-card border border-dark-border focus:border-athletic-lime focus:outline-none font-mono text-text-primary text-xs"
            />
            <p className="text-[10px] text-text-secondary">
              例如：<code>gaosi/gym-data</code> (若仓库不存在请先在 GitHub 创建一个空的私有仓库)
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="font-semibold text-text-primary">
              分支名称 (Branch)
            </label>
            <input
              type="text"
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-dark-card border border-dark-border focus:border-athletic-lime focus:outline-none font-mono text-text-primary text-xs"
            />
          </div>

          {/* 测试与反馈 */}
          <div className="pt-1">
            <button
              type="button"
              disabled={isTesting}
              onClick={handleTestConnection}
              className="w-full py-2.5 px-4 rounded-xl bg-dark-card hover:bg-dark-hover border border-dark-border text-text-primary font-semibold flex items-center justify-center gap-2 transition-all"
            >
              <RefreshCw className={`w-4 h-4 ${isTesting ? 'animate-spin text-athletic-lime' : ''}`} />
              {isTesting ? '正在连接 GitHub...' : '测试连通性并立即同步'}
            </button>

            {testResult && (
              <div className={`mt-2.5 p-2.5 rounded-xl border flex items-start gap-2 ${
                testResult.success
                  ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-300'
                  : 'bg-rose-950/20 border-rose-500/40 text-rose-300'
              }`}>
                {testResult.success ? <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" /> : <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />}
                <span className="text-[11px] leading-relaxed">{testResult.msg}</span>
              </div>
            )}
          </div>

          {/* 重排本周 */}
          <div className="pt-3 border-t border-dark-border space-y-2">
            <div className="font-semibold text-text-primary">
              重排本周
            </div>

            {isConfirmingReset ? (
              <div className="p-3 rounded-xl bg-athletic-coral/10 border border-athletic-coral/30 space-y-2.5">
                <p className="text-[11px] text-text-secondary leading-relaxed">
                  七天看板会恢复成预设排期，你在看板上做过的<strong className="text-athletic-coral">手动调整会被清空</strong>。
                  备选池、历史记录与工作重量都会保留。
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      onResetWeek();
                      setIsConfirmingReset(false);
                      onClose();
                    }}
                    className="flex-1 py-2 px-3 rounded-lg bg-athletic-coral text-white font-bold hover:brightness-110 active:scale-[0.99] transition-all"
                  >
                    确认重排
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsConfirmingReset(false)}
                    className="py-2 px-3 rounded-lg bg-dark-card hover:bg-dark-hover border border-dark-border text-text-secondary hover:text-text-primary"
                  >
                    取消重排
                  </button>
                </div>
              </div>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setIsConfirmingReset(true)}
                  className="w-full py-2 px-3 rounded-lg bg-dark-card hover:bg-dark-hover border border-dark-border text-text-secondary hover:text-text-primary flex items-center justify-center gap-1.5"
                >
                  <CalendarRange className="w-3.5 h-3.5" />
                  重排本周
                </button>
                <p className="text-[10px] text-text-secondary">
                  新一周开始时用它把看板恢复成预设排期：周四自重体能配晚间网球，周五到周日走推 / 拉 / 腿。
                </p>
              </>
            )}
          </div>

          {/* 本地备份与恢复 */}
          <div className="pt-3 border-t border-dark-border space-y-2">
            <div className="font-semibold text-text-primary">
              本地 JSON 备份与恢复 (无需网络)
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onExportJSON}
                className="flex-1 py-2 px-3 rounded-lg bg-dark-card hover:bg-dark-hover border border-dark-border text-text-secondary hover:text-text-primary flex items-center justify-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                导出 JSON 文件
              </button>

              <label className="flex-1 py-2 px-3 rounded-lg bg-dark-card hover:bg-dark-hover border border-dark-border text-text-secondary hover:text-text-primary flex items-center justify-center gap-1.5 cursor-pointer text-center">
                <Upload className="w-3.5 h-3.5" />
                导入 JSON 备份
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-dark-border bg-dark-card flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="py-2 px-4 rounded-xl text-text-secondary hover:text-text-primary"
          >
            取消
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="py-2 px-5 rounded-xl bg-athletic-lime hover:bg-athletic-limeHover text-black font-bold"
          >
            保存设置
          </button>
        </div>

      </div>
    </div>
  );
};

import React from 'react';

// 计算单边需要的杠铃片 (基于标准 45 lbs 杠铃杆)
export const calculatePlates = (targetWeight, barWeight = 45) => {
  if (targetWeight <= barWeight) {
    return { plates: [], perSideWeight: 0, remainder: 0 };
  }

  const netWeight = targetWeight - barWeight;
  const perSideTarget = netWeight / 2;
  const availablePlates = [45, 35, 25, 10, 5, 2.5];
  
  const result = [];
  let remaining = perSideTarget;

  for (const plate of availablePlates) {
    while (remaining >= plate) {
      result.push(plate);
      remaining = Math.round((remaining - plate) * 10) / 10;
    }
  }

  return {
    plates: result,
    perSideWeight: perSideTarget,
    remainder: remaining
  };
};

const PLATE_STYLES = {
  45: { label: '45', height: 'h-14', bg: 'bg-emerald-600 border-emerald-400 text-white', width: 'w-4' },
  35: { label: '35', height: 'h-12', bg: 'bg-amber-600 border-amber-400 text-white', width: 'w-3.5' },
  25: { label: '25', height: 'h-11', bg: 'bg-blue-600 border-blue-400 text-white', width: 'w-3' },
  10: { label: '10', height: 'h-8', bg: 'bg-slate-300 border-white text-slate-900', width: 'w-2.5' },
  5: { label: '5', height: 'h-6', bg: 'bg-red-600 border-red-400 text-white', width: 'w-2' },
  2.5: { label: '2.5', height: 'h-5', bg: 'bg-zinc-400 border-zinc-200 text-zinc-900', width: 'w-1.5' },
};

export const PlateCalculator = ({ targetWeight, barWeight = 45, compact = false }) => {
  const { plates, perSideWeight } = calculatePlates(targetWeight, barWeight);

  if (targetWeight <= barWeight) {
    return (
      <div className="text-xs text-text-secondary">
        空杆 ({barWeight} lbs)
      </div>
    );
  }

  // 聚合统计数量 (如 2×45#, 1×25#)
  const plateCounts = plates.reduce((acc, p) => {
    acc[p] = (acc[p] || 0) + 1;
    return acc;
  }, {});

  const countSummary = Object.entries(plateCounts)
    .sort((a, b) => Number(b[0]) - Number(a[0]))
    .map(([val, count]) => `${count > 1 ? `${count}×` : ''}${val}#`)
    .join(' + ');

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-2">
        <span className="text-xs font-mono text-athletic-lime font-medium">
          单侧 {perSideWeight} lbs:
        </span>
        <span className="text-xs font-mono text-text-primary tracking-tight font-semibold">
          {countSummary}
        </span>
      </div>

      {!compact && (
        <div className="flex items-center gap-1 bg-dark-bg/60 p-2 rounded-lg border border-dark-border/60 w-fit">
          {/* 杠铃套筒 (Sleeve Collar) */}
          <div className="w-2.5 h-8 bg-zinc-600 border-r-2 border-zinc-400 rounded-l" />
          <div className="h-4 w-4 bg-zinc-500" />
          
          {/* 杠铃片阵列 */}
          <div className="flex items-center gap-0.5">
            {plates.map((weight, idx) => {
              const style = PLATE_STYLES[weight] || { label: weight, height: 'h-8', bg: 'bg-zinc-500', width: 'w-2' };
              return (
                <div
                  key={idx}
                  title={`${weight} lbs`}
                  className={`${style.width} ${style.height} ${style.bg} border-t border-b flex items-center justify-center rounded-xs shadow-sm text-[9px] font-mono font-bold select-none`}
                >
                  <span className="rotate-90 scale-75 opacity-90">{style.label}</span>
                </div>
              );
            })}
          </div>

          {/* 杠铃卡扣 (Collar Clip) */}
          <div className="w-1.5 h-6 bg-athletic-coral rounded-r" title="卡扣固定" />
        </div>
      )}
    </div>
  );
};

// 计算单边需要的杠铃片 (基于标准 45 lbs 杠铃杆)
export const AVAILABLE_PLATES = [45, 35, 25, 10, 5, 2.5];

export const calculatePlates = (targetWeight, barWeight = 45) => {
  if (targetWeight <= barWeight) {
    return { plates: [], perSideWeight: 0, remainder: 0 };
  }

  const netWeight = targetWeight - barWeight;
  const perSideTarget = netWeight / 2;

  const result = [];
  let remaining = perSideTarget;

  for (const plate of AVAILABLE_PLATES) {
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

// 打卡后的“双重递进”逻辑：纯函数，便于单元测试
const LOWER_BODY_KEYS = ['squat', 'deadlift', 'rdl'];

export const isLowerBody = (exerciseId) => LOWER_BODY_KEYS.some(k => exerciseId.includes(k));

// 下肢 +10 磅，上肢 +5 磅
export const incrementFor = (exerciseId) => (isLowerBody(exerciseId) ? 10 : 5);

// 将一次打卡记录应用到整体数据：写入历史、更新工作重量、标记看板完成
export const applyWorkoutLog = (data, workoutLog) => {
  const history = [workoutLog, ...data.history];

  const exerciseLibrary = data.exerciseLibrary.map((ex) => {
    const logged = workoutLog.exercises.find((e) => e.id === ex.id);
    if (!logged || !logged.completed) return ex;
    const bump = logged.targetMet && logged.weight > 0 ? incrementFor(ex.id) : 0;
    return { ...ex, currentWeight: logged.weight + bump };
  });

  const weeklySchedule = data.weeklySchedule.map((day) => ({
    ...day,
    items: day.items.map((item) =>
      item.type === 'routine' && item.routineId === workoutLog.routineId
        ? { ...item, completed: true }
        : item
    )
  }));

  return { ...data, history, exerciseLibrary, weeklySchedule };
};

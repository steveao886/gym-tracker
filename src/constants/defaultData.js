// 核心动作库、预设套餐、巅峰基准数据与初始排程

export const PEAK_RECORDS = {
  bench: { name: '杠铃平板卧推', peakLbs: 225, defaultBaseline: 135, type: 'upper' },
  squat: { name: '杠铃深蹲', peakLbs: 315, defaultBaseline: 185, type: 'lower' },
  deadlift: { name: '传统杠铃硬拉', peakLbs: 405, defaultBaseline: 225, type: 'lower' },
  ohp: { name: '杠铃推举', peakLbs: 135, defaultBaseline: 85, type: 'upper' },
  row: { name: 'T-Bar/杠铃划船', peakLbs: 185, defaultBaseline: 115, type: 'upper' }
};

export const EXERCISE_LIBRARY = [
  // 杠铃项目 (车库深蹲架)
  { id: 'bench_press', name: '杠铃平板卧推', category: 'barbell', target: '胸部/三头', defaultSets: 3, defaultReps: '8-10', currentWeight: 135, peakLbs: 225 },
  { id: 'incline_bench', name: '杠铃上斜卧推', category: 'barbell', target: '上胸', defaultSets: 3, defaultReps: '8-10', currentWeight: 115, peakLbs: 185 },
  { id: 'back_squat', name: '标准杠铃后深蹲', category: 'barbell', target: '股四头/臀腿', defaultSets: 3, defaultReps: '8-10', currentWeight: 185, peakLbs: 315 },
  { id: 'deadlift', name: '传统杠铃硬拉', category: 'barbell', target: '后链/全身', defaultSets: 3, defaultReps: '6-8', currentWeight: 225, peakLbs: 405 },
  { id: 'rdl', name: '杠铃罗马尼亚硬拉 (RDL)', category: 'barbell', target: '腘绳肌/臀大肌', defaultSets: 3, defaultReps: '8-10', currentWeight: 155, peakLbs: 245 },
  { id: 'barbell_ohp', name: '杠铃站姿推举 (OHP)', category: 'barbell', target: '肩部/前束', defaultSets: 3, defaultReps: '8-10', currentWeight: 85, peakLbs: 135 },
  { id: 'tbar_row', name: 'T-Bar 地雷管划船', category: 'barbell', target: '背部厚度', defaultSets: 3, defaultReps: '8-10', currentWeight: 90, peakLbs: 160 },
  { id: 'barbell_row', name: '杠铃俯身划船', category: 'barbell', target: '上背/背阔肌', defaultSets: 3, defaultReps: '8-10', currentWeight: 115, peakLbs: 185 },

  // 单滑轮 Cable 项目
  { id: 'cable_pulldown', name: '单滑轮宽握下拉', category: 'cable', target: '背部宽度', defaultSets: 3, defaultReps: '8-12', currentWeight: 100 },
  { id: 'cable_tricep_pushdown', name: '单滑轮绳索三头下压', category: 'cable', target: '肱三头肌', defaultSets: 3, defaultReps: '10-12', currentWeight: 50 },
  { id: 'cable_single_fly', name: '单滑轮单臂绳索夹胸', category: 'cable', target: '胸肌内侧/下胸', defaultSets: 3, defaultReps: '10-12', currentWeight: 30 },
  { id: 'cable_lateral_raise', name: '单滑轮单臂侧平举', category: 'cable', target: '肩中束', defaultSets: 3, defaultReps: '10-12', currentWeight: 20 },
  { id: 'cable_face_pull', name: '单滑轮面拉 (护肩神器)', category: 'cable', target: '肩后束/肩袖', defaultSets: 3, defaultReps: '12-15', currentWeight: 40 },
  { id: 'cable_bicep_curl', name: '单滑轮曲柄二头弯举', category: 'cable', target: '肱二头肌', defaultSets: 3, defaultReps: '10-12', currentWeight: 45 },

  // 徒手/自重/杠铃片/后院项目
  { id: 'dips_chest', name: '双杠臂屈伸 (前倾偏胸)', category: 'bodyweight', target: '胸肌下部/三头', defaultSets: 3, defaultReps: '8-12', currentWeight: 0 },
  { id: 'pull_ups', name: '深蹲架单杠引体向上', category: 'bodyweight', target: '背阔肌/上肢拉', defaultSets: 3, defaultReps: '6-10', currentWeight: 0 },
  { id: 'push_ups', name: '标准/各角度俯卧撑', category: 'bodyweight', target: '胸肌/核心', defaultSets: 3, defaultReps: '12-15', currentWeight: 0 },
  { id: 'walking_lunges', name: '后院徒手箭步蹲走', category: 'bodyweight', target: '臀腿/心肺', defaultSets: 3, defaultReps: '16-20步', currentWeight: 0 },
  { id: 'hanging_leg_raise', name: '单杠悬垂举腿', category: 'bodyweight', target: '下腹核心', defaultSets: 3, defaultReps: '10-12', currentWeight: 0 },
  { id: 'plate_pinch_press', name: '杠铃片夹胸推 (Svend Press)', category: 'bodyweight', target: '内胸挤压', defaultSets: 3, defaultReps: '10-12', currentWeight: 25 },
  { id: 'core_plank', name: '平板支撑与侧平板', category: 'bodyweight', target: '腹横肌/核心稳定', defaultSets: 3, defaultReps: '45-60秒', currentWeight: 0 }
];

export const ROUTINE_TEMPLATES = [
  {
    id: 'routine_chest_triceps',
    title: '卧推主导 · 胸与三头',
    tag: 'Upper Push',
    color: '#00E599',
    description: '杠铃平板+上斜卧推为主干，双杠臂屈伸与单滑轮三头雕刻',
    isLegHeavy: false,
    exercises: [
      { id: 'bench_press', sets: 3, reps: '8-10', targetWeight: 135 },
      { id: 'incline_bench', sets: 3, reps: '8-10', targetWeight: 115 },
      { id: 'dips_chest', sets: 3, reps: '8-12', targetWeight: 0 },
      { id: 'cable_single_fly', sets: 3, reps: '10-12', targetWeight: 30 },
      { id: 'cable_tricep_pushdown', sets: 3, reps: '10-12', targetWeight: 50 }
    ]
  },
  {
    id: 'routine_squat_core',
    title: '深蹲主导 · 下肢与核心',
    tag: 'Lower Quad',
    color: '#00D2FF',
    description: '标准杠铃深蹲打底，后链RDL强化，后院箭步走与核心',
    isLegHeavy: true, // 标记为高负荷腿部，遇网球触发智能避让
    exercises: [
      { id: 'back_squat', sets: 3, reps: '8-10', targetWeight: 185 },
      { id: 'rdl', sets: 3, reps: '8-10', targetWeight: 155 },
      { id: 'walking_lunges', sets: 3, reps: '16-20步', targetWeight: 0 },
      { id: 'hanging_leg_raise', sets: 3, reps: '10-12', targetWeight: 0 }
    ]
  },
  {
    id: 'routine_back_biceps',
    title: '背部主导 · 经典拉',
    tag: 'Upper Pull',
    color: '#3B82F6',
    description: 'T-Bar地雷管划船+单滑轮高位下拉+引体，打造雄厚背肌',
    isLegHeavy: false,
    exercises: [
      { id: 'tbar_row', sets: 3, reps: '8-10', targetWeight: 90 },
      { id: 'cable_pulldown', sets: 3, reps: '8-12', targetWeight: 100 },
      { id: 'pull_ups', sets: 3, reps: '6-10', targetWeight: 0 },
      { id: 'cable_face_pull', sets: 3, reps: '12-15', targetWeight: 40 },
      { id: 'cable_bicep_curl', sets: 3, reps: '10-12', targetWeight: 45 }
    ]
  },
  {
    id: 'routine_deadlift_shoulders',
    title: '传统硬拉 · 肩部轰炸',
    tag: 'Hinge & Delts',
    color: '#F59E0B',
    description: '硬拉激活全身后链神经募集，搭配杠铃推举与单滑轮飞鸟',
    isLegHeavy: true, // 传统硬拉对神经与腿后侧消耗大
    exercises: [
      { id: 'deadlift', sets: 3, reps: '6-8', targetWeight: 225 },
      { id: 'barbell_ohp', sets: 3, reps: '8-10', targetWeight: 85 },
      { id: 'cable_lateral_raise', sets: 3, reps: '10-12', targetWeight: 20 },
      { id: 'cable_face_pull', sets: 3, reps: '12-15', targetWeight: 40 }
    ]
  },
  {
    id: 'routine_outdoor_bodyweight',
    title: '阳光后院 · 纯自重与体能',
    tag: 'Backyard',
    color: '#10B981',
    description: '好天气户外开练，俯卧撑变式+箭步走+深层核心稳定',
    isLegHeavy: false,
    exercises: [
      { id: 'push_ups', sets: 3, reps: '12-15', targetWeight: 0 },
      { id: 'walking_lunges', sets: 3, reps: '20步', targetWeight: 0 },
      { id: 'core_plank', sets: 3, reps: '45-60秒', targetWeight: 0 },
      { id: 'plate_pinch_press', sets: 3, reps: '10-12', targetWeight: 25 }
    ]
  }
];

// 默认生成当前周的排期模版 (周一~周日)
export const getDefaultWeeklySchedule = () => {
  return [
    {
      dayIndex: 0,
      dayName: '周一',
      items: [
        { id: 'item-1', type: 'routine', routineId: 'routine_chest_triceps', completed: false }
      ]
    },
    {
      dayIndex: 1,
      dayName: '周二',
      items: [
        { id: 'item-2', type: 'sport', sportType: 'tennis', title: '网球 (晚间 1.5h)', durationMin: 90, completed: false }
      ]
    },
    {
      dayIndex: 2,
      dayName: '周三',
      items: [
        { id: 'item-3', type: 'routine', routineId: 'routine_back_biceps', completed: false }
      ]
    },
    {
      dayIndex: 3,
      dayName: '周四',
      items: [
        { id: 'item-4', type: 'routine', routineId: 'routine_squat_core', completed: false }
      ]
    },
    {
      dayIndex: 4,
      dayName: '周五',
      items: [
        { id: 'item-5', type: 'sport', sportType: 'rest', title: '主动休息 / 散步', completed: false }
      ]
    },
    {
      dayIndex: 5,
      dayName: '周六',
      items: [
        { id: 'item-6', type: 'sport', sportType: 'tennis', title: '网球 (上午/下午 1.5h)', durationMin: 90, completed: false }
      ]
    },
    {
      dayIndex: 6,
      dayName: '周日',
      items: [
        { id: 'item-7', type: 'routine', routineId: 'routine_deadlift_shoulders', completed: false }
      ]
    }
  ];
};

export const INITIAL_APP_DATA = {
  version: '1.0.0',
  settings: {
    githubToken: '',
    githubRepo: '', // e.g. "username/gym-data"
    githubBranch: 'main',
    autoSync: true,
    lastSynced: null
  },
  peakRecords: PEAK_RECORDS,
  exerciseLibrary: EXERCISE_LIBRARY,
  routineTemplates: ROUTINE_TEMPLATES,
  weeklySchedule: getDefaultWeeklySchedule(),
  backlog: [
    { id: 'b1', type: 'sport', sportType: 'running', title: '户外慢跑 5km', durationMin: 30 },
    { id: 'b2', type: 'routine', routineId: 'routine_outdoor_bodyweight' }
  ],
  history: []
};

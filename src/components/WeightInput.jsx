import React, { useState, useEffect } from 'react';

// 重量输入框：允许临时清空而不把 0 写回数据；失焦时若仍为空则恢复原值
export const WeightInput = ({ value, onCommit, step = 5, className = '' }) => {
  const [text, setText] = useState(String(value));

  useEffect(() => {
    setText(String(value));
  }, [value]);

  const handleChange = (e) => {
    const next = e.target.value;
    setText(next);
    if (next === '') return;
    const num = Number(next);
    if (Number.isFinite(num) && num >= 0) onCommit(num);
  };

  const handleBlur = () => {
    if (text === '') setText(String(value));
  };

  return (
    <input
      type="number"
      step={step}
      min="0"
      value={text}
      onChange={handleChange}
      onBlur={handleBlur}
      className={className}
    />
  );
};

import React from 'react';
import { Progress } from './ui/progress';
export default function ProgressMeter({ value = 0, max = 100, ...props }) {
  const percentage = Math.max(0, Math.min(100, (value / Math.max(1, max)) * 100));
  return <Progress value={percentage} aria-valuetext={`${value} / ${max}`} {...props} />;
}

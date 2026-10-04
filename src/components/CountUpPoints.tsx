import React, { useEffect, useRef, useState } from 'react';

interface CountUpPointsProps {
  value: number;
  duration?: number;
  className?: string;
}

/**
 * Smooth number count-up animation component using requestAnimationFrame
 * with cubic ease-out. Animates on initial render and when value updates.
 */
export const CountUpPoints: React.FC<CountUpPointsProps> = ({
  value,
  duration = 800,
  className = '',
}) => {
  const safeValue = Math.max(0, Math.round(Number(value) || 0));
  const [displayValue, setDisplayValue] = useState<number>(0);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const currentValRef = useRef<number>(0);

  useEffect(() => {
    const startValue = currentValRef.current;
    const targetValue = safeValue;

    if (startValue === targetValue) {
      setDisplayValue(targetValue);
      return;
    }

    setIsUpdating(true);
    let startTime: number | null = null;
    let animId: number;

    // Cubic ease-out gives a fast initial tick and gentle deceleration
    const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

    const step = (now: number) => {
      if (!startTime) startTime = now;
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = easeOutCubic(progress);

      const current = Math.round(startValue + (targetValue - startValue) * eased);
      currentValRef.current = current;
      setDisplayValue(current);

      if (progress < 1) {
        animId = requestAnimationFrame(step);
      } else {
        currentValRef.current = targetValue;
        setDisplayValue(targetValue);
        setIsUpdating(false);
      }
    };

    animId = requestAnimationFrame(step);

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [safeValue, duration]);

  return (
    <span
      className={`inline-block tabular-nums transition-colors duration-300 ${
        isUpdating ? 'text-pink-300 font-semibold' : ''
      } ${className}`}
    >
      {displayValue.toLocaleString()}
    </span>
  );
};

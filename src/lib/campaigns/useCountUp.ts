"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Counts up to `target` once on mount (ease-out, ~0.9s). Server render and later updates show
 * the value directly; reduced motion and hidden tabs skip the animation.
 */
export function useCountUp(target: number, duration = 900) {
  const [value, setValue] = useState(target);
  const firstRun = useRef(true);
  useEffect(() => {
    const animate = firstRun.current && target > 0 && !document.hidden && !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    firstRun.current = false;
    const start = performance.now();
    let frame = 0;
    const tick = (time: number) => {
      const progress = animate ? Math.min(1, (time - start) / duration) : 1;
      setValue(target * (1 - Math.pow(1 - progress, 3)));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, duration]);
  return value;
}

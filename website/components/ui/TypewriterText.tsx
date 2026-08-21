"use client";

import { Fragment, useEffect, useLayoutEffect, useRef, useState } from "react";

/** useLayoutEffect warns during SSR; fall back to useEffect on the server. */
const useIsomorphicLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

const systemPrefersReducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

type TypewriterTextProps = {
  text: string;
  className?: string;
  initialDelay?: number;
  letterDelay?: number;
  /** Wait until the heading scrolls into view before typing. */
  startOnView?: boolean;
  /** Show a blinking caret trailing the typed characters. */
  caret?: boolean;
  /** Type even when the OS asks for reduced motion. Use only for the hero headline. */
  ignoreReducedMotion?: boolean;
};

export default function TypewriterText({
  text,
  className,
  initialDelay = 260,
  letterDelay = 55,
  startOnView = false,
  caret = false,
  ignoreReducedMotion = false
}: TypewriterTextProps) {
  const skipAnimation = () => !ignoreReducedMotion && systemPrefersReducedMotion();
  const characters = Array.from(text);
  const total = characters.length;
  const hostRef = useRef<HTMLSpanElement>(null);

  // Seed with the full string so SSR and no-JS render readable text.
  const [revealed, setRevealed] = useState(total);

  // Blank it before the browser paints, otherwise hydration flashes the whole heading.
  useIsomorphicLayoutEffect(() => {
    if (!skipAnimation()) {
      setRevealed(0);
    }
  }, [text]);

  useEffect(() => {
    if (skipAnimation()) {
      setRevealed(total);
      return;
    }

    let startTimer: number | undefined;
    let interval: number | undefined;

    const stop = () => {
      window.clearTimeout(startTimer);
      window.clearInterval(interval);
    };

    const start = () => {
      startTimer = window.setTimeout(() => {
        interval = window.setInterval(() => {
          setRevealed((count) => {
            if (count >= total) {
              window.clearInterval(interval);
              return count;
            }

            return count + 1;
          });
        }, letterDelay);
      }, initialDelay);
    };

    if (!startOnView) {
      start();
      return stop;
    }

    const host = hostRef.current;

    if (!host) {
      setRevealed(total);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          observer.disconnect();
          start();
        }
      },
      { threshold: 0.3, rootMargin: "0px 0px -8% 0px" }
    );

    observer.observe(host);

    return () => {
      observer.disconnect();
      stop();
    };
  }, [initialDelay, letterDelay, startOnView, text, total]);

  return (
    <span className={className} ref={hostRef} aria-label={text}>
      {/*
        Every character stays in flow and only toggles `visibility`, so the heading
        reserves its final size from the first frame and nothing below it reflows.
      */}
      <span aria-hidden="true">
        {characters.map((character, index) => (
          <Fragment key={`${character}-${index}`}>
            {/* Caret sits just before the first not-yet-typed character, so it
                trails the cursor. It is rendered exactly once either way, so the
                heading's total width never changes. */}
            {caret && index === revealed ? <span className="typewriter-caret" /> : null}
            <span className={index < revealed ? "visible" : "invisible"}>{character}</span>
          </Fragment>
        ))}
        {caret && revealed >= total ? <span className="typewriter-caret" /> : null}
      </span>
    </span>
  );
}

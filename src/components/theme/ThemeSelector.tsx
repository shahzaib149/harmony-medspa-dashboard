"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useRef } from "react";
import { type ThemePreference, useTheme } from "./ThemeProvider";

const options = [
  { value: "dark" as const, label: "Dark", Icon: Moon },
  { value: "light" as const, label: "Light", Icon: Sun },
  { value: "system" as const, label: "System", Icon: Monitor },
];

export default function ThemeSelector() {
  const { theme, setTheme, mounted } = useTheme();
  const refs = useRef<Array<HTMLButtonElement | null>>([]);
  const selected = mounted ? theme : "dark";

  function select(value: ThemePreference, focus = false) {
    setTheme(value);
    if (focus)
      refs.current[
        options.findIndex((option) => option.value === value)
      ]?.focus();
  }

  return (
    <div>
      <div
        role="radiogroup"
        aria-label="Dashboard appearance"
        className="grid grid-cols-3 gap-2"
      >
        {options.map(({ value, label, Icon }, index) => {
          const checked = selected === value;
          return (
            <button
              key={value}
              ref={(node) => {
                refs.current[index] = node;
              }}
              type="button"
              role="radio"
              aria-checked={checked}
              tabIndex={checked ? 0 : -1}
              onClick={() => select(value)}
              onKeyDown={(event) => {
                if (
                  !["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(
                    event.key,
                  )
                )
                  return;
                event.preventDefault();
                const direction =
                  event.key === "ArrowLeft" || event.key === "ArrowUp" ? -1 : 1;
                select(
                  options[(index + direction + options.length) % options.length]
                    .value,
                  true,
                );
              }}
              className="theme-choice flex min-h-12 items-center justify-center gap-2 rounded-xl border px-2 text-sm font-semibold"
              data-selected={checked || undefined}
            >
              <Icon size={16} aria-hidden="true" />
              <span>{label}</span>
            </button>
          );
        })}
      </div>
      {mounted && theme === "system" && (
        <p className="mt-2 text-xs text-[var(--text-muted)]">
          Following your device setting
        </p>
      )}
    </div>
  );
}

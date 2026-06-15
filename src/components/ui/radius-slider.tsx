"use client";

import { Minus, Plus } from "lucide-react";
import { useId } from "react";

import { cn } from "@/src/utils/cn";

export function RadiusSlider({
  value,
  onChange,
  min = 5,
  max = 1000,
  step = 1,
  unit = "m",
  className,
}: {
  value: number;
  onChange: (next: number) => void;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  className?: string;
}) {
  const id = useId();
  const clamped = Math.min(Math.max(Number.isFinite(value) ? value : min, min), max);
  const percent = ((clamped - min) / (max - min)) * 100;

  const nudge = (delta: number) => {
    const next = Math.min(Math.max(clamped + delta, min), max);
    if (next !== clamped) onChange(next);
  };

  return (
    <div className={cn("space-y-2.5", className)}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-baseline gap-1">
          <span className="text-lg font-semibold tracking-[-0.02em] text-[#202c4b] tabular-nums">{clamped}</span>
          <span className="text-xs font-medium text-[#8b95a7]">{unit}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => nudge(-step)}
            disabled={clamped <= min}
            aria-label={`Decrease by ${step}${unit}`}
            className="grid size-7 place-items-center rounded-lg border border-[var(--border)] bg-white text-[#475067] transition hover:border-[#c5d8f4] hover:text-[#255ac8] disabled:opacity-40 disabled:hover:border-[var(--border)]"
          >
            <Minus className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => nudge(step)}
            disabled={clamped >= max}
            aria-label={`Increase by ${step}${unit}`}
            className="grid size-7 place-items-center rounded-lg border border-[var(--border)] bg-white text-[#475067] transition hover:border-[#c5d8f4] hover:text-[#255ac8] disabled:opacity-40 disabled:hover:border-[var(--border)]"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div className="relative h-4">
        {/* Track */}
        <div className="pointer-events-none absolute inset-y-0 left-0 my-auto h-1.5 w-full rounded-full bg-[#e9eef6]" />
        {/* Filled portion */}
        <div
          className="pointer-events-none absolute inset-y-0 left-0 my-auto h-1.5 rounded-full bg-[#255ac8]"
          style={{ width: `${percent}%` }}
        />
        <input
          id={id}
          type="range"
          min={min}
          max={max}
          step={step}
          value={clamped}
          onChange={(event) => onChange(Number(event.target.value))}
          aria-label={`Attendance radius in ${unit}`}
          className="radius-slider__input absolute inset-0 h-full w-full cursor-pointer appearance-none bg-transparent"
        />
      </div>

      <div className="flex justify-between text-[10px] font-medium text-[#aab2c2]">
        <span>{min}{unit}</span>
        <span>{max}{unit}</span>
      </div>
    </div>
  );
}

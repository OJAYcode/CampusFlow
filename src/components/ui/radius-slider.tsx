"use client";

import { useId } from "react";

import { cn } from "@/src/utils/cn";

export function RadiusSlider({
  value,
  onChange,
  min = 5,
  max = 1000,
  step = 5,
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

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-end justify-between gap-3">
        <div className="flex items-baseline gap-1.5">
          <span className="text-2xl font-semibold tracking-[-0.03em] text-[#202c4b] tabular-nums">{clamped}</span>
          <span className="text-sm font-medium text-[#667085]">{unit}</span>
        </div>
        <span className="rounded-full bg-[rgba(37,90,200,0.08)] px-2.5 py-1 text-[11px] font-medium text-[#255ac8]">
          Drag to adjust
        </span>
      </div>

      <div className="radius-slider relative h-6">
        {/* Filled track up to the thumb */}
        <div className="pointer-events-none absolute inset-y-0 left-0 my-auto h-2 w-full rounded-full bg-[#e6ecf6]" />
        <div
          className="pointer-events-none absolute inset-y-0 left-0 my-auto h-2 rounded-full bg-[linear-gradient(90deg,#255ac8,#4f86f0)]"
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

      <div className="flex justify-between text-[11px] font-medium text-[#9aa3b5]">
        <span>{min}{unit}</span>
        <span>{max}{unit}</span>
      </div>
    </div>
  );
}

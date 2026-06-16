"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { Button, Input } from "@/components/ui";

interface ExpiryDateFieldProps {
  name: string;
  onChange: (value: string) => void;
  value: string;
}

interface CalendarDay {
  date: string;
  day: number;
  inCurrentMonth: boolean;
}

const monthLabels = ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"];
const weekLabels = ["日", "一", "二", "三", "四", "五", "六"];

export function ExpiryDateField({ name, onChange, value }: ExpiryDateFieldProps) {
  const initial = parseDateValue(value);
  const [panelOpen, setPanelOpen] = useState(false);
  const [mode, setMode] = useState<"calendar" | "years">("calendar");
  const [viewYear, setViewYear] = useState(initial.year);
  const [viewMonth, setViewMonth] = useState(initial.month);
  const decadeStart = getDecadeStart(viewYear);
  const days = useMemo(() => buildCalendarDays(viewYear, viewMonth), [viewMonth, viewYear]);

  function moveMonth(offset: number) {
    const date = new Date(Date.UTC(viewYear, viewMonth + offset, 1));
    setViewYear(date.getUTCFullYear());
    setViewMonth(date.getUTCMonth());
  }

  function selectYear(year: number) {
    setViewYear(year);
    setMode("calendar");
  }

  return (
    <div className="grid gap-2">
      <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
        <Input
          helperText="可手动输入 YYYY-MM-DD，也可快速选择年份。"
          label="保质期"
          name={name}
          onChange={(event) => onChange(event.target.value)}
          placeholder="例如：2036-06-16"
          value={value}
        />
        <Button onClick={() => setPanelOpen((current) => !current)} type="button" variant="secondary">
          快速选择年份
        </Button>
      </div>
      <div
        aria-hidden={!panelOpen}
        className={[
          "rounded-card border border-soft-border bg-surface p-3 shadow-sm",
          panelOpen ? "" : "hidden"
        ].join(" ")}
      >
        {mode === "calendar" ? (
          <CalendarPanel
            days={days}
            month={viewMonth}
            onMoveMonth={moveMonth}
            onSelect={(date) => onChange(date)}
            onShowYears={() => setMode("years")}
            selectedDate={value}
            year={viewYear}
          />
        ) : (
          <YearPanel
            decadeStart={decadeStart}
            onMoveDecade={(offset) => setViewYear(viewYear + offset * 10)}
            onSelectYear={selectYear}
            selectedYear={parseDateValue(value).year}
          />
        )}
      </div>
    </div>
  );
}

function CalendarPanel({
  days,
  month,
  onMoveMonth,
  onSelect,
  onShowYears,
  selectedDate,
  year
}: {
  days: CalendarDay[];
  month: number;
  onMoveMonth: (offset: number) => void;
  onSelect: (date: string) => void;
  onShowYears: () => void;
  selectedDate: string;
  year: number;
}) {
  return (
    <div className="grid gap-3">
      <div className="flex items-center justify-between gap-2">
        <IconButton label="上个月" onClick={() => onMoveMonth(-1)}>
          <ChevronLeft aria-hidden size={16} />
        </IconButton>
        <button
          className="min-h-11 rounded-card px-3 text-sm font-semibold text-text-primary transition hover:bg-primary-light"
          onClick={onShowYears}
          type="button"
        >
          选择年份 {year} · {monthLabels[month]}
        </button>
        <IconButton label="下个月" onClick={() => onMoveMonth(1)}>
          <ChevronRight aria-hidden size={16} />
        </IconButton>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-xs text-text-tertiary">
        {weekLabels.map((label) => (
          <span key={label}>{label}</span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {days.map((day) => (
          <button
            className={[
              "min-h-10 rounded-card text-sm transition",
              day.inCurrentMonth ? "text-text-primary hover:bg-primary-light" : "text-text-tertiary",
              day.date === selectedDate ? "bg-primary text-white hover:bg-primary" : ""
            ].join(" ")}
            key={day.date}
            onClick={() => onSelect(day.date)}
            type="button"
          >
            {day.day}
          </button>
        ))}
      </div>
    </div>
  );
}

function YearPanel({
  decadeStart,
  onMoveDecade,
  onSelectYear,
  selectedYear
}: {
  decadeStart: number;
  onMoveDecade: (offset: number) => void;
  onSelectYear: (year: number) => void;
  selectedYear: number;
}) {
  const years = buildDecadeYears(decadeStart);

  return (
    <div className="grid gap-3">
      <div className="flex items-center justify-between gap-2">
        <IconButton label="上一个十年" onClick={() => onMoveDecade(-1)}>
          <ChevronLeft aria-hidden size={16} />
        </IconButton>
        <span className="text-sm font-semibold text-text-primary">
          {decadeStart} - {decadeStart + 9}
        </span>
        <IconButton label="下一个十年" onClick={() => onMoveDecade(1)}>
          <ChevronRight aria-hidden size={16} />
        </IconButton>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
        {years.map((year) => (
          <button
            className={[
              "min-h-11 rounded-card border px-2 text-sm font-medium transition",
              year === selectedYear
                ? "border-primary bg-primary text-white"
                : "border-soft-border bg-surface text-text-primary hover:bg-primary-light"
            ].join(" ")}
            key={year}
            onClick={() => onSelectYear(year)}
            type="button"
          >
            {year}
          </button>
        ))}
      </div>
    </div>
  );
}

function IconButton({ children, label, onClick }: { children: ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      aria-label={label}
      className="flex size-11 items-center justify-center rounded-card border border-soft-border text-text-secondary transition hover:bg-primary-light hover:text-primary"
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  );
}

export function getDecadeStart(year: number) {
  return Math.floor(year / 10) * 10;
}

export function buildDecadeYears(decadeStart: number) {
  return Array.from({ length: 10 }, (_, index) => decadeStart + index);
}

export function buildCalendarDays(year: number, month: number): CalendarDay[] {
  const firstDay = new Date(Date.UTC(year, month, 1));
  const start = new Date(firstDay);
  start.setUTCDate(firstDay.getUTCDate() - firstDay.getUTCDay());

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start);
    date.setUTCDate(start.getUTCDate() + index);
    const isoDate = date.toISOString().slice(0, 10);
    return {
      date: isoDate,
      day: date.getUTCDate(),
      inCurrentMonth: date.getUTCMonth() === month
    };
  });
}

function parseDateValue(value: string) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const date = new Date(`${value}T00:00:00.000Z`);
    if (!Number.isNaN(date.getTime())) {
      return { month: date.getUTCMonth(), year: date.getUTCFullYear() };
    }
  }

  const today = new Date();
  return { month: today.getMonth(), year: today.getFullYear() };
}

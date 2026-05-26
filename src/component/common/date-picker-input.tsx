"use client";

import { useEffect, useRef, useState } from "react";
import Calendar from "react-calendar";
import {
  formatInputDate,
  isoFromDate,
  parseToDate,
  todayIso,
} from "@/lib/date";
import { cn } from "@/lib/utils";
import "react-calendar/dist/Calendar.css";

interface DatePickerInputProps {
  value: string;
  onChange: (isoDate: string) => void;
  className?: string;
}

export function DatePickerInput({
  value,
  onChange,
  className,
}: DatePickerInputProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const isoValue = value || todayIso();
  const selectedDate = parseToDate(isoValue);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  return (
    <div ref={rootRef} className={cn("relative min-w-[5.5rem]", className)}>
      <input
        type="text"
        readOnly
        value={formatInputDate(isoValue)}
        onClick={() => setOpen((prev) => !prev)}
        className="h-8 w-full cursor-pointer rounded-md border border-black/15 bg-white px-2 text-sm outline-none focus:border-black"
        aria-label="날짜 선택"
      />
      {open ? (
        <div
          className="absolute left-0 top-full z-50 mt-1 overflow-hidden rounded-xl border border-black/15 bg-white shadow-lg"
          role="dialog"
          aria-label="달력"
        >
          <Calendar
            locale="ko-KR"
            calendarType="gregory"
            value={selectedDate}
            onChange={(next) => {
              if (next instanceof Date) {
                onChange(isoFromDate(next));
                setOpen(false);
              }
            }}
          />
        </div>
      ) : null}
    </div>
  );
}

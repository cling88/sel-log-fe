import type { MouseEvent, KeyboardEvent } from "react";
import { cn } from "@/lib/utils";

export function stopRowClickPropagation(event: MouseEvent | KeyboardEvent) {
  event.stopPropagation();
}

export function lineRowClickableClass(disabled?: boolean) {
  return cn(
    !disabled &&
      "cursor-pointer transition-colors hover:bg-[var(--primary-50)]/25",
  );
}

export function lineRowClickHandlers(
  lineId: string,
  onLineClick: (lineId: string) => void,
  disabled?: boolean,
) {
  if (disabled) return {};
  return {
    role: "button" as const,
    tabIndex: 0,
    onClick: () => onLineClick(lineId),
    onKeyDown: (event: KeyboardEvent) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        onLineClick(lineId);
      }
    },
  };
}

"use client";

import { useCallback, useState } from "react";

export function useRowHover() {
  const [hoveredRowId, setHoveredRowId] = useState<string | null>(null);

  const bindRow = useCallback((id: string) => {
    return {
      onMouseEnter: () => setHoveredRowId(id),
      onMouseLeave: () => setHoveredRowId(null),
    };
  }, []);

  const isHovered = useCallback(
    (id: string) => hoveredRowId === id,
    [hoveredRowId],
  );

  return { hoveredRowId, bindRow, isHovered, clearHover: () => setHoveredRowId(null) };
}

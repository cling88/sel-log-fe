/** BE §15 — 직전 금액 취소선 표시 여부 */
export function showAmended(
  previous: number | null | undefined,
  current: number,
): boolean {
  return previous != null && previous !== current;
}

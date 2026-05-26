export function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

export function formatWon(value: number) {
  return `${value.toLocaleString("ko-KR")}원`;
}

export function formatAmount(value: number) {
  return value.toLocaleString("ko-KR");
}

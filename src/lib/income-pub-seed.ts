import type { IncomeDepositLine } from "@/types/income";

export function createPubSeedIncomeLines(today: string): IncomeDepositLine[] {
  return [
    {
      id: "inc-seed-1",
      depositDate: today,
      itemName: "네이버 정산",
      amount: 120000,
      memo: "퍼블 샘플 입금",
      bankId: null,
      bank: null,
    },
  ];
}

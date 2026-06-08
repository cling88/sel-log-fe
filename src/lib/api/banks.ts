import { ApiError, apiFetch, type ApiEnvelope } from "@/lib/api-client";
import type { BankAccount, BankAccountInput } from "@/types/bank-account";

export function getBankErrorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return "출금계좌 요청에 실패했습니다.";
}

/** GET /api/v1/banks — soft delete 제외 */
export async function fetchBanks(): Promise<BankAccount[]> {
  const res = await apiFetch<ApiEnvelope<BankAccount[]>>("/banks");
  return res.data ?? [];
}

/** POST /api/v1/banks */
export async function createBank(body: BankAccountInput): Promise<BankAccount> {
  const res = await apiFetch<ApiEnvelope<BankAccount>>("/banks", {
    method: "POST",
    body: JSON.stringify(body),
  });
  return res.data;
}

/** PATCH /api/v1/banks/:id */
export async function updateBank(
  id: string,
  body: BankAccountInput,
): Promise<BankAccount> {
  const res = await apiFetch<ApiEnvelope<BankAccount>>(`/banks/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
  return res.data;
}

/** DELETE /api/v1/banks/:id — soft delete */
export async function deleteBank(id: string): Promise<void> {
  await apiFetch<ApiEnvelope<{ ok?: boolean }>>(`/banks/${id}`, {
    method: "DELETE",
  });
}

"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SaleChannelSelectField } from "@/components/ledger/sale/sale-channel-select-field";
import { useAuthUser } from "@/hooks/use-auth-user";
import { useUserSettings } from "@/hooks/use-settings";
import {
  feeRateToPercentInput,
  percentInputToFeeRate,
} from "@/lib/fee-rate";
import { DEFAULT_USER_SETTINGS } from "@/types/settings";

function percentToInput(rate: number): string {
  return feeRateToPercentInput(rate);
}

function inputToRate(value: string, fallback: number): number {
  return percentInputToFeeRate(value) ?? fallback;
}

export function SettingsPanel() {
  const authUser = useAuthUser();
  const { settings, isLoading, errorMessage, updateSettings, isSaving } =
    useUserSettings();
  const [marginMinPercent, setMarginMinPercent] = useState("");
  const [marginMaxPercent, setMarginMaxPercent] = useState("");
  const [vatPercent, setVatPercent] = useState("");
  const [defaultFeePercent, setDefaultFeePercent] = useState("");
  const [defaultChannelId, setDefaultChannelId] = useState<string>("none");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setMarginMinPercent(percentToInput(settings.marginMinRate));
    setMarginMaxPercent(percentToInput(settings.marginMaxRate));
    setVatPercent(
      String(
        Math.round(settings.vatExtractRate * 1100) / 10 || 10,
      ),
    );
    setDefaultFeePercent(percentToInput(settings.defaultPlatformFeeRate));
    setDefaultChannelId(settings.defaultChannelId ?? "none");
  }, [settings]);

  const handleSave = async () => {
    const marginMinRate = inputToRate(
      marginMinPercent,
      DEFAULT_USER_SETTINGS.marginMinRate,
    );
    const marginMaxRate = inputToRate(
      marginMaxPercent,
      DEFAULT_USER_SETTINGS.marginMaxRate,
    );
    if (marginMinRate > marginMaxRate) return;

    const vatPercentNum = Number(vatPercent.trim());
    const vatExtractRate =
      Number.isFinite(vatPercentNum) && vatPercentNum >= 0
        ? vatPercentNum / (100 + vatPercentNum)
        : DEFAULT_USER_SETTINGS.vatExtractRate;

    await updateSettings({
      marginMinRate,
      marginMaxRate,
      vatExtractRate,
      defaultPlatformFeeRate: inputToRate(
        defaultFeePercent,
        DEFAULT_USER_SETTINGS.defaultPlatformFeeRate,
      ),
      defaultChannelId:
        defaultChannelId === "none" ? null : defaultChannelId,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (isLoading) {
    return (
      <p className="text-sm text-[var(--color-text-muted)]">
        설정 불러오는 중...
      </p>
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      {errorMessage ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {errorMessage}
        </p>
      ) : null}

      <section className="rounded-xl border border-[var(--color-border)] bg-white p-5 shadow-[var(--shadow-sm)]">
        <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">
          로그인 계정
        </h2>
        {authUser ? (
          <p className="mt-2 text-sm text-[var(--color-text-primary)]">
            {authUser.email}
          </p>
        ) : (
          <p className="mt-2 text-sm text-[var(--color-text-muted)]">
            계정 정보를 불러올 수 없습니다.
          </p>
        )}
      </section>

      <section className="space-y-4 rounded-xl border border-[var(--color-border)] bg-white p-5 shadow-[var(--shadow-sm)]">
        <div>
          <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">
            추천 판매가
          </h2>
          <p className="mt-1 text-xs text-[var(--color-text-muted)]">
            매입 목록·재고반영 모달의 추천 판매가 범위에 사용됩니다.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="margin-min">마진 하한 (%)</Label>
            <Input
              id="margin-min"
              value={marginMinPercent}
              onChange={(e) => setMarginMinPercent(e.target.value)}
              inputMode="decimal"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="margin-max">마진 상한 (%)</Label>
            <Input
              id="margin-max"
              value={marginMaxPercent}
              onChange={(e) => setMarginMaxPercent(e.target.value)}
              inputMode="decimal"
            />
          </div>
        </div>
      </section>

      <section className="space-y-4 rounded-xl border border-[var(--color-border)] bg-white p-5 shadow-[var(--shadow-sm)]">
        <div>
          <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">
            세금·수수료 (추정)
          </h2>
          <p className="mt-1 text-xs text-[var(--color-text-muted)]">
            매출 추정 순익은 BE가 계산합니다. 부가세는 채널과 무관하게
            적용됩니다.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="vat-rate">부가세율 (%)</Label>
            <Input
              id="vat-rate"
              value={vatPercent}
              onChange={(e) => setVatPercent(e.target.value)}
              placeholder="10"
              inputMode="decimal"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="default-fee">기본 수수료 (%)</Label>
            <Input
              id="default-fee"
              value={defaultFeePercent}
              onChange={(e) => setDefaultFeePercent(e.target.value)}
              placeholder="6.36"
              inputMode="decimal"
            />
            <p className="text-[11px] text-[var(--color-text-muted)]">
              채널 미선택 시 fallback
            </p>
          </div>
        </div>
      </section>

      <section className="space-y-4 rounded-xl border border-[var(--color-border)] bg-white p-5 shadow-[var(--shadow-sm)]">
        <div>
          <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">
            매출 기본값
          </h2>
        </div>
        <SaleChannelSelectField
          label="기본 판매채널"
          channelId={defaultChannelId === "none" ? null : defaultChannelId}
          onChannelIdChange={(id) => setDefaultChannelId(id ?? "none")}
        />
      </section>

      <div className="flex items-center gap-3">
        <Button type="button" disabled={isSaving} onClick={() => void handleSave()}>
          {isSaving ? "저장 중..." : "저장"}
        </Button>
        {saved ? (
          <span className="text-sm text-emerald-700">저장되었습니다.</span>
        ) : null}
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useAppDialog } from "@/components/common/app-dialog-provider";
import { Button } from "@/components/ui/button";
import {
  downloadLedgerPeriodExcelExport,
  downloadProductExcelExport,
  getLedgerExportErrorMessage,
  type LedgerPeriodExportMode,
  type ProductExportScope,
} from "@/lib/api/ledger-export";
import { getTodayYearMonth, parseYearMonth } from "@/lib/ledger-period";
import type { LedgerTabId } from "@/types/common";
import { FileSpreadsheet } from "lucide-react";

interface LedgerExcelDownloadActionsProps {
  tabId: LedgerTabId;
}

type DownloadKey = LedgerPeriodExportMode | ProductExportScope;

const EXCEL_BUTTON_CLASS =
  "h-[26px] border-white/15 bg-white/10 px-2 text-[11px] text-white/70 shadow-none hover:border-white/25 hover:bg-white/15 hover:text-white disabled:opacity-50";

export function LedgerExcelDownloadActions({
  tabId,
}: LedgerExcelDownloadActionsProps) {
  const { alert } = useAppDialog();
  const searchParams = useSearchParams();
  const monthParam = searchParams.get("month");
  const selected = parseYearMonth(monthParam) ?? getTodayYearMonth();
  const [downloading, setDownloading] = useState<DownloadKey | null>(null);

  const isProducts = tabId === "products";
  const firstKey: DownloadKey = isProducts ? "all" : "year";
  const secondKey: DownloadKey = isProducts ? "active" : "month";
  const firstLabel = isProducts ? "전체다운로드" : "년도별 엑셀다운로드";
  const secondLabel = isProducts ? "활성다운로드" : "월별 엑셀다운로드";
  const firstShort = isProducts ? "전체" : "년도별";
  const secondShort = isProducts ? "활성" : "월별";

  const handleDownload = async (key: DownloadKey) => {
    setDownloading(key);
    try {
      if (isProducts) {
        await downloadProductExcelExport(key as ProductExportScope);
      } else {
        await downloadLedgerPeriodExcelExport(
          tabId as "purchase" | "sale" | "income",
          key as LedgerPeriodExportMode,
          selected,
        );
      }
    } catch (error) {
      await alert(getLedgerExportErrorMessage(error));
    } finally {
      setDownloading(null);
    }
  };

  const busy = downloading !== null;

  return (
    <div className="flex shrink-0 items-center gap-1.5 pb-0.5 sm:gap-2 translate-y-[-12%]">
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={busy}
        className={EXCEL_BUTTON_CLASS}
        onClick={() => void handleDownload(firstKey)}
      >
        <FileSpreadsheet className="mr-1 size-3 shrink-0" />
        <span className="sm:hidden">{firstShort}</span>
        <span className="hidden sm:inline">{firstLabel}</span>
        {downloading === firstKey ? "…" : null}
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={busy}
        className={EXCEL_BUTTON_CLASS}
        onClick={() => void handleDownload(secondKey)}
      >
        <FileSpreadsheet className="mr-1 size-3 shrink-0" />
        <span className="sm:hidden">{secondShort}</span>
        <span className="hidden sm:inline">{secondLabel}</span>
        {downloading === secondKey ? "…" : null}
      </Button>
    </div>
  );
}

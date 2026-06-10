"use client";

import { useState } from "react";
import { FileSpreadsheet } from "lucide-react";
import { useAppDialog } from "@/components/common/app-dialog-provider";
import { Button } from "@/components/ui/button";
import {
  downloadSourcingChannelsExcelExport,
  downloadSourcingProductsExcelExport,
  getSourcingExportErrorMessage,
} from "@/lib/api/sourcing-export";

interface SourcingExcelDownloadButtonProps {
  kind: "channels" | "products";
}

export function SourcingExcelDownloadButton({
  kind,
}: SourcingExcelDownloadButtonProps) {
  const { alert } = useAppDialog();
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      if (kind === "channels") {
        await downloadSourcingChannelsExcelExport();
      } else {
        await downloadSourcingProductsExcelExport();
      }
    } catch (error) {
      await alert(getSourcingExportErrorMessage(error), "오류");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={downloading}
      className="h-9 shrink-0 border-[var(--color-border)] bg-white shadow-none"
      onClick={() => void handleDownload()}
    >
      <FileSpreadsheet className="mr-1.5 size-3.5 shrink-0" />
      엑셀다운로드
      {downloading ? "…" : null}
    </Button>
  );
}

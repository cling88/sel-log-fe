export function ExcelDownloadButton() {
  return (
    <button
      type="button"
      className="inline-flex h-9 items-center gap-2 rounded-lg border border-black/15 bg-white px-4 text-sm font-medium text-black hover:bg-black/[0.03]"
    >
      <DownloadIcon />
      엑셀
    </button>
  );
}

function DownloadIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden
      className="text-black/60"
    >
      <path
        d="M8 2v8M5 7l3 3 3-3M3 12h10"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

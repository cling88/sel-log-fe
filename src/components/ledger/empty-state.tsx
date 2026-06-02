interface LedgerEmptyStateProps {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function LedgerEmptyState({
  title,
  description = "아직 등록된 내역이 없어요.",
  actionLabel,
  onAction,
}: LedgerEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] px-6 py-16 text-center shadow-[var(--shadow-sm)]">
      <p className="text-3xl" aria-hidden>
        📋
      </p>
      <p className="mt-4 text-base font-medium text-[var(--color-text-primary)]">
        {title}
      </p>
      <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
        {description}
      </p>
      {actionLabel ? (
        <button
          type="button"
          onClick={onAction}
          className="mt-6 rounded-lg bg-[var(--primary-500)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--primary-600)]"
        >
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}

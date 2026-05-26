import { cn } from "@/lib/utils";

export function TablePanel({
  search,
  onSearchChange,
  totalAmount,
  children,
  itemCount,
}: {
  search: string;
  onSearchChange: (value: string) => void;
  totalAmount: number;
  children: React.ReactNode;
  itemCount: number;
}) {
  return (
    <div className="rounded-2xl border border-black/15 bg-white">
      <div className="flex flex-col gap-3 border-b border-black/10 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <label className="relative max-w-xs flex-1">
          <span className="sr-only">검색</span>
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-black/50">
            <SearchIcon />
          </span>
          <input
            type="search"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="검색"
            className="h-10 w-full rounded-xl border border-black/15 bg-white pl-10 pr-3 text-sm outline-none focus:border-black"
          />
        </label>
        <p className="text-sm font-medium text-black">
          합계{" "}
          <span className="font-semibold">{totalAmount.toLocaleString("ko-KR")}원</span>
        </p>
      </div>
      <div className="flex items-stretch border-t border-black/10">{children}</div>
      <p className="border-t border-black/10 px-4 py-2 text-xs text-black/60">
        {itemCount}개 항목
      </p>
    </div>
  );
}

export function TableInsertGutter({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex w-11 shrink-0 flex-col border-r border-black/15 bg-white">
      {children}
    </div>
  );
}

export function TableDataScroll({ children }: { children: React.ReactNode }) {
  return <div className="min-w-0 flex-1 overflow-x-auto">{children}</div>;
}

export function InlineInput({
  value,
  onChange,
  className,
  type = "text",
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  type?: "text" | "number";
  placeholder?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={cn(
        "h-8 w-full min-w-[4rem] rounded-md border border-black/15 bg-white px-2 text-sm outline-none focus:border-black",
        className,
      )}
    />
  );
}

export function DraftRowActions({
  onSave,
  onCancel,
}: {
  onSave: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="flex items-center justify-end gap-1">
      <ActionButton variant="primary" onClick={onSave}>
        저장
      </ActionButton>
      <ActionButton onClick={onCancel}>취소</ActionButton>
    </div>
  );
}

export const dataRowClass = "group/row border-b border-black/5 hover:bg-black/[0.03]";

export function GutterHeaderSpacer() {
  return <div className="h-[42px] shrink-0 border-b border-black/15" />;
}

export function GutterRowSlot({
  showInsert,
  onInsert,
  visible,
  className,
  rowHoverHandlers,
}: {
  showInsert?: boolean;
  onInsert?: () => void;
  visible?: boolean;
  className?: string;
  rowHoverHandlers?: {
    onMouseEnter: () => void;
    onMouseLeave: () => void;
  };
}) {
  return (
    <div
      {...rowHoverHandlers}
      className={cn(
        "flex min-h-[41px] items-center justify-center border-b border-black/10 py-2",
        className,
      )}
    >
      {showInsert && onInsert ? (
        <RowInsertButton onInsert={onInsert} visible={visible} />
      ) : null}
    </div>
  );
}

export function RowInsertButton({
  onInsert,
  visible = false,
}: {
  onInsert: () => void;
  visible?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onInsert}
      aria-label="아래에 행 추가"
      className={cn(
        "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-black bg-white text-base leading-none text-black transition-opacity",
        visible
          ? "pointer-events-auto opacity-100"
          : "pointer-events-none opacity-0",
        "hover:bg-black hover:text-white",
        "focus:pointer-events-auto focus:opacity-100",
      )}
    >
      +
    </button>
  );
}

export function RowActions({
  editing,
  onEdit,
  onSave,
  onCancel,
  onDelete,
}: {
  editing: boolean;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  onDelete: () => void;
}) {
  if (editing) {
    return <DraftRowActions onSave={onSave} onCancel={onCancel} />;
  }

  return (
    <div className="flex items-center justify-end gap-1">
      <ActionButton onClick={onEdit}>수정</ActionButton>
      <ActionButton variant="danger" onClick={onDelete}>
        삭제
      </ActionButton>
    </div>
  );
}

function ActionButton({
  children,
  onClick,
  variant = "default",
}: {
  children: React.ReactNode;
  onClick: () => void;
  variant?: "default" | "primary" | "danger";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-md px-2 py-1 text-xs font-medium",
        variant === "primary" && "bg-black text-white hover:bg-black/90",
        variant === "danger" && "text-black hover:bg-black/5",
        variant === "default" && "text-black/70 hover:bg-black/5",
      )}
    >
      {children}
    </button>
  );
}

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M10.5 10.5L14 14"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export const tableClass = "w-full border-collapse";

export const thClass =
  "px-3 py-2.5 text-left text-xs font-medium text-black/60 whitespace-nowrap";
export const tdClass = "px-3 py-2 text-sm text-black whitespace-nowrap";
export const draftRowClass = "border-b border-black/10 bg-white";
export const registerRowClass =
  "border-t-2 border-dashed border-black/20 bg-white";

"use client";

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  CircleHelp,
  CircleX,
  Info,
  Trash2,
  TriangleAlert,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export interface AppConfirmOptions {
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
}

interface AppDialogContextValue {
  alert: (message: string, title?: string) => Promise<void>;
  confirm: (options: AppConfirmOptions) => Promise<boolean>;
}

const AppDialogContext = createContext<AppDialogContextValue | null>(null);

type Pending =
  | { kind: "alert"; resolve: () => void }
  | { kind: "confirm"; resolve: (value: boolean) => void };

const APP_CONFIRM_FOOTER_CLASS =
  "mx-0 mb-0 shrink-0 flex-col-reverse gap-2 border-t border-[var(--color-border)] px-5 py-2 sm:flex-row sm:justify-end";

export function useAppDialog(): AppDialogContextValue {
  const ctx = useContext(AppDialogContext);
  if (!ctx) {
    throw new Error("useAppDialog must be used within AppDialogProvider");
  }
  return ctx;
}

const DIALOG_ICON_CLASS = "text-[var(--color-text-primary)]";

function resolveTitleIcon(options: {
  title: string;
  kind: "alert" | "confirm";
  destructive: boolean;
}): { Icon: LucideIcon; className: string } {
  const title = options.title.trim();

  if (title.includes("에러") || title.includes("오류")) {
    return { Icon: CircleX, className: "text-[var(--color-danger)]" };
  }
  if (options.destructive || title.includes("삭제")) {
    return { Icon: Trash2, className: DIALOG_ICON_CLASS };
  }
  if (title.includes("경고") || title.includes("주의")) {
    return { Icon: TriangleAlert, className: DIALOG_ICON_CLASS };
  }
  if (options.kind === "confirm") {
    return { Icon: CircleHelp, className: DIALOG_ICON_CLASS };
  }

  return { Icon: Info, className: DIALOG_ICON_CLASS };
}

export function AppDialogProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<"alert" | "confirm">("alert");
  const [title, setTitle] = useState("안내");
  const [message, setMessage] = useState("");
  const [confirmLabel, setConfirmLabel] = useState("확인");
  const [cancelLabel, setCancelLabel] = useState("취소");
  const [destructive, setDestructive] = useState(false);
  const pendingRef = useRef<Pending | null>(null);

  const finish = useCallback((value: boolean) => {
    const pending = pendingRef.current;
    pendingRef.current = null;
    setOpen(false);
    if (!pending) return;
    if (pending.kind === "alert") pending.resolve();
    else pending.resolve(value);
  }, []);

  const alert = useCallback((msg: string, dialogTitle = "안내") => {
    return new Promise<void>((resolve) => {
      pendingRef.current = { kind: "alert", resolve };
      setKind("alert");
      setTitle(dialogTitle);
      setMessage(msg);
      setConfirmLabel("확인");
      setDestructive(false);
      setOpen(true);
    });
  }, []);

  const confirm = useCallback((options: AppConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      pendingRef.current = { kind: "confirm", resolve };
      setKind("confirm");
      setTitle(options.title ?? "확인");
      setMessage(options.message);
      setConfirmLabel(options.confirmLabel ?? "확인");
      setCancelLabel(options.cancelLabel ?? "취소");
      setDestructive(options.destructive ?? false);
      setOpen(true);
    });
  }, []);

  const titleIcon = resolveTitleIcon({ title, kind, destructive });
  const TitleIcon = titleIcon.Icon;
  const accessibleTitle = kind === "confirm" && title !== "확인" ? title : message;

  return (
    <AppDialogContext.Provider value={{ alert, confirm }}>
      {children}
      <Dialog
        open={open}
        onOpenChange={(next) => {
          if (!next) finish(kind === "confirm" ? false : true);
        }}
      >
        <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-sm">
          <DialogTitle className="sr-only">{accessibleTitle}</DialogTitle>

          <div
            className={cn(
              "px-5 py-5 text-center",
              kind === "alert" ? "pb-6" : "pb-4",
            )}
          >
            <TitleIcon
              className={cn(
                "mx-auto mb-3 size-[21px] shrink-0",
                titleIcon.className,
              )}
              aria-hidden
            />
            <DialogDescription className="text-sm leading-relaxed whitespace-pre-wrap text-[var(--color-text-primary)]">
              {message}
            </DialogDescription>
          </div>

          {kind === "confirm" ? (
            <DialogFooter className={APP_CONFIRM_FOOTER_CLASS}>
              <Button
                type="button"
                variant="outline"
                onClick={() => finish(false)}
              >
                {cancelLabel}
              </Button>
              <Button
                type="button"
                variant={destructive ? "destructive" : "default"}
                onClick={() => finish(true)}
              >
                {confirmLabel}
              </Button>
            </DialogFooter>
          ) : null}
        </DialogContent>
      </Dialog>
    </AppDialogContext.Provider>
  );
}

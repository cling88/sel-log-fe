"use client";

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Button } from "@/components/ui/button";
import { MODAL_DIALOG_FOOTER_CLASS } from "@/components/common/modal-footer-classes";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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

export function useAppDialog(): AppDialogContextValue {
  const ctx = useContext(AppDialogContext);
  if (!ctx) {
    throw new Error("useAppDialog must be used within AppDialogProvider");
  }
  return ctx;
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
          <DialogHeader className="border-b border-[var(--color-border)] px-5 py-4 pb-5">
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription className="text-[var(--color-text-primary)]">
              {message}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className={MODAL_DIALOG_FOOTER_CLASS}>
            {kind === "confirm" ? (
              <>
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
              </>
            ) : (
              <Button type="button" onClick={() => finish(true)}>
                {confirmLabel}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppDialogContext.Provider>
  );
}

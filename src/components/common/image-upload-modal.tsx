"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
} from "react";
import Cropper, { type Area } from "react-easy-crop";
import "react-easy-crop/react-easy-crop.css";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MODAL_DIALOG_FOOTER_CLASS } from "@/components/common/modal-footer-classes";
import {
  getCroppedImageFile,
  resolveCropImageSrc,
} from "@/lib/crop-image";
import {
  getUploadErrorMessage,
  uploadImageFile,
  validateImageFile,
} from "@/lib/api/upload";
import { cn } from "@/lib/utils";

export type ImageUploadResult =
  | { type: "url"; url: string }
  | { type: "file"; file: File; previewUrl: string };

export interface ImageUploadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** 편집 시 기존 이미지 URL */
  initialImageUrl?: string;
  /** immediate: 확인 시 즉시 업로드, defer: File만 반환 */
  confirmMode: "immediate" | "defer";
  onComplete: (result: ImageUploadResult) => void;
}

export function ImageUploadModal({
  open,
  onOpenChange,
  initialImageUrl = "",
  confirmMode,
  onComplete,
}: ImageUploadModalProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const ownedBlobUrlRef = useRef<string | null>(null);

  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [loadingSrc, setLoadingSrc] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const revokeOwnedBlob = useCallback(() => {
    if (ownedBlobUrlRef.current?.startsWith("blob:")) {
      URL.revokeObjectURL(ownedBlobUrlRef.current);
    }
    ownedBlobUrlRef.current = null;
  }, []);

  const setOwnedImageSrc = useCallback(
    (url: string | null) => {
      revokeOwnedBlob();
      if (url?.startsWith("blob:")) {
        ownedBlobUrlRef.current = url;
      }
      setImageSrc(url);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setCroppedAreaPixels(null);
    },
    [revokeOwnedBlob],
  );

  const loadSource = useCallback(
    async (source: string | File) => {
      setError(null);
      setLoadingSrc(true);
      try {
        const url = await resolveCropImageSrc(source);
        setOwnedImageSrc(url);
      } catch {
        setError("이미지를 불러올 수 없습니다. 다른 파일을 선택해 주세요.");
      } finally {
        setLoadingSrc(false);
      }
    },
    [setOwnedImageSrc],
  );

  useEffect(() => {
    if (!open) {
      setOwnedImageSrc(null);
      setError(null);
      setConfirming(false);
      setLoadingSrc(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    const trimmed = initialImageUrl.trim();
    if (trimmed) {
      void loadSource(trimmed);
    } else {
      setOwnedImageSrc(null);
      setError(null);
    }
  }, [open, initialImageUrl, loadSource, setOwnedImageSrc]);

  useEffect(() => {
    if (!open) return;

    const onPaste = (event: ClipboardEvent) => {
      const items = event.clipboardData?.items;
      if (!items) return;

      for (const item of items) {
        if (!item.type.startsWith("image/")) continue;
        const file = item.getAsFile();
        if (!file) continue;
        event.preventDefault();
        void loadSource(file);
        break;
      }
    };

    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [open, loadSource]);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const validation = validateImageFile(file);
    if (validation) {
      setError(validation);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    void loadSource(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleConfirm = async () => {
    if (!imageSrc || !croppedAreaPixels) return;

    setConfirming(true);
    setError(null);
    try {
      const file = await getCroppedImageFile(imageSrc, croppedAreaPixels, {
        fileName: "product-image.jpg",
        mimeType: "image/jpeg",
      });

      const validation = validateImageFile(file);
      if (validation) {
        setError(validation);
        return;
      }

      if (confirmMode === "immediate") {
        const uploaded = await uploadImageFile(file);
        onComplete({ type: "url", url: uploaded.url });
      } else {
        const previewUrl = URL.createObjectURL(file);
        onComplete({ type: "file", file, previewUrl });
      }
      onOpenChange(false);
    } catch (err) {
      setError(getUploadErrorMessage(err));
    } finally {
      setConfirming(false);
    }
  };

  const busy = loadingSrc || confirming;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        nested
        className="flex max-h-[min(90vh,640px)] flex-col gap-0 overflow-hidden p-0 sm:max-w-md"
      >
        <DialogHeader className="border-b border-[var(--color-border)] px-5 py-4">
          <DialogTitle>이미지 업로드</DialogTitle>
          <DialogDescription>
            영역을 드래그해 위치를, 슬라이더로 크기를 조정한 뒤 확인하세요.
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={handleFileChange}
          />

          {imageSrc ? (
            <>
              <div className="relative h-64 w-full overflow-hidden rounded-lg bg-black">
                <Cropper
                  image={imageSrc}
                  crop={crop}
                  zoom={zoom}
                  aspect={1}
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onCropComplete={(_, area) => setCroppedAreaPixels(area)}
                />
              </div>
              <div className="space-y-1.5">
                <label
                  htmlFor="image-crop-zoom"
                  className="text-xs text-[var(--color-text-secondary)]"
                >
                  확대/축소
                </label>
                <input
                  id="image-crop-zoom"
                  type="range"
                  min={1}
                  max={3}
                  step={0.05}
                  value={zoom}
                  disabled={busy}
                  onChange={(e) => setZoom(Number(e.target.value))}
                  className="w-full accent-[var(--color-text-primary)]"
                />
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={busy}
                onClick={() => fileInputRef.current?.click()}
              >
                다른 이미지 선택
              </Button>
            </>
          ) : (
            <button
              type="button"
              disabled={busy}
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                "flex min-h-48 w-full flex-col items-center justify-center gap-2 rounded-lg",
                "border border-dashed border-[var(--color-border)] bg-[var(--color-bg)]",
                "text-sm text-[var(--color-text-secondary)] transition-colors",
                "hover:border-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]",
                "disabled:cursor-not-allowed disabled:opacity-60",
              )}
            >
              {loadingSrc ? (
                "이미지 불러오는 중..."
              ) : (
                <>
                  <span>클릭하여 이미지 선택</span>
                  <span className="text-xs text-[var(--color-text-muted)]">
                    또는 Ctrl+V로 붙여넣기
                  </span>
                </>
              )}
            </button>
          )}

          {error ? (
            <p className="text-sm text-[var(--color-danger)]">{error}</p>
          ) : null}
        </div>

        <DialogFooter className={MODAL_DIALOG_FOOTER_CLASS}>
          <Button
            type="button"
            variant="outline"
            disabled={busy}
            onClick={() => onOpenChange(false)}
          >
            취소
          </Button>
          <Button
            type="button"
            disabled={busy || !imageSrc || !croppedAreaPixels}
            onClick={() => void handleConfirm()}
          >
            {confirming
              ? confirmMode === "immediate"
                ? "업로드 중..."
                : "처리 중..."
              : "확인"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

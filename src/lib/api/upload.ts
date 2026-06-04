import { ApiError, apiFetchFormData, type ApiEnvelope } from "@/lib/api-client";

export type UploadedImage = {
  url: string;
  key: string;
  contentType: string;
  size: number;
};

/** 기본 10MB — BE 제한과 다르면 조정 */
export const IMAGE_UPLOAD_MAX_BYTES = 10 * 1024 * 1024;

export function getUploadErrorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return "이미지 업로드에 실패했습니다.";
}

/** 업로드 전 클라이언트 검증 */
export function validateImageFile(
  file: File,
  maxBytes = IMAGE_UPLOAD_MAX_BYTES,
): string | null {
  if (!file.type.startsWith("image/")) {
    return "이미지 파일만 업로드할 수 있습니다.";
  }
  if (file.size <= 0) {
    return "빈 파일은 업로드할 수 없습니다.";
  }
  if (file.size > maxBytes) {
    const mb = Math.round(maxBytes / (1024 * 1024));
    return `이미지 크기는 ${mb}MB 이하여야 합니다.`;
  }
  return null;
}

/**
 * POST /api/v1/upload
 * - multipart `file` → R2 `products/` 경로, 응답 `data.url`을 imageUrl 등에 사용
 */
export async function uploadImageFile(file: File): Promise<UploadedImage> {
  const validation = validateImageFile(file);
  if (validation) {
    throw new ApiError(400, validation);
  }

  const formData = new FormData();
  formData.append("file", file);

  const res = await apiFetchFormData<ApiEnvelope<Partial<UploadedImage>>>(
    "/upload",
    formData,
  );

  const url = res.data?.url?.trim();
  if (!url) {
    throw new ApiError(500, "이미지 URL을 받지 못했습니다.");
  }

  return {
    url,
    key: String(res.data?.key ?? ""),
    contentType: String(res.data?.contentType ?? file.type),
    size: Number(res.data?.size ?? file.size),
  };
}

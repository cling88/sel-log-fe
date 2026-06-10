import type { Area } from "react-easy-crop";

function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", () =>
      reject(new Error("이미지를 불러올 수 없습니다.")),
    );
    image.crossOrigin = "anonymous";
    image.src = url;
  });
}

export async function getCroppedImageFile(
  imageSrc: string,
  pixelCrop: Area,
  options?: {
    fileName?: string;
    mimeType?: "image/jpeg" | "image/png";
    quality?: number;
  },
): Promise<File> {
  const mimeType = options?.mimeType ?? "image/jpeg";
  const fileName = options?.fileName ?? "product-image.jpg";
  const quality = options?.quality ?? 0.92;

  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("이미지를 처리할 수 없습니다.");
  }

  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height,
  );

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (result) => {
        if (!result) {
          reject(new Error("이미지를 처리할 수 없습니다."));
          return;
        }
        resolve(result);
      },
      mimeType,
      mimeType === "image/jpeg" ? quality : undefined,
    );
  });

  return new File([blob], fileName, { type: mimeType });
}

/** 원격 URL을 blob URL로 변환 (크롭용) */
export async function resolveCropImageSrc(
  source: string | File,
): Promise<string> {
  if (source instanceof File) {
    return URL.createObjectURL(source);
  }
  if (source.startsWith("blob:") || source.startsWith("data:")) {
    return source;
  }

  const res = await fetch(source, { mode: "cors" });
  if (!res.ok) {
    throw new Error("이미지를 불러올 수 없습니다.");
  }
  const blob = await res.blob();
  return URL.createObjectURL(blob);
}

"use client";

import { useMutation } from "@tanstack/react-query";
import { useAppDialog } from "@/components/common/app-dialog-provider";
import {
  getUploadErrorMessage,
  uploadImageFile,
  type UploadedImage,
} from "@/lib/api/upload";

export function useUploadImage() {
  const { alert } = useAppDialog();

  return useMutation({
    mutationFn: (file: File) => uploadImageFile(file),
    onError: async (error) => {
      await alert(getUploadErrorMessage(error));
    },
  });
}

export { getUploadErrorMessage, type UploadedImage };

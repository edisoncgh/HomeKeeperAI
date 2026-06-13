"use client";

import { createContext, type ChangeEvent, type ReactNode, useCallback, useContext, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera } from "lucide-react";
import { PHOTO_INTAKE_HREF } from "@/lib/navigation";

interface PendingPhoto {
  file: File;
  id: number;
}

interface CameraIntakeContextValue {
  clearPendingPhoto: (id: number) => void;
  pendingPhoto: PendingPhoto | null;
  queuePhoto: (file: File) => void;
}

const defaultCameraIntakeContext: CameraIntakeContextValue = {
  clearPendingPhoto: () => undefined,
  pendingPhoto: null,
  queuePhoto: () => undefined
};

const CameraIntakeContext = createContext<CameraIntakeContextValue>(defaultCameraIntakeContext);

export function CameraIntakeProvider({ children }: { children: ReactNode }) {
  const [pendingPhoto, setPendingPhoto] = useState<PendingPhoto | null>(null);
  const nextIdRef = useRef(0);

  const queuePhoto = useCallback((file: File) => {
    nextIdRef.current += 1;
    setPendingPhoto({ file, id: nextIdRef.current });
  }, []);

  const clearPendingPhoto = useCallback((id: number) => {
    setPendingPhoto((current) => (current?.id === id ? null : current));
  }, []);

  const value = useMemo(
    () => ({ clearPendingPhoto, pendingPhoto, queuePhoto }),
    [clearPendingPhoto, pendingPhoto, queuePhoto]
  );

  return <CameraIntakeContext.Provider value={value}>{children}</CameraIntakeContext.Provider>;
}

export function useCameraIntake() {
  return useContext(CameraIntakeContext);
}

export function CameraShortcutButton({
  children,
  className,
  iconSize = 16,
  label
}: {
  children?: ReactNode;
  className: string;
  iconSize?: number;
  label: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { queuePhoto } = useCameraIntake();

  function openCamera() {
    inputRef.current?.click();
  }

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) {
      return;
    }

    queuePhoto(file);
    router.push(PHOTO_INTAKE_HREF);
  }

  return (
    <span className="contents">
      <input
        accept="image/*"
        capture="environment"
        className="hidden"
        name="cameraShortcutImage"
        onChange={handleChange}
        ref={inputRef}
        type="file"
      />
      <button
        aria-label={label}
        className={className}
        onClick={openCamera}
        type="button"
      >
        {children ?? (
          <>
            <Camera aria-hidden size={iconSize} />
            {label}
          </>
        )}
      </button>
    </span>
  );
}

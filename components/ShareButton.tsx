"use client";

import { useRef, useState } from "react";

import {
  currentTheme,
  drawCard,
  safeFileName,
  toBlob,
  type ShareSpec,
} from "@/lib/shareCard";

/** 카드 아래에 들어가는 글자. 앱 이름이 정해지면 여기만 바꾸면 된다. */
const WORDMARK = "인연 계산기";

type Status = "idle" | "working" | "shared" | "saved" | "failed";

const LABEL: Record<Status, string> = {
  idle: "이미지로 저장",
  working: "만드는 중…",
  shared: "공유했습니다",
  saved: "저장했습니다",
  failed: "실패했습니다",
};

export default function ShareButton({
  spec,
  fileNameParts,
}: {
  spec: ShareSpec;
  fileNameParts: string[];
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [status, setStatus] = useState<Status>("idle");

  async function run(): Promise<void> {
    setStatus("working");
    try {
      const canvas = canvasRef.current ?? document.createElement("canvas");
      canvasRef.current = canvas;
      drawCard(canvas, spec, currentTheme(), WORDMARK);

      const blob = await toBlob(canvas);
      if (!blob) throw new Error("이미지를 만들지 못했습니다.");

      const name = safeFileName(fileNameParts);
      const file = new File([blob], name, { type: "image/png" });

      // 휴대폰에서는 공유 시트가 바로 뜨는 편이 자연스럽다. 안 되면 내려받는다.
      if (navigator.canShare?.({ files: [file] })) {
        try {
          await navigator.share({ files: [file] });
          setStatus("shared");
          return;
        } catch (error) {
          // 사용자가 공유 시트를 닫은 것뿐이면 실패로 다루지 않는다.
          if (error instanceof DOMException && error.name === "AbortError") {
            setStatus("idle");
            return;
          }
          // 그 밖의 실패는 내려받기로 넘어간다.
        }
      }

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = name;
      link.click();
      URL.revokeObjectURL(url);
      setStatus("saved");
    } catch {
      setStatus("failed");
    }
  }

  return (
    <button
      type="button"
      className="btn-secondary w-full"
      onClick={() => void run()}
      disabled={status === "working"}
      data-testid="share-card"
    >
      {LABEL[status]}
    </button>
  );
}

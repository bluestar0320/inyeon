"use client";

import { useRef, useState } from "react";

import { isNativeApp, shareFileNatively } from "@/lib/nativeShare";
import {
  currentTheme,
  drawCard,
  safeFileName,
  toBlob,
  type ShareSpec,
} from "@/lib/shareCard";

/*
 * 카드 아래에 들어가는 글자.
 *
 * 여기와 내비게이션만 물음표를 붙인 "몇번더?"를 쓴다. 감정이 작동하는 자리이고,
 * 위에서 숫자로 답해 놓고 아래에서 다시 묻는 구조라 카드 한 장이 묻고 답하는
 * 한 덩어리가 된다. 반대로 사람이 타이핑해서 찾아오는 자리(제목, 매니페스트,
 * 스토어 등록명)는 물음표 없이 "몇 번 더"다 — 아무도 ?를 치지 않는다.
 */
const WORDMARK = "몇번더?";

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

      // APK로 감싼 경우. WebView에는 navigator.share도 <a download>도 없어서
      // 그냥 두면 눌러도 아무 일이 없는 것처럼 보인다.
      if (isNativeApp()) {
        await shareFileNatively(blob, name);
        setStatus("shared");
        return;
      }

      const file = new File([blob], name, { type: "image/png" });

      // 휴대폰 브라우저에서는 공유 시트가 바로 뜨는 편이 자연스럽다. 안 되면 내려받는다.
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
      className="w-full rounded-xl border border-hero-line px-4 py-2.5 text-sm font-medium text-ink-600 transition hover:bg-hero-line/60 disabled:opacity-50"
      onClick={() => void run()}
      disabled={status === "working"}
      data-testid="share-card"
    >
      {LABEL[status]}
    </button>
  );
}

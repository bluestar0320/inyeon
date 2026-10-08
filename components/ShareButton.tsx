"use client";

import { useRef, useState } from "react";

import { count } from "@/lib/analytics";
import { SITE_URL } from "@/lib/contact";
import { defineCopy, tr } from "@/lib/i18n";
import { isNativeApp, saveFileNatively, shareFileNatively } from "@/lib/nativeShare";
import {
  currentTheme,
  drawCard,
  loadImage,
  SERIF_STACK,
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
type Status = "idle" | "working" | "shared" | "saved" | "failed";

const COPY = defineCopy({
  ko: { wordmark: "몇번더?", save: "이미지 저장", share: "공유하기", working: "만드는 중…", shared: "공유했어요", saved: "저장했어요", failed: "잘 안 됐어요" },
  en: { wordmark: "How many more?", save: "Save image", share: "Share", working: "Creating…", shared: "Shared", saved: "Saved", failed: "Something went wrong" },
  ja: { wordmark: "あと何回？", save: "画像を保存", share: "共有", working: "作成中…", shared: "共有しました", saved: "保存しました", failed: "うまくいきませんでした" },
  es: { wordmark: "¿Cuántas veces más?", save: "Guardar imagen", share: "Compartir", working: "Creando…", shared: "Compartido", saved: "Guardado", failed: "No se pudo" },
  zh: { wordmark: "还有几次？", save: "保存图片", share: "分享", working: "生成中…", shared: "已分享", saved: "已保存", failed: "未能完成" },
});

/** iOS 사파리는 내려받은 그림을 사진첩이 아니라 파일 앱에 둔다. 사진첩에 넣으려면 공유 시트의 「이미지 저장」을 거쳐야 한다. */
function isIOS(): boolean {
  return /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

function download(blob: Blob, name: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  URL.revokeObjectURL(url);
}

/** 공유 시트를 띄운다. 닫기만 한 것은 false(실패 아님). 시트를 못 띄우는 환경이면 예외. */
async function shareSheet(file: File): Promise<boolean> {
  try {
    await navigator.share({ files: [file] });
    return true;
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") return false;
    throw error;
  }
}

export default function ShareButton({
  spec,
  fileNameParts,
}: {
  spec: ShareSpec;
  fileNameParts: string[];
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const t = tr(COPY);

  async function makeFile(): Promise<File> {
    const canvas = canvasRef.current ?? document.createElement("canvas");
    canvasRef.current = canvas;
    // 명조 글꼴은 글자 조각마다 따로 받는다. 카드에 쓸 글자의 조각을 먼저 받아 두지 않으면 기본 글꼴로 그려진다.
    const text = [spec.title, spec.label, ...(spec.story ?? [])].filter(Boolean).join("");
    try {
      await document.fonts?.load(`40px ${SERIF_STACK}`, text);
    } catch {
      // 글꼴을 못 받아도 카드는 그린다(오프라인 등).
    }
    const image = spec.photo ? await loadImage(spec.photo) : null;
    drawCard(canvas, spec, currentTheme(), t.wordmark, image ?? undefined, SITE_URL);
    const blob = await toBlob(canvas);
    if (!blob) throw new Error("이미지를 만들지 못했습니다.");
    return new File([blob], safeFileName(fileNameParts), { type: "image/png" });
  }

  async function run(action: "save" | "share"): Promise<void> {
    setStatus("working");
    try {
      const file = await makeFile();
      let done: Status = action === "save" ? "saved" : "shared";
      if (isNativeApp()) {
        // APK의 WebView에는 navigator.share도 <a download>도 없다.
        if (action === "save") await saveFileNatively(file, file.name);
        else await shareFileNatively(file, file.name);
      } else if (action === "share" || isIOS()) {
        // 공유 시트가 없으면(PC 등) 내려받기로 대신한다.
        if (navigator.canShare?.({ files: [file] })) {
          if (!(await shareSheet(file))) {
            setStatus("idle");
            return;
          }
        } else {
          download(file, file.name);
          done = "saved";
        }
      } else {
        // 안드로이드 크롬·PC: 다운로드 폴더에 바로 저장된다(갤러리의 Download 앨범에 보인다).
        download(file, file.name);
      }
      setStatus(done);
      count({ event: action === "save" ? "save-card" : "share-card" });
    } catch {
      setStatus("failed");
    }
  }

  const busy = status === "working";
  const button =
    "flex-1 rounded-xl border border-hero-line px-4 py-2.5 text-sm font-medium text-ink-600 transition hover:bg-hero-line/60 disabled:opacity-50";
  return (
    <div className="space-y-1.5">
      <div className="flex gap-2">
        <button type="button" className={button} onClick={() => void run("save")} disabled={busy} data-testid="save-card">
          {t.save}
        </button>
        <button type="button" className={button} onClick={() => void run("share")} disabled={busy} data-testid="share-card">
          {t.share}
        </button>
      </div>
      {status !== "idle" && (
        <p role="status" className="text-center text-[11px] text-ink-400">
          {t[status]}
        </p>
      )}
    </div>
  );
}

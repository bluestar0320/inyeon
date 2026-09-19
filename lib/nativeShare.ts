"use client";

/**
 * APK(Capacitor)로 감쌌을 때의 이미지 공유.
 *
 * 안드로이드 WebView에는 navigator.share도 없고 <a download>도 듣지 않는다.
 * 그냥 두면 버튼을 눌러도 아무 일이 없는 것처럼 보인다 — 실패보다 나쁜 상태다.
 * 그래서 네이티브에서는 파일로 저장한 뒤 시스템 공유 시트를 띄운다.
 *
 * 웹 번들에는 영향을 주지 않는다. Capacitor가 넣어 주는 전역으로 먼저 판별하고,
 * 플러그인은 그때만 동적으로 불러오므로 브라우저에서는 내려받지도 않는다.
 */
declare global {
  interface Window {
    Capacitor?: { isNativePlatform?: () => boolean };
  }
}

export function isNativeApp(): boolean {
  if (typeof window === "undefined") return false;
  return window.Capacitor?.isNativePlatform?.() === true;
}

function toBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error ?? new Error("읽지 못했습니다."));
    reader.onload = () => {
      const result = String(reader.result);
      // data:image/png;base64,XXXX 에서 뒤쪽만 쓴다.
      resolve(result.slice(result.indexOf(",") + 1));
    };
    reader.readAsDataURL(blob);
  });
}

/** 성공하면 true. 사용자가 공유 시트를 닫은 경우도 true로 본다(실패가 아니다). */
export async function shareFileNatively(blob: Blob, fileName: string): Promise<boolean> {
  const { Filesystem, Directory } = await import("@capacitor/filesystem");
  const { Share } = await import("@capacitor/share");

  // 캐시에 두면 시스템이 알아서 정리한다. 사진첩을 건드릴 이유가 없다.
  const written = await Filesystem.writeFile({
    path: fileName,
    data: await toBase64(blob),
    directory: Directory.Cache,
  });

  try {
    await Share.share({ files: [written.uri] });
  } catch (error) {
    // 사용자가 시트를 닫은 것은 실패가 아니다.
    const message = error instanceof Error ? error.message : String(error);
    if (!/cancel|abort|dismiss/i.test(message)) throw error;
  }
  return true;
}

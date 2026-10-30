"use client";

/*
 * 설치한 앱(APK·iOS)에서 기록을 앱 전용 파일에도 한 벌 더 써 둔다.
 *
 * iOS는 저장 공간이 모자라면 WebView의 localStorage·IndexedDB를 지울 수 있다.
 * 앱 데이터 폴더(Directory.Data)의 파일은 앱을 지우기 전까지 남는다.
 * 앱을 켰는데 localStorage가 비어 있으면 이 파일에서 되살린다(store.ts의 boot).
 *
 * 사진까지 통째로 한 파일이다. 저장이 몰리면 마지막 것만 쓴다.
 * ponytail: 저장할 때마다 사진까지 다시 쓴다. 사진이 수십 장이면 느려지니 그때 사진만 따로 뺀다.
 */

const FILE = "records.json";
const isNative = (): boolean => typeof window !== "undefined" && window.Capacitor?.isNativePlatform?.() === true;

let pending: (() => string) | null = null;
let writing = false;

export function mirrorWrite(json: () => string): void {
  if (!isNative()) return;
  pending = json;
  if (writing) return;
  writing = true;
  void (async () => {
    try {
      const { Filesystem, Directory, Encoding } = await import("@capacitor/filesystem");
      while (pending !== null) {
        const data = pending();
        pending = null;
        await Filesystem.writeFile({ path: FILE, data, directory: Directory.Data, encoding: Encoding.UTF8 });
      }
    } catch {
      // 파일을 못 써도 localStorage에는 들어가 있다. 다음 저장 때 다시 쓴다.
      pending = null;
    } finally {
      writing = false;
    }
  })();
}

/** 「지우고 다시 시작」(오류 화면)에서 사본도 지운다. 안 그러면 깨진 기록이 그대로 되살아난다. */
export async function mirrorClear(): Promise<void> {
  if (!isNative()) return;
  try {
    const { Filesystem, Directory } = await import("@capacitor/filesystem");
    await Filesystem.deleteFile({ path: FILE, directory: Directory.Data });
  } catch {
    // 없으면 지울 것도 없다.
  }
}

/** 앱 데이터 폴더의 사본. 웹이거나 아직 없으면 null. */
export async function mirrorRead(): Promise<string | null> {
  if (!isNative()) return null;
  try {
    const { Filesystem, Directory, Encoding } = await import("@capacitor/filesystem");
    const file = await Filesystem.readFile({ path: FILE, directory: Directory.Data, encoding: Encoding.UTF8 });
    return typeof file.data === "string" ? file.data : null;
  } catch {
    return null;
  }
}

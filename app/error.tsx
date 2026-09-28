"use client";

import { defineCopy, tr } from "@/lib/i18n";
import { STORAGE_KEY } from "@/lib/storageKey";

const COPY = defineCopy({
  ko: {
    fileName: "몇번더-기록.json",
    title: "화면을 그리지 못했습니다",
    body: "저장된 기록에 문제가 있을 수 있습니다. 다시 시도해 보고, 그래도 안 되면 기록을 파일로 받아 둔 뒤 지우고 새로 시작하세요. 기록은 이 기기 안에만 있으므로 지우면 되돌릴 수 없습니다.",
    retry: "다시 시도",
    download: "기록 내려받기",
    reset: "기록 지우고 시작",
  },
  en: {
    fileName: "how-many-more-records.json",
    title: "Something went wrong showing this page",
    body: "Your saved records may have a problem. Try again, and if that doesn't help, download your records as a file, then clear them and start fresh. Records live only on this device, so clearing them can't be undone.",
    retry: "Try again",
    download: "Download records",
    reset: "Clear records and start over",
  },
  ja: {
    fileName: "あと何回-記録.json",
    title: "画面を表示できませんでした",
    body: "保存された記録に問題があるかもしれません。もう一度試して、それでもだめなら記録をファイルに保存してから消して、最初からはじめてください。記録はこの端末の中にだけあるので、消すと元に戻せません。",
    retry: "もう一度試す",
    download: "記録をダウンロード",
    reset: "記録を消してはじめる",
  },
  es: {
    fileName: "cuantas-veces-mas-registros.json",
    title: "No se pudo mostrar esta pantalla",
    body: "Puede que haya un problema con tus registros guardados. Vuelve a intentarlo y, si no funciona, descarga tus registros en un archivo, bórralos y empieza de nuevo. Los registros solo están en este dispositivo, así que borrarlos no se puede deshacer.",
    retry: "Reintentar",
    download: "Descargar registros",
    reset: "Borrar registros y empezar",
  },
  zh: {
    fileName: "还有几次-记录.json",
    title: "页面无法显示",
    body: "保存的记录可能出了问题。请再试一次；如果还是不行，先把记录下载成文件，再清除并重新开始。记录只保存在这台设备上，清除后无法恢复。",
    retry: "重试",
    download: "下载记录",
    reset: "清除记录并重新开始",
  },
});

/*
 * 마지막 안전망.
 *
 * 저장된 기록이 어떤 이유로든 깨지면 화면이 하얗게 뜨고, 새로고침해도 같은 데이터를
 * 다시 읽어 또 깨진다. 서버가 없어서 남이 고쳐 줄 수도 없다. 그래서 여기서 두 가지를
 * 준다 — 기록을 파일로 빼내는 길과, 지우고 다시 시작하는 길.
 *
 * 내보내기를 먼저 두는 이유: 깨진 기록이어도 대개는 대부분이 멀쩡하고, 지워 버리면
 * 손으로 되살릴 기회조차 사라진다.
 */
export default function Error({ reset }: { error: Error; reset: () => void }) {
  const t = tr(COPY);

  function save(): void {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY) ?? "{}";
      const url = URL.createObjectURL(new Blob([raw], { type: "application/json" }));
      const link = document.createElement("a");
      link.href = url;
      link.download = t.fileName;
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      // 저장소를 못 읽는 환경이면 여기서 할 수 있는 게 없다. 아래 단추는 남는다.
    }
  }

  return (
    <div className="space-y-5 py-8">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-ink-900">
          {t.title}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-ink-600">
          {t.body}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <button type="button" className="btn-primary" onClick={reset}>
          {t.retry}
        </button>
        <button type="button" className="btn-secondary" onClick={save}>
          {t.download}
        </button>
        <button
          type="button"
          className="btn-danger ml-auto"
          onClick={() => {
            try {
              window.localStorage.removeItem(STORAGE_KEY);
            } catch {
              // 못 지워도 새로고침은 시도한다.
            }
            window.location.href = "./";
          }}
        >
          {t.reset}
        </button>
      </div>
    </div>
  );
}

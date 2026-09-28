"use client";

import { useEffect, useState, type ReactNode } from "react";

import { defineCopy, tr } from "@/lib/i18n";

/*
 * 홈 화면에 제대로 설치하는 단추.
 *
 * 안드로이드 크롬 메뉴에는 비슷하지만 전혀 다른 두 개가 있다.
 *   홈 화면에 추가 → 그냥 북마크. 크롬 로고 뱃지가 붙고 크롬 탭으로 열린다.
 *   앱 설치       → 진짜 설치(WebAPK). 뱃지 없이 앱 서랍에 들어간다.
 * 게다가 "앱 설치"는 서비스 워커가 페이지를 장악한 뒤에야 메뉴에 뜬다. 그래서 첫
 * 방문에 메뉴를 열면 없고, 사람들은 옆에 있는 "홈 화면에 추가"를 누른다.
 *
 * 그 헷갈림을 없앤다. beforeinstallprompt는 브라우저가 "이건 설치해도 된다"고
 * 판단했을 때만 오므로, 이 단추가 보이는 것 자체가 조건이 맞았다는 뜻이다.
 */

const COPY = defineCopy<{ installed: string; manual: ReactNode; install: string; hint: string }>({
  ko: {
    installed: "이미 홈 화면에 설치되어 있습니다. 인터넷이 없어도 그대로 열립니다.",
    manual: (
      <>
        브라우저 메뉴에서 <strong className="font-semibold text-ink-600">앱 설치</strong>를 고르세요. 비슷한 이름의 <em>홈 화면에 추가</em>는
        북마크라 브라우저 로고가 붙고 브라우저 탭으로 열립니다. 아이폰은 공유 → 홈 화면에 추가입니다.
      </>
    ),
    install: "홈 화면에 설치",
    hint: "앱 서랍에 자기 아이콘으로 들어가고, 브라우저 로고가 붙지 않습니다. 설치한 뒤에는 인터넷이 없어도 전부 그대로 동작합니다.",
  },
  en: {
    installed: "Already installed on your home screen. It opens even without internet.",
    manual: (
      <>
        Choose <strong className="font-semibold text-ink-600">Install app</strong> from your browser menu. The similar-sounding{" "}
        <em>Add to Home screen</em> is just a bookmark: it gets a browser badge and opens in a browser
        tab. On iPhone, tap Share → Add to Home Screen.
      </>
    ),
    install: "Install on home screen",
    hint: "It gets its own icon in your app drawer, with no browser badge. Once installed, everything works offline.",
  },
  ja: {
    installed: "すでにホーム画面にインストールされています。インターネットがなくても開けます。",
    manual: (
      <>
        ブラウザのメニューから <strong className="font-semibold text-ink-600">アプリをインストール</strong>を選んでください。似た名前の
        <em>ホーム画面に追加</em>はブックマークなので、ブラウザのロゴが付きブラウザのタブで開きます。iPhoneは共有 →
        ホーム画面に追加です。
      </>
    ),
    install: "ホーム画面にインストール",
    hint: "アプリ一覧に専用のアイコンで入り、ブラウザのロゴは付きません。インストール後はインターネットがなくてもすべて使えます。",
  },
  es: {
    installed: "Ya está instalada en tu pantalla de inicio. Se abre incluso sin internet.",
    manual: (
      <>
        En el menú del navegador, elige <strong className="font-semibold text-ink-600">Instalar aplicación</strong>. La opción parecida{" "}
        <em>Añadir a pantalla de inicio</em> es solo un marcador: lleva el logo del navegador y se abre en una
        pestaña. En iPhone: Compartir → Añadir a pantalla de inicio.
      </>
    ),
    install: "Instalar en la pantalla de inicio",
    hint: "Tendrá su propio icono en el cajón de apps, sin logo del navegador. Una vez instalada, todo funciona sin internet.",
  },
  zh: {
    installed: "已安装到主屏幕。没有网络也能打开。",
    manual: (
      <>
        请在浏览器菜单中选择<strong className="font-semibold text-ink-600">安装应用</strong>。名字相近的<em>添加到主屏幕</em>
        只是书签，会带有浏览器标志并在浏览器标签页中打开。iPhone请点分享 → 添加到主屏幕。
      </>
    ),
    install: "安装到主屏幕",
    hint: "会以自己的图标出现在应用列表中，不带浏览器标志。安装后没有网络也能全部正常使用。",
  },
});

/** 표준에 아직 안 들어간 이벤트라 타입을 직접 적는다. */
interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function InstallButton() {
  const [prompt, setPrompt] = useState<InstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const t = tr(COPY);

  useEffect(() => {
    // 이미 설치된 상태로 열렸으면 권할 이유가 없다.
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setInstalled(true);
      return;
    }

    function onPrompt(event: Event): void {
      // 막아 두지 않으면 브라우저가 제 방식대로 띄우고 이 단추는 못 쓴다.
      event.preventDefault();
      setPrompt(event as InstallPromptEvent);
    }
    function onInstalled(): void {
      setInstalled(true);
      setPrompt(null);
    }

    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (installed) {
    return (
      <p className="text-xs leading-relaxed text-ink-400">{t.installed}</p>
    );
  }

  if (!prompt) {
    /*
     * 브라우저가 설치 가능하다고 말해 주지 않은 상태. 아이폰 사파리처럼 이 이벤트가
     * 아예 없는 곳도 있으므로, 단추 대신 직접 하는 길을 적어 둔다.
     */
    return (
      <p className="text-xs leading-relaxed text-ink-400">{t.manual}</p>
    );
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        className="btn-primary"
        onClick={() => {
          void (async () => {
            await prompt.prompt();
            await prompt.userChoice;
            // 한 번 쓴 이벤트는 다시 못 쓴다. 성공하면 appinstalled가 정리해 준다.
            setPrompt(null);
          })();
        }}
      >
        {t.install}
      </button>
      <p className="text-xs leading-relaxed text-ink-400">{t.hint}</p>
    </div>
  );
}

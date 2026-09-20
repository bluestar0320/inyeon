"use client";

import { useEffect, useState } from "react";

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

/** 표준에 아직 안 들어간 이벤트라 타입을 직접 적는다. */
interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function InstallButton() {
  const [prompt, setPrompt] = useState<InstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);

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
      <p className="text-xs leading-relaxed text-ink-400">
        이미 홈 화면에 설치되어 있습니다. 인터넷이 없어도 그대로 열립니다.
      </p>
    );
  }

  if (!prompt) {
    /*
     * 브라우저가 설치 가능하다고 말해 주지 않은 상태. 아이폰 사파리처럼 이 이벤트가
     * 아예 없는 곳도 있으므로, 단추 대신 직접 하는 길을 적어 둔다.
     */
    return (
      <p className="text-xs leading-relaxed text-ink-400">
        브라우저 메뉴에서 <strong className="font-semibold text-ink-600">앱 설치</strong>를
        고르세요. 비슷한 이름의 <em>홈 화면에 추가</em>는 북마크라 브라우저 로고가 붙고
        브라우저 탭으로 열립니다. 아이폰은 공유 → 홈 화면에 추가입니다.
      </p>
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
        홈 화면에 설치
      </button>
      <p className="text-xs leading-relaxed text-ink-400">
        앱 서랍에 자기 아이콘으로 들어가고, 브라우저 로고가 붙지 않습니다. 설치한 뒤에는
        인터넷이 없어도 전부 그대로 동작합니다.
      </p>
    </div>
  );
}

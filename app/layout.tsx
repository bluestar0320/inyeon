import type { Metadata, Viewport } from "next";

import "./globals.css";
import Nav from "@/components/Nav";
import ServiceWorker from "@/components/ServiceWorker";
import ThemeApplier from "@/components/ThemeApplier";
import UndoBar from "@/components/UndoBar";
import { STORAGE_KEY } from "@/lib/storageKey";

export const metadata: Metadata = {
  title: "몇 번 더",
  description:
    "남은 시간과 남은 만남을 횟수로 계산합니다. 리마인딩이 아니라 플래닝을 위한 계산기.",
  // iOS는 manifest의 display를 무시하므로 따로 알려 줘야 전체 화면으로 열린다.
  appleWebApp: { capable: true, title: "몇번더", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // 주소창·상태바 색을 테마에 맞춘다. 안 맞추면 설치한 앱에서 위쪽만 흰 띠로 남는다.
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fbfaf8" },
    { media: "(prefers-color-scheme: dark)", color: "#121317" },
  ],
};

/**
 * 화면이 그려지기 전에 테마를 정한다. React가 붙기를 기다리면 밝은 화면이 한 번
 * 번쩍인 뒤에 어두워진다. 저장소를 못 읽는 환경에서도 앱은 떠야 하므로 통째로 감쌌다.
 */
const THEME_SCRIPT = `
(function () {
  try {
    var raw = localStorage.getItem(${JSON.stringify(STORAGE_KEY)});
    var theme = raw ? (JSON.parse(raw).settings || {}).theme : "system";
    var dark = theme === "dark" ||
      ((theme === "system" || !theme) &&
        window.matchMedia("(prefers-color-scheme: dark)").matches);
    if (dark) document.documentElement.classList.add("dark");
  } catch (e) {}
})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
        <ThemeApplier />
        <ServiceWorker />
        {/* 키보드 사용자가 내비게이션 네 개를 매번 지나치지 않도록. 평소엔 숨어 있다. */}
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-30 focus:rounded-lg focus:bg-ink-800 focus:px-4 focus:py-2 focus:text-sm focus:text-onInk"
        >
          본문으로 건너뛰기
        </a>
        <Nav />
        <main id="main" className="mx-auto max-w-3xl px-4 pb-24 pt-6">
          {children}
        </main>
        <UndoBar />
      </body>
    </html>
  );
}

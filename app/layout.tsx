import type { Metadata, Viewport } from "next";

import "./globals.css";
import LangRoot from "@/components/LangRoot";
import Footer from "@/components/Footer";
import Nav from "@/components/Nav";
import ServiceWorker from "@/components/ServiceWorker";
import ThemeApplier from "@/components/ThemeApplier";
import SaveWarning from "@/components/SaveWarning";
import SkipLink from "@/components/SkipLink";
import UndoBar from "@/components/UndoBar";
import { STORAGE_KEY } from "@/lib/storageKey";
import { THEME_COLOR } from "@/lib/themeColor";

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
  /*
   * 화면 구석까지 쓴다. 이게 있어야 env(safe-area-inset-*)가 실제 값을 낸다.
   * APK에서 웹뷰를 상태바 밑까지 넓히기 때문에(lib/nativeStatusBar.ts), 그 영역을
   * 페이지가 직접 칠하고 내용은 안전 영역 안으로 밀어야 한다.
   * 인셋이 없는 기기에서는 전부 0이라 아무것도 달라지지 않는다.
   */
  viewportFit: "cover",
  /*
   * 상태바 색.
   *
   * 예전에는 prefers-color-scheme으로 두 개를 깔았다. 그런데 그건 **기기 설정**이라,
   * 앱 안에서 어둡게를 골라도 폰이 밝은 쪽이면 상태바만 흰 띠로 남았다.
   * 이 앱은 자기 테마 설정을 따로 가지고 있으므로, 태그 하나만 두고 실제로 칠해진
   * 테마에 맞춰 자바스크립트가 고친다(lib/themeColor.ts).
   */
  themeColor: THEME_COLOR.light,
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
    // 화면이 그려지기 전에 상태바 색까지 맞춘다. 나중에 고치면 흰 띠가 한 번 번쩍인다.
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", dark ? ${JSON.stringify(THEME_COLOR.dark)} : ${JSON.stringify(THEME_COLOR.light)});
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
        <LangRoot>
          <SkipLink />
          <Nav />
          <SaveWarning />
          {/* 아래쪽 시스템 바(제스처 막대)에 마지막 단추가 가리지 않도록 더 준다. */}
          <main
            id="main"
            className="mx-auto max-w-3xl px-4 pt-6"
          >
            {children}
          </main>
          <Footer />
          <UndoBar />
        </LangRoot>
      </body>
    </html>
  );
}

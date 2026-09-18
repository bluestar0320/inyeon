import type { Metadata, Viewport } from "next";

import "./globals.css";
import Nav from "@/components/Nav";
import ThemeApplier from "@/components/ThemeApplier";
import UndoBar from "@/components/UndoBar";
import { STORAGE_KEY } from "@/lib/storageKey";

export const metadata: Metadata = {
  title: "인연 계산기",
  description:
    "남은 시간과 남은 만남을 횟수로 계산합니다. 리마인딩이 아니라 플래닝을 위한 계산기.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
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
        <Nav />
        <main className="mx-auto max-w-3xl px-4 pb-24 pt-6">{children}</main>
        <UndoBar />
      </body>
    </html>
  );
}

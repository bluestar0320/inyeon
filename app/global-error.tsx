"use client";

import "./globals.css";

import ErrorScreen from "./error";

/** 레이아웃(머리줄·알림·테마)에서 오류가 나면 error.tsx가 못 받는다. 같은 화면을 html째로 그린다. */
export default function GlobalError(props: { error: Error; reset: () => void }) {
  return (
    <html lang="ko">
      <body>
        <main className="mx-auto max-w-3xl px-4 pt-10">
          <ErrorScreen {...props} />
        </main>
      </body>
    </html>
  );
}

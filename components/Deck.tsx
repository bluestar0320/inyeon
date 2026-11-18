"use client";

import Link from "next/link";
import { useLayoutEffect, useRef, useState } from "react";

import CardRow, {
  type CardRowHandle,
  type DeckCard,
} from "@/components/CardRow";
import { readPos, writePos, type DeckPos, type RowKey } from "@/lib/deck";
import { ROW_NAMES, setDeckRow } from "@/lib/deckRow";
import { defineCopy, tr } from "@/lib/i18n";

const COPY = defineCopy({
  ko: {
    box: "카드",
    settings: "설정",
    overview: (i: number, n: number) => `모아 보기, ${n}장 중 ${i}번째`,
  },
  en: {
    box: "Cards",
    settings: "Settings",
    overview: (i, n) => `See all, ${i} of ${n}`,
  },
  ja: {
    box: "カード",
    settings: "設定",
    overview: (i, n) => `一覧、${n}枚中${i}枚目`,
  },
  es: {
    box: "Tarjetas",
    settings: "Ajustes",
    overview: (i, n) => `Ver todo, ${i} de ${n}`,
  },
  zh: {
    box: "卡片",
    settings: "设置",
    overview: (i, n) => `查看全部，第${i}张，共${n}张`,
  },
});

/*
 * 첫 화면. 위 칸은 인연, 아래 칸은 순간. 둘 다 옆으로 넘기는 카드 줄(CardRow)이다.
 *
 * 칸 바꾸기도 브라우저 스크롤이 한다(세로 scroll-snap). 칸마다 화면 한 장이고 카드는 가운데에 둔다.
 * 다른 칸은 「순간 ↓」·「↑ 인연」 단추가 알려 준다. (예전엔 순간 칸 윗부분을 비치게 했는데,
 * 긴 폰에서 아래가 텅 비고 두 단추가 한꺼번에 보여 걷어냈다.)
 * 상자 하나가 키보드를 받는다: ←/→ 지금 칸 넘기기, ↑/↓ 칸 바꾸기, Enter 지금 장 열기.
 */
export default function Deck({
  peopleCards,
  momentCards,
  startPeople,
  emptyMoments,
}: {
  peopleCards: DeckCard[];
  momentCards: DeckCard[];
  startPeople: number;
  emptyMoments: string | null;
}) {
  const t = tr(COPY);
  const names = tr(ROW_NAMES);
  const box = useRef<HTMLDivElement>(null);
  const sections = {
    people: useRef<HTMLDivElement>(null),
    moments: useRef<HTMLDivElement>(null),
  };
  const rows = {
    people: useRef<CardRowHandle>(null),
    moments: useRef<CardRowHandle>(null),
  };
  // 남긴 위치(상세에 갔다 온 길)가 있으면 그 칸·그 장. 없으면 인연 칸의 시작 장.
  const [start] = useState<DeckPos>(
    () =>
      readPos({ people: peopleCards.length, moments: momentCards.length }) ?? {
        row: "people",
        people: startPeople,
        moments: 0,
      },
  );
  const pos = useRef(start);

  const save = (next: Partial<DeckPos>) => {
    pos.current = { ...pos.current, ...next };
    writePos(pos.current);
    setDeckRow(pos.current.row);
  };

  // 그리기 전에 남긴 칸으로 옮긴다. 효과 없이 바로.
  useLayoutEffect(() => {
    const el = box.current;
    if (el && start.row === "moments")
      el.scrollTop = sections.moments.current?.offsetTop ?? 0;
    setDeckRow(start.row);
    // 상세에서 돌아왔으면 그 카드 사진이 내려앉는다(칸을 맞춘 뒤라야 자리가 맞다).
    rows[start.row].current?.play();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toRow = (row: RowKey) => {
    const el = box.current;
    const target = sections[row].current;
    if (!el || !target) return;
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // scrollIntoView는 바깥 페이지까지 움직일 수 있어 상자만 스크롤한다.
    el.scrollTo({ top: target.offsetTop, behavior: still ? "auto" : "smooth" });
  };

  return (
    <>
      <div
        ref={box}
        tabIndex={0}
        role="group"
        aria-label={t.box}
        // 높이는 머리글 아래 남은 만큼(app/globals.css의 [data-deck]).
        className="relative h-full snap-y snap-mandatory overflow-y-auto overscroll-contain pb-[env(safe-area-inset-bottom)] [scrollbar-width:none] focus-visible:outline-offset-[-2px] [&::-webkit-scrollbar]:hidden"
        onScroll={(e) => {
          const el = e.currentTarget;
          // 상자 가운데가 순간 칸에 들어가면 순간 칸.
          const row: RowKey =
            el.scrollTop + el.clientHeight / 2 >=
            (sections.moments.current?.offsetTop ?? Infinity)
              ? "moments"
              : "people";
          if (row !== pos.current.row) save({ row });
        }}
        onKeyDown={(e) => {
          const own = e.target === e.currentTarget;
          const row = rows[pos.current.row].current;
          if (e.key === "ArrowDown" || e.key === "ArrowUp")
            toRow(e.key === "ArrowDown" ? "moments" : "people");
          // 상자 안 단추·링크에 초점이 있으면 ←/→/Enter는 그 단추가 쓴다.
          else if (own && (e.key === "ArrowLeft" || e.key === "ArrowRight"))
            row?.go(e.key === "ArrowLeft" ? -1 : 1);
          else if (own && e.key === "Enter") row?.open();
          else return;
          e.preventDefault();
        }}
      >
        <div
          ref={sections.people}
          className="flex min-h-full snap-start flex-col justify-center"
        >
          <CardRow
            ref={rows.people}
            label={names.people}
            cards={peopleCards}
            index={start.people}
            onIndex={(people) => save({ people })}
            listHref="/people"
            overviewLabel={t.overview}
          />
          <button
            type="button"
            onClick={() => toRow("moments")}
            className="btn-quiet mx-auto mt-3 min-h-11 min-w-11 text-base text-ink-800 [@media(max-height:500px)]:mt-0"
          >
            <span className="deck-nudge inline-block">{names.moments} ↓</span>
          </button>
        </div>
        <div
          ref={sections.moments}
          className="relative flex min-h-full snap-start flex-col justify-center"
        >
          {/* 「↑ 인연」은 칸 맨 위에 띄워 둔다. 카드 위에 쌓으면 카드가 그만큼 아래로 밀려 위쪽이 비어 보인다. 낮은 화면은 자리가 없어 그대로 쌓는다. */}
          <button
            type="button"
            onClick={() => toRow("people")}
            className="btn-quiet absolute inset-x-0 top-2 mx-auto w-fit min-h-11 min-w-11 text-base text-ink-800 [@media(max-height:500px)]:static"
          >
            ↑ {names.people}
          </button>
          <CardRow
            ref={rows.moments}
            label={names.moments}
            cards={momentCards}
            index={start.moments}
            onIndex={(moments) => save({ moments })}
            listHref="/moments"
            overviewLabel={t.overview}
          />
          {emptyMoments && (
            <p className="mx-auto max-w-sm break-keep px-4 text-center text-xs leading-relaxed text-ink-600">
              {emptyMoments}
            </p>
          )}
        </div>
      </div>
      {/* 설정(내보내기 포함)으로 가는 길. 「나」 카드로도 가지만, 그걸 모르는 사람도 찾게 늘 보이는 단추를 둔다. */}
      <Link
        href="/settings"
        className="fixed bottom-[calc(1rem+env(safe-area-inset-bottom))] right-4 z-20 flex min-h-11 items-center gap-1.5 rounded-full border border-ink-200 bg-page/90 px-4 text-sm font-medium text-ink-800 shadow-sm backdrop-blur"
      >
        <span aria-hidden="true">⚙</span>
        {t.settings}
      </Link>
    </>
  );
}

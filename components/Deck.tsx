"use client";

import { useLayoutEffect, useRef, useState } from "react";

import CardRow, { type CardRowHandle, type DeckCard } from "@/components/CardRow";
import { readPos, writePos, type DeckPos, type RowKey } from "@/lib/deck";
import { setDeckRow } from "@/lib/deckRow";
import { defineCopy, tr } from "@/lib/i18n";

const COPY = defineCopy({
  ko: {
    box: "카드",
    people: "인연",
    moments: "순간",
    toMoments: "순간 ↓",
    toPeople: "↑ 인연",
    overview: (i: number, n: number) => `모아 보기, ${n}장 중 ${i}번째`,
  },
  en: {
    box: "Cards",
    people: "People",
    moments: "Moments",
    toMoments: "Moments ↓",
    toPeople: "↑ People",
    overview: (i, n) => `See all, ${i} of ${n}`,
  },
  ja: {
    box: "カード",
    people: "大切な人",
    moments: "ひととき",
    toMoments: "ひととき ↓",
    toPeople: "↑ 大切な人",
    overview: (i, n) => `一覧、${n}枚中${i}枚目`,
  },
  es: {
    box: "Tarjetas",
    people: "Personas",
    moments: "Momentos",
    toMoments: "Momentos ↓",
    toPeople: "↑ Personas",
    overview: (i, n) => `Ver todo, ${i} de ${n}`,
  },
  zh: {
    box: "卡片",
    people: "亲友",
    moments: "时光",
    toMoments: "时光 ↓",
    toPeople: "↑ 亲友",
    overview: (i, n) => `查看全部，第${i}张，共${n}张`,
  },
});

/*
 * 첫 화면. 위 칸은 인연, 아래 칸은 순간. 둘 다 옆으로 넘기는 카드 줄(CardRow)이다.
 *
 * 칸 바꾸기도 브라우저 스크롤이 한다(세로 scroll-snap). 칸 높이를 상자의 88%로 두어
 * 인연 칸 아래로 순간 칸 윗부분이 비친다. 밀면 내려간다는 걸 따로 말하지 않아도 안다.
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
  const box = useRef<HTMLDivElement>(null);
  const sections = { people: useRef<HTMLDivElement>(null), moments: useRef<HTMLDivElement>(null) };
  const rows = { people: useRef<CardRowHandle>(null), moments: useRef<CardRowHandle>(null) };
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
    if (el && start.row === "moments") el.scrollTop = sections.moments.current?.offsetTop ?? 0;
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
    <div
      ref={box}
      tabIndex={0}
      role="group"
      aria-label={t.box}
      // 높이 = 화면 − 머리글(py-3 + text-sm 한 줄 + 아랫줄 1px + 상태바).
      className="relative h-[calc(100svh-2.75rem-1px-env(safe-area-inset-top))] snap-y snap-mandatory overflow-y-auto overscroll-contain pb-[env(safe-area-inset-bottom)] [scrollbar-width:none] focus-visible:outline-offset-[-2px] [&::-webkit-scrollbar]:hidden"
      onScroll={(e) => {
        const el = e.currentTarget;
        // 끝까지 내려가도 순간 칸 윗줄에 못 닿을 수 있다(칸이 88%라). 반을 넘으면 순간 칸.
        const row: RowKey = el.scrollTop > (el.scrollHeight - el.clientHeight) / 2 ? "moments" : "people";
        if (row !== pos.current.row) save({ row });
      }}
      onKeyDown={(e) => {
        const own = e.target === e.currentTarget;
        const row = rows[pos.current.row].current;
        if (e.key === "ArrowDown" || e.key === "ArrowUp") toRow(e.key === "ArrowDown" ? "moments" : "people");
        // 상자 안 단추·링크에 초점이 있으면 ←/→/Enter는 그 단추가 쓴다.
        else if (own && (e.key === "ArrowLeft" || e.key === "ArrowRight")) row?.go(e.key === "ArrowLeft" ? -1 : 1);
        else if (own && e.key === "Enter") row?.open();
        else return;
        e.preventDefault();
      }}
    >
      <div ref={sections.people} className="flex min-h-[88%] snap-start flex-col pt-2">
        <CardRow
          ref={rows.people}
          label={t.people}
          cards={peopleCards}
          index={start.people}
          onIndex={(people) => save({ people })}
          listHref="/people"
          overviewLabel={t.overview}
        />
        <button type="button" onClick={() => toRow("moments")} className="btn-quiet mx-auto mt-auto min-h-11 min-w-11">
          <span className="deck-nudge inline-block">{t.toMoments}</span>
        </button>
      </div>
      <div ref={sections.moments} className="flex min-h-[88%] snap-start flex-col">
        <button type="button" onClick={() => toRow("people")} className="btn-quiet mx-auto min-h-11 min-w-11">
          {t.toPeople}
        </button>
        <CardRow
          ref={rows.moments}
          label={t.moments}
          cards={momentCards}
          index={start.moments}
          onIndex={(moments) => save({ moments })}
          listHref="/moments"
          overviewLabel={t.overview}
        />
        {emptyMoments && (
          <p className="mx-auto max-w-sm break-keep px-4 text-center text-xs leading-relaxed text-ink-600">{emptyMoments}</p>
        )}
      </div>
    </div>
  );
}

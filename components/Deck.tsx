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
 * 「나에게 남은 시간」 한 줄. 인연 칸에서는 화면 맨 아래, 순간 칸에서는 맨 위에 둔다.
 * 카드 한 장만 있으면 긴 폰에서 위아래가 비는데, 예전 첫 화면처럼 이 줄이 그 자리를 채운다.
 * 설정 단추도 여기 오른쪽에 붙인다(떠 있는 단추가 이 줄을 가리지 않게).
 * 눕힌 폰은 높이가 모자라 숫자는 빼고, 설정 단추만 칸 모서리에 띄운다(숫자는 「나」 카드에 있다).
 */
function MeStrip({
  me,
  settings,
  edge,
}: {
  me: Extract<DeckCard, { kind: "me" }>;
  settings: string;
  edge: "top" | "bottom";
}) {
  return (
    <div
      className={`hero mx-4 flex items-center gap-3 !px-5 !py-4 [@media(max-height:500px)]:absolute [@media(max-height:500px)]:right-4 [@media(max-height:500px)]:m-0 [@media(max-height:500px)]:!bg-transparent [@media(max-height:500px)]:!p-0 ${edge === "bottom" ? "mb-3 [@media(max-height:500px)]:bottom-2" : "mt-3 [@media(max-height:500px)]:top-2"}`}
    >
      <div className="min-w-0 flex-1 [@media(max-height:500px)]:hidden">
        <p className="text-sm text-ink-600">{me.label}</p>
        <p className="numeral mt-1 text-4xl leading-none text-ink-900 [@media(max-height:500px)]:text-2xl">
          {me.value}
        </p>
        {me.sub && (
          <p className="mt-1.5 truncate text-sm text-ink-600">{me.sub}</p>
        )}
      </div>
      <Link
        href="/settings"
        className="flex min-h-11 shrink-0 items-center gap-1.5 self-end rounded-full border border-ink-200 [@media(max-height:500px)]:bg-page/90 px-4 text-sm font-medium text-ink-800"
      >
        <span aria-hidden="true">⚙</span>
        {settings}
      </Link>
    </div>
  );
}

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
  const me = peopleCards.find(
    (c): c is Extract<DeckCard, { kind: "me" }> => c.kind === "me",
  );

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
          className="relative flex min-h-full snap-start flex-col"
        >
          <div className="flex flex-1 flex-col justify-center">
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
          {me && <MeStrip me={me} settings={t.settings} edge="bottom" />}
        </div>
        <div
          ref={sections.moments}
          className="relative flex min-h-full snap-start flex-col"
        >
          {me && <MeStrip me={me} settings={t.settings} edge="top" />}
          <div className="flex flex-1 flex-col justify-center">
            <button
              type="button"
              onClick={() => toRow("people")}
              className="btn-quiet mx-auto mb-3 min-h-11 min-w-11 text-base text-ink-800 [@media(max-height:500px)]:mb-0"
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
      </div>
    </>
  );
}

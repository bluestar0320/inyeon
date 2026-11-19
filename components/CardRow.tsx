"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { forwardRef, useEffect, useImperativeHandle, useLayoutEffect, useRef, useState } from "react";

import Polaroid from "@/components/Polaroid";
import { playFrom, remember } from "@/lib/flip";
import { defineCopy, tr } from "@/lib/i18n";

export type DeckCard =
  | {
      kind: "photo";
      id: string;
      href: string;
      /** 그림 주소(imageFor). */
      photo: string;
      title: string;
      sentence: string;
      count: string;
      unit: string;
      /** 숫자 아래 작은 한 줄. "마지막 만남 23일 전" 같은 것. */
      note?: string | null;
      /** 사진 모서리 리본. "생일 6일 전" 같은 것. */
      ribbon?: string | null;
      /** 펼치기 효과에서 이 카드를 가리키는 이름. person:id / moment:id. */
      flipKey?: string;
    }
  // 「나」·「＋」 장의 id는 저장된 id와 겹치지 않게 __로 시작한다.
  | {
      kind: "me";
      id: "__me";
      href: "/settings";
      label: string;
      value: string;
      /** 「35세 · 예상 수명 85세」 */
      sub?: string | null;
      /** 지나온 몫(0…1). */
      progress?: number | null;
      /** 남은 여름·주말·보름달. */
      stats?: { label: string; value: string }[];
      nudge?: string | null;
    }
  | { kind: "add"; id: string; href: string; label: string };

export type CardRowHandle = { go(step: number): void; open(): void; play(): void };

/** 효과에서 쓰는 이름. 「＋」 장은 없다. */
const flipKeyOf = (card: DeckCard) => (card.kind === "me" ? "me" : card.kind === "photo" ? card.flipKey : undefined);

/** 효과가 붙는 요소: 사진 카드는 사진, 「나」는 카드 자체. */
const flipElOf = (card: DeckCard, link: HTMLElement | null) =>
  card.kind === "photo" ? link?.querySelector("img") ?? null : card.kind === "me" ? link : null;

type Props = {
  label: string;
  cards: DeckCard[];
  /** 처음 열 장(진짜 장 기준 0…n-1). 이후 번호는 onIndex로 알린다. */
  index: number;
  onIndex(i: number): void;
  /** 점 줄(모아 보기)을 누르면 가는 곳. */
  listHref: string;
  overviewLabel: (i: number, n: number) => string;
};

const COPY = defineCopy({
  ko: { prev: "이전", next: "다음", me: "나", at: (i: number, n: number) => `${n}장 중 ${i}번째` },
  en: { prev: "Previous", next: "Next", me: "Me", at: (i, n) => `${i} of ${n}` },
  ja: { prev: "前へ", next: "次へ", me: "わたし", at: (i, n) => `${n}枚中${i}枚目` },
  es: { prev: "Anterior", next: "Siguiente", me: "Yo", at: (i, n) => `${i} de ${n}` },
  zh: { prev: "上一张", next: "下一张", me: "我", at: (i, n) => `第${i}张，共${n}张` },
});

/** 서버에서 미리 그릴 때는 useLayoutEffect가 경고만 낸다. 브라우저에서만 쓴다. */
const useLayoutEffectOnClient = typeof window === "undefined" ? useEffect : useLayoutEffect;

/** 장마다 다른 기울기. 맨 앞 장은 거의 바로 선다. */
const TILTS = [-1, 2, -2, 1.5, -1.5];

/** 점은 이 수까지. 넘으면 「3 / 24」로 적는다(344px 폭에도 들어가게). */
const MAX_DOTS = 12;

/** 한 장의 폭. 스크롤 위치를 장 번호로 바꿀 때 쓴다(카드는 트랙보다 좁다). */
function cardWidth(el: HTMLElement): number {
  return (el.firstElementChild as HTMLElement | null)?.offsetWidth || el.clientWidth;
}

function Face({ card, tilt, me }: { card: DeckCard; tilt: number; me: string }) {
  // 「나」도 폴라로이드 한 장이다. 사진 자리에 숫자를 적고, 아래 여백에 이름과 한마디를 쓴다.
  if (card.kind === "me")
    return (
      <span className="polaroid" style={tilt ? { transform: `rotate(${tilt}deg)` } : undefined}>
        {/* 화면 낭독기는 「나」부터 읽는다. 눈에는 아래 여백에 적힌 것이 보인다. */}
        <span className="sr-only">{me} </span>
        <span className="polaroid-photo flex aspect-square flex-col justify-center bg-ink-900/[.06] px-4 [@media(max-height:500px)]:aspect-[4/3]">
          <span className="block text-sm text-ink-600">{card.label}</span>
          <span className="numeral mt-2 block text-5xl leading-none text-ink-900 [@media(max-height:500px)]:mt-1 [@media(max-height:500px)]:text-3xl">{card.value}</span>
          {card.sub && <span className="mt-2 block text-xs text-ink-600">{card.sub}</span>}
          {/* 눕힌 폰처럼 낮은 화면에서는 막대와 숫자 셋을 뺀다. 「나」 화면에 다 있다. */}
          {card.progress != null && (
            <span className="mt-4 block h-1.5 overflow-hidden rounded-full bg-ink-900/10 [@media(max-height:500px)]:hidden">
              <span className="block h-full rounded-full bg-ink-800" style={{ width: `${card.progress * 100}%` }} />
            </span>
          )}
          {card.stats && (
            <span className="mt-4 grid grid-cols-3 gap-2 border-t border-ink-900/10 pt-3 [@media(max-height:500px)]:hidden">
              {card.stats.map((s) => (
                <span key={s.label} className="block min-w-0">
                  <span className="block truncate text-[11px] text-ink-600">{s.label}</span>
                  <span className="numeral mt-0.5 block truncate text-base text-ink-800">{s.value}</span>
                </span>
              ))}
            </span>
          )}
        </span>
        {/* 낮은 화면에서는 아래 여백의 이름과 한마디를 뺀다. 다른 장보다 키가 커져 줄이 넘친다. */}
        <span className="mt-2 block px-1 [@media(max-height:500px)]:hidden">
          <span aria-hidden="true" className="font-album block truncate text-sm text-ink-800">{me}</span>
          {card.nudge && <span className="font-album mt-0.5 block break-keep text-xs leading-relaxed text-ink-600 [@media(max-height:500px)]:truncate">{card.nudge}</span>}
        </span>
      </span>
    );
  if (card.kind === "add")
    return (
      <span className="block border-2 border-dashed border-ink-200 p-2 pb-3">
        <span className="flex aspect-square items-center justify-center text-sm text-ink-600">＋ {card.label}</span>
      </span>
    );
  return (
    <span className="relative block">
      <Polaroid src={card.photo} size="md" tilt={tilt}>
        <span className="mt-2 block px-1">
          <span className="font-album block truncate text-sm text-ink-800">{card.title}</span>
          <span className="font-album mt-0.5 block break-keep text-xs leading-relaxed text-ink-600 [@media(max-height:500px)]:truncate">{card.sentence}</span>
          {/* 횟수는 바로 위 문장이 이미 말한다. 화면 낭독기가 두 번 읽지 않게 숨긴다. */}
          <span aria-hidden="true" className="numeral mt-1 block text-4xl leading-none text-ink-900 [@media(max-height:500px)]:text-3xl">
            {card.count}
            <span className="ml-1 text-sm font-normal text-ink-600">{card.unit}</span>
          </span>
          {card.note && <span className="mt-1 block text-xs text-ink-600 [@media(max-height:500px)]:truncate">{card.note}</span>}
        </span>
      </Polaroid>
      {card.ribbon && (
        <span className="absolute right-0 top-4 rounded-l-sm bg-ink-800 px-2 py-0.5 text-[11px] text-onInk">{card.ribbon}</span>
      )}
    </span>
  );
}

/*
 * 카드 한 줄. 한 장씩 크게 보고 옆으로 넘긴다.
 *
 * 넘기기는 브라우저의 가로 스크롤 + scroll-snap이 한다. 손가락으로 밀면 그대로 되고,
 * 라이브러리가 필요 없다. ‹ › 단추는 키보드·화면 낭독기용이며 같은 스크롤을 움직인다.
 * 카드는 화면보다 좁다. 이웃 장이 조금 작게, 사진은 흐리게 옆에 비쳐, 밀면 넘어간다는 걸 말하지 않아도 안다.
 */
const CardRow = forwardRef<CardRowHandle, Props>(function CardRow(
  { label, cards, index: start, onIndex, listHref, overviewLabel },
  ref,
) {
  const t = tr(COPY);
  const router = useRouter();
  const track = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(start);
  // 부드럽게 넘어가는 중에 한 번 더 누르면, 아직 도착하지 않은 장에서 이어 센다.
  const heading = useRef<number | null>(null);
  const n = cards.length;
  const many = n > 1;
  /*
   * 끝에서 처음으로 이어 넘긴다. 양 끝에 반대쪽 장을 하나씩 더 붙여 두고(마지막 | 1 … n | 첫째),
   * 그 덧붙인 장에서 스크롤이 멈추면 같은 그림의 진짜 장으로 몰래(애니메이션 없이) 옮긴다.
   * 손가락으로 끝을 넘겨 밀어도, ‹ › 단추로 넘겨도 끊기지 않는다.
   */
  const slides = many ? [cards[n - 1], ...cards, cards[0]] : cards;
  const lead = many ? 1 : 0;
  // 지금 보이는 진짜 장(0…n-1). 화면을 돌려 폭이 바뀌면 이 장으로 다시 맞춘다.
  const shown = useRef(start);
  const width = useRef(0);
  const settle = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = (i: number) => {
    if (i !== shown.current) onIndex(i);
    shown.current = i;
    setIndex(i);
  };

  // 처음에는 받은 장에서, 장 수가 바뀌면(다른 창에서 지움) 보던 장 근처에서. 그리기 전에 맞춰야 덧붙인 장이 한 번 비치지 않는다.
  useLayoutEffectOnClient(() => {
    const el = track.current;
    if (!el) return;
    show(Math.max(0, Math.min(shown.current, n - 1)));
    el.scrollTo({ left: (shown.current + lead) * cardWidth(el), behavior: "auto" });
  }, [n]);

  /*
   * 화면을 돌리거나 창 크기가 바뀌면 카드 폭이 달라지는데 스크롤 위치(px)는 그대로 남아,
   * 보던 장이 어중간하게 걸치거나 다른 장으로 넘어간다. 폭이 바뀌면 보던 장으로 되돌린다.
   */
  useEffect(() => {
    const el = track.current;
    if (!el) return;
    width.current = cardWidth(el);
    const observer = new ResizeObserver(() => {
      if (cardWidth(el) === width.current) return;
      width.current = cardWidth(el);
      heading.current = null;
      el.scrollTo({ left: (shown.current + lead) * cardWidth(el), behavior: "auto" });
    });
    observer.observe(el);
    return () => {
      observer.disconnect();
      if (settle.current) clearTimeout(settle.current);
    };
  }, [lead]);

  /*
   * 번호는 스크롤 위치만 정한다(onScroll). 여기서 먼저 올려 두면 부드러운 스크롤의 첫
   * 이벤트들이 옛 위치로 되돌려 "2 → 1 → 2"로 깜빡이고, 화면 낭독기가 틀린 번호를 읽는다.
   * 움직임을 줄인 사람에게는 부드러운 스크롤을 쓰지 않는다 — behavior를 적으면 CSS의
   * scroll-behavior 규칙이 이기지 못한다.
   */
  const go = (step: number) => {
    const el = track.current;
    if (!el) return;
    let from = heading.current ?? Math.round(el.scrollLeft / cardWidth(el));
    // 덧붙인 장에 있거나 그리로 가는 중이면, 같은 그림의 진짜 장으로 먼저 몰래 옮긴 뒤 센다. 아니면 끝에서 누른 게 사라진다.
    if (many && (from === 0 || from === n + 1)) {
      from = from === 0 ? n : 1;
      el.scrollTo({ left: from * cardWidth(el), behavior: "auto" });
    }
    const target = Math.max(0, Math.min(slides.length - 1, from + step));
    heading.current = target;
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollTo({ left: target * cardWidth(el), behavior: still ? "auto" : "smooth" });
  };

  // 누르기 직전에 그 카드의 자리를 남긴다.
  const keep = (card: DeckCard, link: HTMLElement | null) => {
    const key = flipKeyOf(card);
    const el = flipElOf(card, link);
    if (key && el) remember(key, el);
  };
  // 진짜 장(덧붙인 장이 아니라)의 링크.
  const realLink = (i: number) => track.current?.children[i + lead]?.querySelector("a") as HTMLElement | null;

  useImperativeHandle(ref, () => ({
    go,
    open: () => {
      keep(cards[shown.current], realLink(shown.current) ?? null);
      router.push(cards[shown.current].href);
    },
    // 돌아왔을 때 지금 장이 남긴 자리와 같은 카드면 거기서 내려앉는다. 덧붙인 장은 해당 없다.
    play: () => {
      const card = cards[shown.current];
      const key = flipKeyOf(card);
      const el = key ? flipElOf(card, realLink(shown.current)) : null;
      if (key && el) playFrom(key, el as HTMLElement);
    },
  }));

  return (
    <section role="region" aria-label={label} className="relative">
      <div
        ref={track}
        className={`relative flex snap-x snap-mandatory overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${many ? "px-[7%]" : ""}`}
        onScroll={(e) => {
          const el = e.currentTarget;
          // 폭이 바뀌는 중에 나는 스크롤은 옛 위치의 흔적이다. 번호를 믿지 않는다.
          if (cardWidth(el) !== width.current) return;
          const at = el.scrollLeft / cardWidth(el);
          if (heading.current !== null && Math.abs(at - heading.current) < 0.01) heading.current = null;
          show((((Math.round(at) - lead) % n) + n) % n);
          if (!many) return;
          // 멈췄는지는 스크롤이 잠깐 조용한 걸로 안다(scrollend는 아직 모든 웹뷰에 있지 않다).
          if (settle.current) clearTimeout(settle.current);
          settle.current = setTimeout(() => {
            const pos = Math.round(el.scrollLeft / cardWidth(el));
            if (pos !== 0 && pos !== n + 1) return;
            heading.current = null;
            el.scrollTo({ left: (pos === 0 ? n : 1) * cardWidth(el), behavior: "auto" });
          }, 140);
        }}
      >
        {slides.map((card, k) => {
          // 덧붙인 장은 화면 낭독기와 키보드가 지나치게 한다. 같은 카드가 두 번 읽히지 않게.
          const copy = many && (k === 0 || k === n + 1);
          const i = (k - lead + n) % n;
          // 가운데가 아닌 장은 조금 작게, 사진만 흐리게. 글자까지 흐리면 대비가 모자라 읽기 어렵다(옆 장도 초점이 가고 화면 낭독기가 읽는 링크다).
          // 움직임을 줄인 사람에게는 크기를 바꾸지 않는다.
          const side = i !== index;
          return (
            <div
              key={copy ? `${card.id}-${k}` : card.id}
              aria-hidden={copy || undefined}
              className={`shrink-0 snap-center pb-5 pt-3 [@media(max-height:500px)]:pb-3 transition-transform duration-300 [&_img]:transition-opacity [&_img]:duration-300 ${many ? "w-full px-[3%]" : "w-full px-[14%]"} ${side ? "motion-safe:scale-[.92] [&_img]:opacity-60" : ""}`}
            >
              {/* 가로로 돌린 폰에서 사진이 화면보다 커지지 않게, 폭을 화면 높이에 맞춰 묶는다. 아주 낮은 화면(눕힌 폰)은 사진을 4:3으로 낮추고 글은 한 줄씩. */}
              <Link href={card.href} prefetch={false} tabIndex={copy ? -1 : undefined} onClick={(e) => keep(card, e.currentTarget)} className="mx-auto block max-w-[max(10rem,calc(100svh-15rem))] [@media(max-height:500px)]:max-w-[max(8rem,calc(100svh-16rem))] [@media(max-height:500px)]:[&_img]:aspect-[4/3]">
                <Face card={card} tilt={TILTS[i % TILTS.length]} me={t.me} />
              </Link>
            </div>
          );
        })}
      </div>
      <div className="mt-1 flex items-center justify-center gap-4">
        {many && (
          <button type="button" className="btn-quiet sr-only min-h-11 min-w-11 text-base focus-visible:not-sr-only sm:not-sr-only" aria-label={t.prev} onClick={() => go(-1)}>
            ‹
          </button>
        )}
        {/* 점 줄 전체가 모아 보기 링크 하나다. 점 하나하나를 눌러 그 장으로 가지 않는다. */}
        <Link href={listHref} aria-label={overviewLabel(index + 1, n)} className="flex min-h-11 min-w-11 items-center justify-center px-2">
          {n <= MAX_DOTS ? (
            <span aria-hidden="true" className="flex gap-1.5">
              {cards.map((card, k) => (
                <span key={card.id} className={`h-2 w-2 rounded-full ${k === index ? "bg-ink-800" : "bg-ink-200"}`} />
              ))}
            </span>
          ) : (
            <span aria-hidden="true" className="text-sm tabular-nums text-ink-600">
              {index + 1} / {n}
            </span>
          )}
        </Link>
        {many && (
          <button type="button" className="btn-quiet sr-only min-h-11 min-w-11 text-base focus-visible:not-sr-only sm:not-sr-only" aria-label={t.next} onClick={() => go(1)}>
            ›
          </button>
        )}
      </div>
      {/* 넘길 때 몇째 장인지 화면 낭독기에 알린다. */}
      <span className="sr-only" aria-live="polite">
        {t.at(index + 1, n)}
      </span>
    </section>
  );
});

export default CardRow;

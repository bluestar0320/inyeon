"use client";

import Link from "next/link";
import { useEffect, useLayoutEffect, useRef, useState } from "react";

import Polaroid from "@/components/Polaroid";
import { defineCopy, tr } from "@/lib/i18n";

export type StackCard = {
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
};

const COPY = defineCopy({
  ko: { prev: "이전", next: "다음" },
  en: { prev: "Previous", next: "Next" },
  ja: { prev: "前へ", next: "次へ" },
  es: { prev: "Anterior", next: "Siguiente" },
  zh: { prev: "上一张", next: "下一张" },
});

/** 서버에서 미리 그릴 때는 useLayoutEffect가 경고만 낸다. 브라우저에서만 쓴다. */
const useLayoutEffectOnClient = typeof window === "undefined" ? useEffect : useLayoutEffect;

/** 장마다 다른 기울기. 맨 앞 장은 거의 바로 선다. */
const TILTS = [-1, 2, -2, 1.5, -1.5];

/*
 * 겹친 사진 더미. 한 장씩 크게 보고 옆으로 넘긴다.
 *
 * 넘기기는 브라우저의 가로 스크롤 + scroll-snap이 한다. 손가락으로 밀면 그대로 되고,
 * 라이브러리가 필요 없다. ‹ › 단추는 키보드·화면 낭독기용이며 같은 스크롤을 움직인다.
 * 카드는 화면보다 조금 좁다. 다음 장의 가장자리가 옆에 비쳐, 밀면 넘어간다는 걸 말하지 않아도 안다.
 */
/** 한 장의 폭. 스크롤 위치를 장 번호로 바꿀 때 쓴다(카드는 트랙보다 좁다). */
function cardWidth(el: HTMLElement): number {
  return (el.firstElementChild as HTMLElement | null)?.offsetWidth || el.clientWidth;
}

export default function PhotoStack({ label, cards }: { label: string; cards: StackCard[] }) {
  const t = tr(COPY);
  const track = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
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
  const shown = useRef(0);
  const width = useRef(0);
  const settle = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 처음에는 진짜 첫 장에서, 장 수가 바뀌면(다른 창에서 지움) 보던 장 근처에서. 그리기 전에 맞춰야 덧붙인 장이 한 번 비치지 않는다.
  useLayoutEffectOnClient(() => {
    const el = track.current;
    if (!el) return;
    shown.current = Math.min(shown.current, Math.max(0, n - 1));
    setIndex(shown.current);
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
    const from = heading.current ?? Math.round(el.scrollLeft / cardWidth(el));
    const target = Math.max(0, Math.min(slides.length - 1, from + step));
    heading.current = target;
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollTo({ left: target * cardWidth(el), behavior: still ? "auto" : "smooth" });
  };

  return (
    <section role="region" aria-label={label} className="relative">
      <div
        ref={track}
        className={`relative flex snap-x snap-mandatory overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${many ? "px-[9%]" : ""}`}
        onScroll={(e) => {
          const el = e.currentTarget;
          // 폭이 바뀌는 중에 나는 스크롤은 옛 위치의 흔적이다. 번호를 믿지 않는다.
          if (cardWidth(el) !== width.current) return;
          const at = el.scrollLeft / cardWidth(el);
          if (heading.current !== null && Math.abs(at - heading.current) < 0.01) heading.current = null;
          shown.current = (((Math.round(at) - lead) % n) + n) % n;
          setIndex(shown.current);
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
          // 덧붙인 장은 화면 낭독기와 키보드가 지나치게 한다. 같은 사람이 두 번 읽히지 않게.
          const copy = many && (k === 0 || k === n + 1);
          const i = (k - lead + n) % n;
          return (
          <div key={copy ? `${card.id}-${k}` : card.id} aria-hidden={copy || undefined} className={`shrink-0 snap-center py-3 ${many ? "w-full px-[4%]" : "w-full px-[14%]"}`}>
            {/* 가로로 돌린 폰에서 사진이 화면보다 커지지 않게, 폭을 화면 높이에 맞춰 묶는다. */}
            <Link href={card.href} prefetch={false} tabIndex={copy ? -1 : undefined} className="mx-auto block max-w-[max(10rem,calc(100svh-15rem))]">
              <Polaroid src={card.photo} size="md" tilt={TILTS[i % TILTS.length]}>
                <span className="mt-2 block px-1">
                  <span className="font-album block truncate text-sm text-ink-800">{card.title}</span>
                  <span className="font-album mt-0.5 block break-keep text-xs leading-relaxed text-ink-600">{card.sentence}</span>
                  {/* 횟수는 바로 위 문장이 이미 말한다. 화면 낭독기가 두 번 읽지 않게 숨긴다. */}
                  <span aria-hidden="true" className="numeral mt-1 block text-4xl leading-none text-ink-900">
                    {card.count}
                    <span className="ml-1 text-sm font-normal text-ink-600">{card.unit}</span>
                  </span>
                  {card.note && <span className="mt-1 block text-xs text-ink-600">{card.note}</span>}
                </span>
              </Polaroid>
            </Link>
          </div>
          );
        })}
      </div>
      {many && (
        <div className="mt-1 flex items-center justify-center gap-4">
          <button type="button" className="btn-quiet min-h-11 min-w-11 text-base" aria-label={t.prev} onClick={() => go(-1)}>
            ‹
          </button>
          <span className="text-xs tabular-nums text-ink-600" aria-live="polite">
            {index + 1} / {cards.length}
          </span>
          <button type="button" className="btn-quiet min-h-11 min-w-11 text-base" aria-label={t.next} onClick={() => go(1)}>
            ›
          </button>
        </div>
      )}
    </section>
  );
}

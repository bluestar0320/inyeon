"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

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
  const many = cards.length > 1;
  // 지금 보이는 장. 화면을 돌려 폭이 바뀌면 이 장으로 다시 맞춘다.
  const shown = useRef(0);
  const width = useRef(0);

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
      el.scrollTo({ left: shown.current * cardWidth(el), behavior: "auto" });
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

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
    const target = Math.max(0, Math.min(cards.length - 1, from + step));
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
          shown.current = Math.min(cards.length - 1, Math.round(at));
          setIndex(shown.current);
        }}
      >
        {cards.map((card, i) => (
          <div key={card.id} className={`shrink-0 snap-center py-3 ${many ? "w-full px-[4%]" : "w-full px-[14%]"}`}>
            {/* 가로로 돌린 폰에서 사진이 화면보다 커지지 않게, 폭을 화면 높이에 맞춰 묶는다. */}
            <Link href={card.href} prefetch={false} className="mx-auto block max-w-[max(10rem,calc(100svh-15rem))]">
              <Polaroid src={card.photo} size="md" tilt={TILTS[i % TILTS.length]}>
                <span className="mt-2 block px-1">
                  <span className="font-album block truncate text-sm text-ink-800">{card.title}</span>
                  <span className="font-album mt-0.5 block text-xs leading-relaxed text-ink-600">{card.sentence}</span>
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
        ))}
      </div>
      {/*
        끝에 닿아도 단추를 disabled로 끄지 않는다. 끄면 키보드 초점이 단추에서 떨어져
        페이지 맨 위로 사라진다. aria-disabled로 알리고, 눌러도 아무 일도 하지 않는다.
      */}
      {many && (
        <div className="mt-1 flex items-center justify-center gap-4">
          <button type="button" className="btn-quiet min-h-11 min-w-11 text-base aria-disabled:cursor-default aria-disabled:opacity-40" aria-label={t.prev} aria-disabled={index === 0} onClick={() => index > 0 && go(-1)}>
            ‹
          </button>
          <span className="text-xs tabular-nums text-ink-600" aria-live="polite">
            {index + 1} / {cards.length}
          </span>
          <button type="button" className="btn-quiet min-h-11 min-w-11 text-base aria-disabled:cursor-default aria-disabled:opacity-40" aria-label={t.next} aria-disabled={index === cards.length - 1} onClick={() => index < cards.length - 1 && go(1)}>
            ›
          </button>
        </div>
      )}
    </section>
  );
}

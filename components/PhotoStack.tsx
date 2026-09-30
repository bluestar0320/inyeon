"use client";

import Link from "next/link";
import { useRef, useState } from "react";

import Polaroid from "@/components/Polaroid";
import { defineCopy, tr } from "@/lib/i18n";

export type StackCard = {
  id: string;
  href: string;
  photo: string;
  title: string;
  sentence: string;
  count: string;
  unit: string;
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
 * 뒤로 비치는 두 장은 꾸밈(aria-hidden)이다 — "더 있다"는 느낌만 준다.
 */
export default function PhotoStack({ label, cards }: { label: string; cards: StackCard[] }) {
  const t = tr(COPY);
  const track = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  // 부드럽게 넘어가는 중에 한 번 더 누르면, 아직 도착하지 않은 장에서 이어 센다.
  const heading = useRef<number | null>(null);
  const many = cards.length > 1;

  /*
   * 번호는 스크롤 위치만 정한다(onScroll). 여기서 먼저 올려 두면 부드러운 스크롤의 첫
   * 이벤트들이 옛 위치로 되돌려 "2 → 1 → 2"로 깜빡이고, 화면 낭독기가 틀린 번호를 읽는다.
   * 움직임을 줄인 사람에게는 부드러운 스크롤을 쓰지 않는다 — behavior를 적으면 CSS의
   * scroll-behavior 규칙이 이기지 못한다.
   */
  const go = (step: number) => {
    const el = track.current;
    if (!el) return;
    const from = heading.current ?? Math.round(el.scrollLeft / el.clientWidth);
    const target = Math.max(0, Math.min(cards.length - 1, from + step));
    heading.current = target;
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollTo({ left: target * el.clientWidth, behavior: still ? "auto" : "smooth" });
  };

  return (
    <section role="region" aria-label={label} className="relative">
      {many && (
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-[14%] top-4 bottom-12 motion-reduce:hidden">
          <span className="polaroid absolute inset-0 rotate-[5deg]" />
          <span className="polaroid absolute inset-0 -rotate-[4deg]" />
        </div>
      )}
      <div
        ref={track}
        className="relative flex snap-x snap-mandatory overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        onScroll={(e) => {
          const el = e.currentTarget;
          const at = el.scrollLeft / el.clientWidth;
          if (heading.current !== null && Math.abs(at - heading.current) < 0.01) heading.current = null;
          setIndex(Math.round(at));
        }}
      >
        {cards.map((card, i) => (
          <div key={card.id} className="w-full shrink-0 snap-center px-[14%] py-3">
            <Link href={card.href} prefetch={false} className="block">
              <Polaroid photo={card.photo} size="md" tilt={TILTS[i % TILTS.length]}>
                <span className="mt-2 block px-1">
                  <span className="font-album block truncate text-sm text-ink-800">{card.title}</span>
                  <span className="font-album mt-0.5 block text-xs leading-relaxed text-ink-600">{card.sentence}</span>
                  {/* 횟수는 바로 위 문장이 이미 말한다. 화면 낭독기가 두 번 읽지 않게 숨긴다. */}
                  <span aria-hidden="true" className="numeral mt-1 block text-4xl leading-none text-ink-900">
                    {card.count}
                    <span className="ml-1 text-sm font-normal text-ink-600">{card.unit}</span>
                  </span>
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

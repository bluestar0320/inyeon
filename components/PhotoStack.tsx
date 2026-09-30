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
  const many = cards.length > 1;

  const go = (next: number) => {
    const el = track.current;
    if (!el) return;
    const clamped = Math.max(0, Math.min(cards.length - 1, next));
    el.scrollTo({ left: clamped * el.clientWidth, behavior: "smooth" });
    setIndex(clamped);
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
          setIndex(Math.round(el.scrollLeft / el.clientWidth));
        }}
      >
        {cards.map((card, i) => (
          <div key={card.id} className="w-full shrink-0 snap-center px-[14%] py-3">
            <Link href={card.href} prefetch={false} className="block">
              <Polaroid photo={card.photo} size="md" tilt={TILTS[i % TILTS.length]}>
                <span className="mt-2 block px-1">
                  <span className="font-album block truncate text-sm text-ink-800">{card.title}</span>
                  <span className="font-album mt-0.5 block text-xs leading-relaxed text-ink-600">{card.sentence}</span>
                  <span className="numeral mt-1 block text-4xl leading-none text-ink-900">
                    {card.count}
                    <span className="ml-1 text-sm font-normal text-ink-600">{card.unit}</span>
                  </span>
                </span>
              </Polaroid>
            </Link>
          </div>
        ))}
      </div>
      {many && (
        <div className="mt-1 flex items-center justify-center gap-4">
          <button type="button" className="btn-quiet px-3 text-base" aria-label={t.prev} disabled={index === 0} onClick={() => go(index - 1)}>
            ‹
          </button>
          <span className="text-xs tabular-nums text-ink-600" aria-live="polite">
            {index + 1} / {cards.length}
          </span>
          <button type="button" className="btn-quiet px-3 text-base" aria-label={t.next} disabled={index === cards.length - 1} onClick={() => go(index + 1)}>
            ›
          </button>
        </div>
      )}
    </section>
  );
}

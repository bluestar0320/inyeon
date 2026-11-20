"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

import Polaroid from "@/components/Polaroid";
import { playFrom, remember } from "@/lib/flip";
import { formatCount } from "@/lib/format";
import { defineCopy, tr } from "@/lib/i18n";

export type DeckCard = {
  id: string;
  href: string;
  /** 그림 주소(imageFor). */
  photo: string;
  title: string;
  /** 「아버지와 마주 앉을 날, 앞으로 230번이에요.」 count가 이 안에 한 번 나오면 그 숫자를 크게 쓴다. */
  sentence: string;
  count: string;
  unit: string;
  /** 문장 아래 작은 한 줄. "마지막 만남 23일 전" 같은 것. */
  note?: string | null;
  /** 사진 모서리 리본. "생일 6일 전" 같은 것. */
  ribbon?: string | null;
  /** 펼치기 효과에서 이 카드를 가리키는 이름. person:id / moment:id. */
  flipKey?: string;
};

export type CardRowHandle = {
  go(step: number): void;
  open(): void;
  play(): void;
};

type Props = {
  label: string;
  cards: DeckCard[];
  /** 처음 열 장(0…n-1). 이후 번호는 onIndex로 알린다. */
  index: number;
  onIndex(i: number): void;
  /** 점 줄(모아 보기)을 누르면 가는 곳. */
  listHref: string;
  overviewLabel: (i: number, n: number) => string;
  /** 「＋」 단추. 카드가 없으면 점선 카드 한 장이 된다. */
  addHref: string;
  addLabel: string;
};

const COPY = defineCopy({
  ko: {
    prev: "이전",
    next: "다음",
    at: (i: number, n: number) => `${n}장 중 ${i}번째`,
  },
  en: { prev: "Previous", next: "Next", at: (i, n) => `${i} of ${n}` },
  ja: { prev: "前へ", next: "次へ", at: (i, n) => `${n}枚中${i}枚目` },
  es: { prev: "Anterior", next: "Siguiente", at: (i, n) => `${i} de ${n}` },
  zh: { prev: "上一张", next: "下一张", at: (i, n) => `第${i}张，共${n}张` },
});

const useLayoutEffectOnClient =
  typeof window === "undefined" ? useEffect : useLayoutEffect;
const still = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** 점은 이 수까지. 넘으면 「3 / 24」로 적는다. */
const MAX_DOTS = 12;
/** 더미에 보이는 장 수(맨 위 + 뒤의 둘). 자리 모양은 app/globals.css의 .pile-card. */
const DEPTH = 3;
/** 넘긴 장이 날아가 머무는 곳(왼쪽 밖). 오른쪽으로 밀어 되돌리면 여기서 다시 들어온다. */
const OUT = "translate(-135%, -4%) rotate(-14deg)";
/** 이만큼 밀거나(px), 이만큼 빠르게 밀면(px/ms) 넘긴다. */
const FLING_PX = 70;
const FLING_V = 0.5;

/** 숫자를 옛 값에서 새 값으로 세어 바꾼다. 글자는 직접 쓴다(React가 쥔 글자를 건드리지 않게). */
function Count({ value }: { value: string }) {
  const ref = useRef<HTMLElement>(null);
  const last = useRef(value);
  useLayoutEffectOnClient(() => {
    const el = ref.current;
    if (!el) return;
    const from = Number(last.current.replace(/[^\d]/g, ""));
    const to = Number(value.replace(/[^\d]/g, ""));
    last.current = value;
    el.textContent = value;
    if (
      from === to ||
      !Number.isFinite(from) ||
      !Number.isFinite(to) ||
      !/\d/.test(value) ||
      still()
    )
      return;
    let raf = 0;
    const t0 = performance.now();
    const step = (t: number) => {
      const k = Math.min(1, (t - t0) / 450);
      el.textContent =
        k < 1 ? formatCount(from + (to - from) * (1 - (1 - k) ** 3)) : value;
      if (k < 1) raf = requestAnimationFrame(step);
    };
    el.textContent = formatCount(from);
    raf = requestAnimationFrame(step);
    return () => {
      cancelAnimationFrame(raf);
      el.textContent = value;
    };
  }, [value]);
  return (
    <b
      ref={ref}
      className="mx-0.5 text-[4rem] font-normal tabular-nums leading-none [@media(max-height:500px)]:text-4xl"
    />
  );
}

/** 문장 속 숫자만 크게. 숫자가 문장에 없으면(번역이 숫자를 바꿔 적은 경우) 문장 그대로. */
function Sentence({ card }: { card: DeckCard }) {
  const at = card.sentence.indexOf(card.count);
  return (
    <p className="font-hand ink break-keep text-[2.5rem] leading-[1.3] [@media(max-height:500px)]:text-[1.75rem]">
      {at < 0 ? (
        card.sentence
      ) : (
        <>
          {card.sentence.slice(0, at)}
          <Count value={card.count} />
          {card.sentence.slice(at + card.count.length)}
        </>
      )}
    </p>
  );
}

/*
 * 카드 줄. 책상 위 사진 더미처럼 지금 장이 맨 위에 있고, 다음 장 둘이 뒤에 비스듬히 깔린다.
 * 위에는 지금 장의 문장을 크게 쓴다.
 *
 * 왼쪽으로 밀면 맨 위 장이 날아가고 뒤의 장이 올라온다(넘긴 장은 더미 맨 뒤로).
 * 오른쪽으로 밀면 방금 넘긴 장이 왼쪽에서 되돌아온다. 끝에서는 처음으로 이어진다.
 * 세로로 미는 건 바깥 상자(인연 ↔ 순간)가 받는다(touch-action: pan-y).
 * ‹ › 단추와 ←/→ 키는 화면 낭독기·키보드용이며 같은 넘기기를 한다.
 */
const CardRow = forwardRef<CardRowHandle, Props>(function CardRow(
  {
    label,
    cards,
    index: start,
    onIndex,
    listHref,
    overviewLabel,
    addHref,
    addLabel,
  },
  ref,
) {
  const t = tr(COPY);
  const router = useRouter();
  const n = cards.length;
  const [index, setIndex] = useState(() => Math.max(0, Math.min(start, n - 1)));
  const shown = useRef(index);
  const els = useRef(new Map<string, HTMLElement>());
  // 날아가는 중인 장. 끝나기 전에 또 넘기면 그 자리에서 마저 끝낸다(연타해도 번호가 맞다).
  const flying = useRef<{ anim: Animation; done: () => void } | null>(null);
  // 되돌아오는 장: 그린 뒤 왼쪽 밖에서 제자리로 들인다.
  const arriving = useRef<string | null>(null);
  const drag = useRef<{
    x: number;
    y: number;
    t: number;
    dx: number;
    moved: boolean;
  } | null>(null);
  const dragged = useRef(false);

  const commit = (i: number) => {
    if (i !== shown.current) onIndex(i);
    shown.current = i;
    setIndex(i);
  };

  // 다른 창에서 지워 장 수가 줄면 보던 장 근처로.
  useEffect(() => {
    if (n && shown.current > n - 1) commit(n - 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [n]);

  useLayoutEffectOnClient(() => {
    const id = arriving.current;
    arriving.current = null;
    const el = id ? els.current.get(id) : null;
    if (!el) return;
    el.style.transition = "none";
    el.style.transform = OUT;
    void el.offsetWidth;
    el.style.transition = "";
    el.style.transform = "";
  }, [index]);

  const top = () =>
    n ? (els.current.get(cards[shown.current].id) ?? null) : null;

  const land = () => {
    const f = flying.current;
    if (!f) return;
    flying.current = null;
    f.anim.cancel();
    f.done();
  };

  const go = (step: number) => {
    if (n < 2) return;
    land();
    const from = shown.current;
    const to = (((from + step) % n) + n) % n;
    const el = top();
    if (step > 0 && el && !still()) {
      // 맨 위 장을 지금 자리(손가락이 끌던 곳)에서 왼쪽 밖으로 날린다.
      el.style.zIndex = "30";
      const anim = el.animate(
        [{ transform: getComputedStyle(el).transform }, { transform: OUT }],
        {
          duration: 260,
          easing: "cubic-bezier(.3,0,.8,.6)",
          fill: "forwards",
        },
      );
      const done = () => {
        // 밖에 둔 채로 번호를 바꾸고, 다음 그림에서 더미 맨 뒤 자리로 미끄러져 들어간다.
        el.style.transition = "none";
        el.style.transform = OUT;
        commit(to);
        requestAnimationFrame(() => {
          el.style.transition = "";
          el.style.transform = "";
          el.style.zIndex = "";
        });
      };
      flying.current = { anim, done };
      anim.onfinish = land;
      return;
    }
    if (el) {
      el.style.transform = "";
      el.style.transition = "";
    }
    if (step < 0 && !still()) arriving.current = cards[to].id;
    commit(to);
  };

  const keep = (card: DeckCard) => {
    const img = els.current.get(card.id)?.querySelector("img");
    if (card.flipKey && img) remember(card.flipKey, img);
  };

  useImperativeHandle(ref, () => ({
    go,
    open: () => {
      if (!n) return router.push(addHref);
      keep(cards[shown.current]);
      router.push(cards[shown.current].href);
    },
    // 상세에서 돌아왔을 때 지금 장이 남긴 자리와 같은 카드면 거기서 내려앉는다.
    play: () => {
      const card = cards[shown.current];
      const img = card && els.current.get(card.id)?.querySelector("img");
      if (card?.flipKey && img) playFrom(card.flipKey, img as HTMLElement);
    },
  }));

  // 손가락 끌기. 가로로 먼저 움직일 때만 잡는다. 세로면 바깥 상자의 스크롤에 넘긴다.
  const onPointerDown = (e: React.PointerEvent) => {
    if (n < 2 || !e.isPrimary || e.button > 0) return;
    land();
    drag.current = {
      x: e.clientX,
      y: e.clientY,
      t: performance.now(),
      dx: 0,
      moved: false,
    };
    dragged.current = false;
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current;
    const el = top();
    if (!d || !el) return;
    const dx = e.clientX - d.x;
    if (!d.moved) {
      if (Math.abs(dx) < 8 && Math.abs(e.clientY - d.y) < 8) return;
      if (Math.abs(e.clientY - d.y) > Math.abs(dx)) {
        drag.current = null;
        return;
      }
      d.moved = true;
      dragged.current = true;
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      el.style.transition = "none";
    }
    d.dx = dx;
    // 오른쪽(되돌리기)은 덜 따라온다. 뒤에서 다른 장이 들어올 것이기 때문.
    const x = dx > 0 ? dx * 0.35 : dx;
    el.style.transform = `translateX(${x}px) rotate(${-1 + x / 22}deg)`;
  };
  const onPointerEnd = (e: React.PointerEvent) => {
    const d = drag.current;
    drag.current = null;
    if (!d?.moved) return;
    const v = d.dx / Math.max(1, performance.now() - d.t);
    const el = top();
    if (e.type !== "pointercancel" && (d.dx < -FLING_PX || v < -FLING_V))
      return go(1);
    if (el) {
      el.style.transition = "";
      el.style.transform = "";
    }
    if (e.type !== "pointercancel" && (d.dx > FLING_PX || v > FLING_V)) go(-1);
  };

  const card = n ? cards[index] : null;
  // 맨 위(0)와 뒤의 장들. 장이 셋보다 적으면 있는 만큼.
  const pile = Array.from({ length: Math.min(n, DEPTH) }, (_, slot) => ({
    card: cards[(index + slot) % n],
    slot,
  }));

  return (
    <section
      role="region"
      aria-label={label}
      className="flex min-h-0 flex-col [@media(max-height:500px)]:grid [@media(max-height:500px)]:grid-cols-2 [@media(max-height:500px)]:items-center [@media(max-height:500px)]:gap-x-8 [@media(max-height:500px)]:px-[6%]"
    >
      {/* 문장. 장이 바뀔 때마다 새로 떠오른다(key). 높이를 잡아 두어 문장 길이로 더미가 출렁이지 않는다. */}
      <div className="min-h-[9.5rem] px-7 [@media(max-height:500px)]:col-start-1 [@media(max-height:500px)]:row-start-1 [@media(max-height:500px)]:min-h-0 [@media(max-height:500px)]:px-0">
        {card && (
          <div key={card.id} className="deck-line">
            <Sentence card={card} />
            {card.note && (
              <p className="mt-2 text-sm text-ink-600">{card.note}</p>
            )}
          </div>
        )}
      </div>

      {/* 더미 자리. 문장·점 줄·내 카드를 놓고 남은 높이만큼만 차지하고(모자라면 줄어든다), 더미는 그 안에 맞춘다.
          vh로 재면 안드로이드 내비게이션 줄 몫까지 셈에 들어가 아래가 잘린다. */}
      <div data-pile-slot="" className="flex min-h-0 flex-[0_1_calc((min(100vw,48rem)-2rem)*0.826+0.5rem)] justify-center pt-2 [container-type:size] [@media(max-height:500px)]:contents">
      <div
        data-pile=""
        className="relative aspect-[100/118] w-[min(70cqw,84.7cqh)] touch-pan-y select-none [@media(max-height:500px)]:col-start-2 [@media(max-height:500px)]:row-span-2 [@media(max-height:500px)]:row-start-1 [@media(max-height:500px)]:mt-0 [@media(max-height:500px)]:w-[min(100%,calc((100svh-8rem)/1.18))]"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerEnd}
        onPointerCancel={onPointerEnd}
        // 사진을 끌면 브라우저가 그림 끌어 놓기를 시작해 손가락 끌기가 끊긴다.
        onDragStart={(e) => e.preventDefault()}
        // 끌어서 넘겼으면 손을 뗄 때 생기는 누름은 링크로 보내지 않는다.
        onClickCapture={(e) => {
          if (!dragged.current) return;
          dragged.current = false;
          e.preventDefault();
          e.stopPropagation();
        }}
      >
        {!card && (
          <Link
            href={addHref}
            className="absolute inset-0 flex items-center justify-center rounded-[5px] border-2 border-dashed border-ink-200 text-base text-ink-600"
          >
            ＋ {addLabel}
          </Link>
        )}
        {pile
          .slice()
          .reverse()
          .map(({ card: c, slot }) => (
            <div
              key={c.id}
              ref={(el) => {
                if (el) els.current.set(c.id, el);
                else els.current.delete(c.id);
              }}
              data-slot={slot}
              data-top={slot === 0 ? "" : undefined}
              aria-hidden={slot === 0 ? undefined : true}
              className="pile-card absolute inset-x-0 top-0"
            >
              <Link
                href={c.href}
                prefetch={false}
                tabIndex={slot === 0 ? undefined : -1}
                draggable={false}
                onClick={() => keep(c)}
                className="block"
              >
                <Polaroid src={c.photo} size="md">
                  <span className="font-hand mt-2 block truncate px-1 text-[22px] leading-tight text-ink-800">
                    {c.title}
                  </span>
                </Polaroid>
                {c.ribbon && (
                  <span className="absolute right-0 top-4 rounded-l-sm bg-ink-800 px-2 py-0.5 text-[11px] text-onInk">
                    {c.ribbon}
                  </span>
                )}
              </Link>
            </div>
          ))}
      </div>
      </div>

      {/* 점 줄은 정가운데, 「＋」는 그 오른쪽. 가운데 칸 양옆을 같은 너비(1fr)로 둔다. */}
      <div className="mt-5 grid grid-cols-[1fr_auto_1fr] items-center gap-3 [@media(max-height:500px)]:flex [@media(max-height:500px)]:col-start-1 [@media(max-height:500px)]:row-start-2 [@media(max-height:500px)]:mt-2 [@media(max-height:500px)]:justify-start">
        {n > 1 && (
          <button
            type="button"
            className="btn-quiet sr-only col-start-1 min-h-11 min-w-11 justify-self-end text-base focus-visible:not-sr-only sm:not-sr-only"
            aria-label={t.prev}
            onClick={() => go(-1)}
          >
            ‹
          </button>
        )}
        {n > 0 && (
          // 점 줄 전체가 모아 보기 링크 하나다. 점 하나하나를 눌러 그 장으로 가지 않는다.
          <Link
            href={listHref}
            aria-label={overviewLabel(index + 1, n)}
            className="col-start-2 flex min-h-11 min-w-11 items-center justify-center px-2"
          >
            {n <= MAX_DOTS ? (
              <span aria-hidden="true" className="flex gap-1.5">
                {cards.map((c, k) => (
                  <span
                    key={c.id}
                    className={`h-2 w-2 rounded-full ${k === index ? "bg-ink-800" : "bg-ink-200"}`}
                  />
                ))}
              </span>
            ) : (
              <span
                aria-hidden="true"
                className="text-sm tabular-nums text-ink-600"
              >
                {index + 1} / {n}
              </span>
            )}
          </Link>
        )}
        <div className="col-start-3 flex items-center gap-3 justify-self-start">
        {n > 0 && (
          <Link
            href={addHref}
            aria-label={addLabel}
            className="flex h-11 w-11 items-center justify-center text-ink-800"
          >
            {/* 누르는 자리는 44px 그대로, 눈에 보이는 원만 작게. */}
            <span aria-hidden="true" className="flex h-7 w-7 items-center justify-center rounded-full border border-ink-200 text-base leading-none">＋</span>
          </Link>
        )}
        {n > 1 && (
          <button
            type="button"
            className="btn-quiet sr-only min-h-11 min-w-11 text-base focus-visible:not-sr-only sm:not-sr-only"
            aria-label={t.next}
            onClick={() => go(1)}
          >
            ›
          </button>
        )}
        </div>
      </div>
      {/* 넘길 때 몇째 장인지 화면 낭독기에 알린다. */}
      <span className="sr-only" aria-live="polite">
        {n > 0 ? t.at(index + 1, n) : ""}
      </span>
    </section>
  );
});

export default CardRow;

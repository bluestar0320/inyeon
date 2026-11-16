import { useLayoutEffect, useRef, type RefObject } from "react";

/*
 * 펼치기 효과(FLIP). 카드를 누를 때 그 사진의 자리를 남겨 두고, 상세 화면이 뜨면 그 자리에서
 * 제자리로 커진다. 돌아오면 반대로 상세 사진의 자리에서 카드 사진으로 내려앉는다.
 * Web Animations만 쓴다. fill을 쓰지 않아 끝나면 원래 스타일이고, 중간에 떠나도 엉뚱한 자리에 남지 않는다.
 */

let kept: { key: string; rect: DOMRect } | null = null;

export function remember(key: string, el: Element): void {
  kept = { key, rect: el.getBoundingClientRect() };
}

const useLayoutEffectOnClient = typeof window === "undefined" ? () => {} : useLayoutEffect;

/** 남은 자리가 key와 같을 때만 한 번 쓰고 비운다. 같든 다르든 남은 값은 여기서 비운다. */
export function playFrom(key: string, el: HTMLElement): void {
  const from = kept;
  kept = null;
  if (!from || from.key !== key) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const to = el.getBoundingClientRect();
  if (!from.rect.width || !from.rect.height || !to.width || !to.height) return;
  el.animate(
    [
      {
        transform: `translate(${from.rect.left - to.left}px, ${from.rect.top - to.top}px) scale(${from.rect.width / to.width})`,
        transformOrigin: "top left",
      },
      { transform: "none", transformOrigin: "top left" },
    ],
    { duration: 420, easing: "cubic-bezier(.2,.8,.2,1)" },
  );
  // 사진이 아닌 나머지 내용(이름·글)은 사진이 자리 잡은 뒤에 서서히.
  el.querySelectorAll(":scope > * > :not(img)").forEach((rest) =>
    rest.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 250, delay: 160, easing: "ease-out", fill: "backwards" }),
  );
}

export function useFlip<T extends HTMLElement>(key: string): RefObject<T> {
  const ref = useRef<T>(null);
  const el = useRef<T | null>(null);
  // 요소가 나중에 붙을 수도 있어(null을 먼저 그리는 화면) 그리기마다 살피고, 한 번만 쓴다.
  useLayoutEffectOnClient(() => {
    if (!ref.current || el.current) return;
    el.current = ref.current;
    playFrom(key, ref.current);
  });
  useLayoutEffectOnClient(
    () => () => {
      if (el.current) remember(key, el.current);
    },
    [key],
  );
  return ref;
}

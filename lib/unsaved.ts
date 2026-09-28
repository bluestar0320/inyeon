"use client";

import { useEffect } from "react";

import { defineCopy, tr } from "./i18n";

const COPY = defineCopy({
  ko: {
    leave: "저장하지 않은 변경이 있습니다. 나가면 사라집니다.",
    confirm: "그래도 나가시겠습니까?",
  },
  en: {
    leave: "You have unsaved changes. They'll be lost if you leave.",
    confirm: "Leave anyway?",
  },
  ja: {
    leave: "保存していない変更があります。移動すると失われます。",
    confirm: "それでも移動しますか？",
  },
  es: {
    leave: "Tienes cambios sin guardar. Se perderán si sales.",
    confirm: "¿Salir de todos modos?",
  },
  zh: {
    leave: "有尚未保存的更改。离开后将会丢失。",
    confirm: "仍要离开吗？",
  },
});

/**
 * 편집 중 저장하지 않은 변경이 있는지 알리는 자리.
 *
 * App Router에는 화면 이동을 가로챌 공식 훅이 없어서, 편집기가 여기에 "지금
 * 안 저장된 게 있다"고 표시해 두면 내비게이션과 브라우저가 각자 확인한다.
 * 뒤로 가기(popstate)는 막지 못한다 — 아래 KNOWN GAP 참고.
 *
 * 이 값을 구독하는 화면은 없다. 링크를 누르는 순간에만 동기적으로 읽으면 되므로
 * 그냥 모듈 변수다.
 */
let dirty = false;

/**
 * 저장·삭제·취소로 "지금 일부러 떠나는 중"인지.
 *
 * 이게 없으면 사고가 난다. 저장하면 dirty가 false로 바뀌면서 가드 정리 코드가 돌고,
 * 그때 router.push가 아직 반영되지 않았으면 심어 둔 히스토리 항목 위에 서 있는 것처럼
 * 보여서 history.back()을 부른다. 그 뒤로 가기가 방금 시작한 이동과 맞붙는다.
 */
let leaving = false;


/** 편집 중인 화면에 저장하지 않은 게 있는지. */
export function isDirty(): boolean {
  return dirty;
}

/** 지금 나가도 되는지 묻는다. 안 저장된 게 없으면 묻지 않는다. */
export function confirmLeave(): boolean {
  if (!dirty) return true;
  const t = tr(COPY);
  return window.confirm(`${t.leave}\n\n${t.confirm}`);
}

/** 저장/삭제/취소로 편집을 끝냈을 때 호출해 표시를 지운다. */
export function clearDirty(): void {
  dirty = false;
  leaving = true;
}

/** 뒤로 가기를 한 번 받아내려고 심어 두는 히스토리 항목의 표식. */
const SENTINEL = "rc-unsaved-guard";

/**
 * 편집을 끝내고(저장·삭제·취소) 다른 화면으로 간다.
 *
 * 편집 중에는 뒤로 가기를 받아내려고 같은 주소의 히스토리 항목을 하나 더 심어 둔다.
 * 그 위에서 push로 떠나면 편집 화면이 히스토리에 두 번 남아, 나중에 뒤로 가기를 한 번
 * 누르면 같은 화면으로 가서 아무 일도 없는 것처럼 보였다. 심어 둔 항목 위에 서 있으면
 * 그 자리를 목적지로 바꿔 친다.
 */
export function leaveTo(router: { push: (href: string) => void; replace: (href: string) => void }, href: string): void {
  clearDirty();
  const state = window.history.state as Record<string, unknown> | null;
  if (state?.[SENTINEL] === true) router.replace(href);
  else router.push(href);
}

/**
 * 편집기가 쓰는 훅. changed가 true인 동안 나가기를 확인하고, 탭을 닫거나
 * 새로고침할 때 브라우저 기본 경고를 띄우고, 뒤로 가기도 한 번 받아낸다.
 */
export function useUnsavedGuard(changed: boolean): void {
  useEffect(() => {
    dirty = changed;
    return () => {
      dirty = false;
    };
  }, [changed]);

  useEffect(() => {
    if (!changed) return undefined;
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      // 최신 브라우저는 문구를 무시하고 기본 경고를 띄운다.
      const message = tr(COPY).leave;
      event.returnValue = message;
      return message;
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [changed]);

  /*
   * 뒤로 가기.
   *
   * App Router에는 이동을 가로챌 방법이 없어서, 같은 주소로 히스토리 항목을 하나 더
   * 심어 둔다. 뒤로 가기를 누르면 그 항목이 먼저 벗겨지면서 popstate가 오고, 그때
   * 묻는다. 주소가 같으므로 화면은 그대로다.
   *
   * 심어 둔 항목을 치우지 않으면 저장하고 나간 뒤에 뒤로 가기가 한 번 먹통이 된다.
   * 그래서 정리할 때 아직 그 항목 위에 서 있으면 직접 벗겨 낸다.
   */
  useEffect(() => {
    if (!changed) return undefined;
    if (typeof window === "undefined") return undefined;

    let armed = true;
    leaving = false;
    const here = window.location.href;
    window.history.pushState({ [SENTINEL]: true }, "", here);

    const onPopState = () => {
      if (!armed) return;
      if (confirmLeave()) {
        // 사용자가 나가기로 했으니 다시 묻지 않고 진짜로 뒤로 보낸다.
        armed = false;
        dirty = false;
        window.history.back();
      } else {
        window.history.pushState({ [SENTINEL]: true }, "", window.location.href);
      }
    };

    window.addEventListener("popstate", onPopState);
    return () => {
      window.removeEventListener("popstate", onPopState);
      // 일부러 떠나는 중이면 손대지 않는다. 남은 항목은 같은 주소라 무해하고,
      // 여기서 뒤로 보내면 방금 시작한 이동과 맞붙는다.
      // 제자리에서 편집을 되돌려 깨끗해진 경우에만 심어 둔 항목을 벗긴다.
      const state = window.history.state as Record<string, unknown> | null;
      if (armed && !leaving && state?.[SENTINEL] === true) {
        armed = false;
        window.history.back();
      }
    };
  }, [changed]);
}

/**
 * 한글 입력 중에 글자를 확정하려고 누른 Enter가 곧바로 저장으로 이어지지 않게 한다.
 * 일부 브라우저(Safari 등)는 조합 중인 Enter로도 form을 제출해서, 마지막 글자가
 * 빠진 채 저장된다. 편집 화면의 form에 onKeyDown으로 단다.
 */
export function blockImeEnter(event: { key: string; nativeEvent: { isComposing?: boolean }; preventDefault: () => void }): void {
  if (event.key === "Enter" && event.nativeEvent.isComposing) event.preventDefault();
}

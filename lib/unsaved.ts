"use client";

import { useEffect, useSyncExternalStore } from "react";

/**
 * 편집 중 저장하지 않은 변경이 있는지 알리는 자리.
 *
 * App Router에는 화면 이동을 가로챌 공식 훅이 없어서, 편집기가 여기에 "지금
 * 안 저장된 게 있다"고 표시해 두면 내비게이션과 브라우저가 각자 확인한다.
 * 뒤로 가기(popstate)는 막지 못한다 — 아래 KNOWN GAP 참고.
 */
let dirty = false;
const listeners = new Set<() => void>();

function emit(): void {
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function isDirty(): boolean {
  return dirty;
}

export function useIsDirty(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => dirty,
    () => false,
  );
}

export const LEAVE_MESSAGE = "저장하지 않은 변경이 있습니다. 나가면 사라집니다.";

/** 지금 나가도 되는지 묻는다. 안 저장된 게 없으면 묻지 않는다. */
export function confirmLeave(): boolean {
  if (!dirty) return true;
  return window.confirm(`${LEAVE_MESSAGE}\n\n그래도 나가시겠습니까?`);
}

/** 저장/취소로 편집을 끝냈을 때 호출해 표시를 지운다. */
export function clearDirty(): void {
  if (!dirty) return;
  dirty = false;
  emit();
}

/**
 * 편집기가 쓰는 훅. changed가 true인 동안 나가기를 확인하고, 탭을 닫거나
 * 새로고침할 때 브라우저 기본 경고를 띄운다.
 *
 * KNOWN GAP: 브라우저 뒤로 가기는 막지 않는다. App Router에서 popstate를 되돌리려면
 * 히스토리를 다시 밀어 넣어야 하는데, 그 방식은 뒤로 가기를 눌러도 화면이 안 바뀌는
 * 것처럼 보이는 부작용이 있어 택하지 않았다.
 */
export function useUnsavedGuard(changed: boolean): void {
  useEffect(() => {
    dirty = changed;
    emit();
    return () => {
      dirty = false;
      emit();
    };
  }, [changed]);

  useEffect(() => {
    if (!changed) return undefined;
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      // 최신 브라우저는 문구를 무시하고 기본 경고를 띄운다.
      event.returnValue = LEAVE_MESSAGE;
      return LEAVE_MESSAGE;
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [changed]);
}

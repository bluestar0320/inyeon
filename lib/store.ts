"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";

import { DEFAULT_COUNTRY_CODE, lookupLifeExpectancy } from "./lifeExpectancy";
import { newId } from "./presets";
import { STORAGE_KEY } from "./storageKey";
import type { AppState, MarriagePlan, Moment, Person, Profile, Settings } from "./types";

export const DEFAULT_SETTINGS: Settings = {
  tone: "calm",
  theme: "system",
};

/**
 * 서버 렌더와 하이드레이션 직후에 쓰이는 스냅샷. 같은 객체를 계속 돌려줘야
 * useSyncExternalStore가 무한 루프에 빠지지 않는다.
 */
const EMPTY_STATE: AppState = {
  version: 1,
  profile: null,
  people: [],
  moments: [],
  marriage: null,
  settings: DEFAULT_SETTINGS,
};

let state: AppState = EMPTY_STATE;
let booted = false;
const listeners = new Set<() => void>();

function emit(): void {
  for (const listener of listeners) listener();
}

function normalise(raw: unknown): AppState {
  if (!raw || typeof raw !== "object") return EMPTY_STATE;
  const value = raw as Partial<AppState>;
  return {
    version: 1,
    profile: value.profile ?? null,
    people: Array.isArray(value.people) ? value.people : [],
    moments: Array.isArray(value.moments) ? value.moments : [],
    // 결혼 계획이 생기기 전에 저장된 데이터에는 이 키가 없다. null로 떨어뜨린다.
    marriage: value.marriage ?? null,
    settings: { ...DEFAULT_SETTINGS, ...(value.settings ?? {}) },
  };
}

/**
 * 첫 렌더에서는 빈 상태를 쓰고, 마운트된 뒤에야 localStorage를 읽는다.
 * 서버 HTML과 클라이언트 첫 렌더를 일치시키기 위한 것이다.
 */
function boot(): void {
  if (booted) return;
  booted = true;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) state = normalise(JSON.parse(raw));
  } catch {
    // 저장된 값이 깨졌거나 저장소를 못 쓰는 환경이면 빈 상태로 시작한다.
    state = EMPTY_STATE;
  }
  emit();
}

function persist(): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // 시크릿 모드 등 저장이 막힌 환경에서도 화면은 계속 동작해야 한다.
  }
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): AppState {
  return state;
}

function getServerSnapshot(): AppState {
  return EMPTY_STATE;
}

export function update(mutate: (current: AppState) => AppState): void {
  state = mutate(state);
  persist();
  emit();
}

export function useAppState(): { state: AppState; hydrated: boolean } {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const hydrated = useSyncExternalStore(
    subscribe,
    () => booted,
    () => false,
  );
  useEffect(() => {
    boot();
  }, []);
  return { state: snapshot, hydrated };
}

export function useActions() {
  const saveProfile = useCallback((profile: Profile) => {
    update((current) => ({ ...current, profile }));
  }, []);

  const savePerson = useCallback((person: Person) => {
    update((current) => {
      const exists = current.people.some((p) => p.id === person.id);
      const people = exists
        ? current.people.map((p) => (p.id === person.id ? person : p))
        : [...current.people, person];
      return { ...current, people };
    });
  }, []);

  const removePerson = useCallback((id: string) => {
    update((current) => ({ ...current, people: current.people.filter((p) => p.id !== id) }));
  }, []);

  const saveMoment = useCallback((moment: Moment) => {
    update((current) => {
      const exists = current.moments.some((m) => m.id === moment.id);
      const moments = exists
        ? current.moments.map((m) => (m.id === moment.id ? moment : m))
        : [...current.moments, moment];
      return { ...current, moments };
    });
  }, []);

  const removeMoment = useCallback((id: string) => {
    update((current) => ({ ...current, moments: current.moments.filter((m) => m.id !== id) }));
  }, []);

  const saveMarriage = useCallback((marriage: MarriagePlan) => {
    update((current) => ({ ...current, marriage }));
  }, []);

  const removeMarriage = useCallback(() => {
    update((current) => ({ ...current, marriage: null }));
  }, []);

  const saveSettings = useCallback((settings: Partial<Settings>) => {
    update((current) => ({ ...current, settings: { ...current.settings, ...settings } }));
  }, []);

  const replaceAll = useCallback((next: unknown) => {
    update(() => normalise(next));
  }, []);

  const clearAll = useCallback(() => {
    update(() => EMPTY_STATE);
  }, []);

  return {
    saveProfile,
    savePerson,
    removePerson,
    saveMoment,
    removeMoment,
    saveMarriage,
    removeMarriage,
    saveSettings,
    replaceAll,
    clearAll,
  };
}

export function emptyProfile(): Profile {
  return {
    lifeExpectancy: lookupLifeExpectancy(DEFAULT_COUNTRY_CODE, "all"),
    lifeExpectancyManual: false,
    countryCode: DEFAULT_COUNTRY_CODE,
    sex: "all",
  };
}

export function emptyPerson(): Person {
  const now = new Date().toISOString();
  return {
    id: newId(),
    name: "",
    lifeExpectancy: lookupLifeExpectancy(DEFAULT_COUNTRY_CODE, "all"),
    lifeExpectancyManual: false,
    countryCode: DEFAULT_COUNTRY_CODE,
    sex: "all",
    frequency: { count: 1, unit: "month" },
    filters: [],
    createdAt: now,
    updatedAt: now,
  };
}

/** 목표 나이는 현재 나이보다 뒤여야 의미가 있으므로, 나이를 알면 그 위에서 잡는다. */
export function emptyMarriage(currentAge: number | null): MarriagePlan {
  const base = currentAge === null ? 35 : Math.ceil((currentAge + 5) / 5) * 5;
  return {
    targetAge: Math.min(70, Math.max(20, base)),
    frequency: { count: 1, unit: "month" },
    filters: [],
    updatedAt: new Date().toISOString(),
  };
}

export function emptyMoment(): Moment {
  const now = new Date().toISOString();
  return {
    id: newId(),
    title: "",
    frequency: { count: 1, unit: "year" },
    horizon: { kind: "life" },
    filters: [],
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * 목록 검색. 공백으로 나눈 모든 조각이 어느 필드엔가 들어 있으면 통과시킨다
 * ("어머 메모"처럼 두 단어로 좁히는 검색을 위해).
 */
export function matches(query: string, fields: (string | undefined)[]): boolean {
  const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (terms.length === 0) return true;
  const haystack = fields.filter(Boolean).join(" ").toLowerCase();
  return terms.every((term) => haystack.includes(term));
}

export function exportState(): string {
  return JSON.stringify(state, null, 2);
}

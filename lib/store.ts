"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";

import { todayISO } from "./format";
import { DEFAULT_COUNTRY_CODE, lookupLifeExpectancy, refreshLifeSpan } from "./lifeExpectancy";
import { newId } from "./presets";
import { STORAGE_KEY } from "./storageKey";
import { LANGS } from "./i18n";
import type {
  AppState,
  CalcFilter,
  Frequency,
  MarriagePlan,
  Moment,
  Person,
  Profile,
  Scenario,
  Settings,
} from "./types";

export const DEFAULT_SETTINGS: Settings = {
  tone: "calm",
  theme: "system",
  showPast: true,
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

/*
 * 저장된 기록을 지금 시점에 맞춘다. 두 가지를 손본다.
 *
 * 1) ageAsOf가 없는 옛 기록은 오늘로 채운다. 언제 적어 넣었는지 알 길이 없으니
 *    지금부터 세기 시작한다 — 과거를 지어내는 것보다 낫다. 이 값은 불러온 직후
 *    한 번 저장돼서, 다음부터는 제대로 굴러간다.
 * 2) 직접 고치지 않은 예상 수명은 지금 나이로 다시 구한다.
 */
function refresh<T extends { ageYears?: number; ageAsOf?: string }>(span: T): T {
  const withDate =
    span.ageYears !== undefined && !span.ageAsOf ? { ...span, ageAsOf: todayISO() } : span;
  return refreshLifeSpan(withDate as T & Parameters<typeof refreshLifeSpan>[0]) as T;
}

const UNITS = ["day", "week", "month", "quarter", "year"];
const FILTER_KINDS = ["multiplier", "decay", "window", "cap"];
const TONES = ["calm", "warm", "aware"];
const THEMES = ["system", "light", "dark"];

/*
 * 저장소와 불러온 파일에서 온 기록을 믿지 않는다.
 *
 * 앱이 쓴 기록이라도 옛 버전이 쓴 것일 수 있고, 불러오기는 사람이 고친 파일일 수 있다.
 * 모양이 어긋난 값 하나가 화면을 그리다 터지면(빈도가 없으면 toPerYear에서, 제목이
 * 글자가 아니면 trim에서, 모르는 언어면 문구를 못 찾아서) 그 상태가 저장된 채 열 때마다
 * 오류 화면이 뜬다. 무작위 점검(e2e/fuzz.spec.ts)으로 실제로 찾은 것들이다.
 * 그래서 여기 한 곳에서 걸러 낸다. 고칠 수 있는 건 고치고, 없으면 빼거나 기본값을 쓴다.
 */
type Loose = Record<string, unknown>;

const isObject = (value: unknown): value is Loose =>
  !!value && typeof value === "object" && !Array.isArray(value);
const text = (value: unknown): string | undefined => (typeof value === "string" ? value : undefined);
const oneOf = <T,>(value: unknown, allowed: readonly string[], fallback: T): T =>
  allowed.includes(value as string) ? (value as T) : fallback;

const finite = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value);
const SEXES = ["male", "female", "all"];
const LEVELS = ["good", "mid", "bad"];
const FILTER_NUMBERS = ["factor", "ratePerYear", "fromYear", "toYear", "maxTotal"] as const;

function frequencyOk(value: unknown): boolean {
  return isObject(value) && finite(value.count) && UNITS.includes(value.unit as string);
}

/** 빈도는 음수일 수 없다. 계산은 0으로 보지만 화면에 "주에 -5번"이 찍힌다. */
function fixFrequency(value: unknown): Frequency {
  const f = value as Frequency;
  return { unit: f.unit, count: Math.max(0, f.count) };
}

/** 나이·수명처럼 사람마다 있는 칸. 숫자가 아니면 비우고, 수명은 표에서 다시 채운다. */
function repairSpan<T extends Loose>(item: T): T {
  const health = isObject(item.health)
    ? Object.fromEntries(
        Object.entries(item.health).filter(
          ([key, level]) => ["smoking", "drinking", "exercise"].includes(key) && LEVELS.includes(level as string),
        ),
      )
    : undefined;
  const countryCode = text(item.countryCode);
  const sex = oneOf(item.sex, SEXES, "all" as const);
  const expectancyOk = finite(item.lifeExpectancy) && item.lifeExpectancy > 0 && item.lifeExpectancy <= 150;
  return {
    ...item,
    ageYears: finite(item.ageYears) ? Math.max(0, item.ageYears) : undefined,
    ageAsOf: text(item.ageAsOf),
    birthDate: text(item.birthDate),
    countryCode,
    sex,
    health,
    lifeExpectancy: expectancyOk ? item.lifeExpectancy : lookupLifeExpectancy(countryCode, sex),
    lifeExpectancyManual: expectancyOk && item.lifeExpectancyManual === true,
  };
}

function repairFilters(value: unknown): CalcFilter[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((f): f is Loose => isObject(f) && FILTER_KINDS.includes(f.kind as string))
    .map((f) => ({
      ...(f as unknown as CalcFilter),
      ...Object.fromEntries(FILTER_NUMBERS.map((key) => [key, finite(f[key]) ? f[key] : undefined])),
      mode: oneOf(f.mode, ["only", "except"], undefined),
      id: text(f.id) ?? newId(),
      label: text(f.label) ?? "",
      enabled: f.enabled !== false,
    }));
}

function repairScenarios(value: unknown): Scenario[] | undefined {
  if (!Array.isArray(value)) return undefined;
  return value
    .filter((s): s is Loose => isObject(s) && frequencyOk(s.frequency))
    .map((s) => ({
      id: text(s.id) ?? newId(),
      label: text(s.label) ?? "",
      frequency: fixFrequency(s.frequency),
      filters: repairFilters(s.filters),
    }));
}

/** 인연과 순간이 함께 가진 부분을 고친다. 빈도가 없으면 셀 수가 없으니 뺀다. */
function repairCommon(item: unknown): Loose | null {
  if (!isObject(item) || typeof item.id !== "string" || !frequencyOk(item.frequency)) return null;
  return {
    ...item,
    frequency: fixFrequency(item.frequency),
    filters: repairFilters(item.filters),
    scenarios: repairScenarios(item.scenarios),
    emoji: text(item.emoji),
    note: text(item.note),
    since: text(item.since),
    createdAt: text(item.createdAt) ?? "",
    updatedAt: text(item.updatedAt) ?? "",
  };
}

function repairPerson(raw: unknown): Person | null {
  const item = repairCommon(raw);
  if (!item) return null;
  const h = item.horizon;
  const horizon =
    isObject(h) &&
    (h.kind === "life" || (h.kind === "untilMyAge" && finite(h.age)) || (h.kind === "years" && finite(h.years)))
      ? h
      : undefined;
  const g = item.growth;
  const growth =
    isObject(g) && finite(g.adultAge) && frequencyOk(g.dinners)
      ? { adultAge: g.adultAge, dinners: fixFrequency(g.dinners) }
      : undefined;
  return {
    ...repairSpan(item),
    name: text(item.name) ?? "",
    relation: text(item.relation),
    horizon,
    growth,
  } as unknown as Person;
}

function repairMoment(raw: unknown): Moment | null {
  const item = repairCommon(raw);
  if (!item) return null;
  const h = item.horizon;
  const horizon =
    isObject(h) &&
    (h.kind === "life" || (h.kind === "untilAge" && finite(h.age)) || (h.kind === "years" && finite(h.years)))
      ? h
      : { kind: "life" };
  return { ...item, title: text(item.title) ?? "", horizon } as unknown as Moment;
}

function repairMarriage(raw: unknown): MarriagePlan | null {
  if (!isObject(raw) || !finite(raw.targetAge) || !frequencyOk(raw.frequency)) return null;
  return {
    ...(raw as unknown as MarriagePlan),
    frequency: fixFrequency(raw.frequency),
    filters: repairFilters(raw.filters),
    note: text(raw.note),
    updatedAt: text(raw.updatedAt) ?? "",
  };
}

function repairSettings(raw: unknown): Settings {
  const value = isObject(raw) ? raw : {};
  return {
    tone: oneOf(value.tone, TONES, DEFAULT_SETTINGS.tone),
    theme: oneOf(value.theme, THEMES, DEFAULT_SETTINGS.theme),
    showPast: typeof value.showPast === "boolean" ? value.showPast : DEFAULT_SETTINGS.showPast,
    language: oneOf(value.language, LANGS.map((lang) => lang.value), undefined),
    lastBackupAt: text(value.lastBackupAt),
  };
}

function keep<T>(items: unknown, repair: (raw: unknown) => T | null): T[] {
  if (!Array.isArray(items)) return [];
  return items.map(repair).filter((item): item is T => item !== null);
}

/** 불러오기 파일이 이 앱의 내보내기처럼 생겼는지. 아무 JSON이나 받아 기록을 비우지 않도록. */
export function looksLikeBackup(raw: unknown): boolean {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return false;
  const value = raw as Record<string, unknown>;
  return Array.isArray(value.people) && Array.isArray(value.moments) && "settings" in value;
}

function normalise(raw: unknown): AppState {
  if (!isObject(raw)) return EMPTY_STATE;
  return {
    version: 1,
    profile: isObject(raw.profile) ? refresh(repairSpan(raw.profile) as unknown as Profile) : null,
    people: keep(raw.people, repairPerson).map(refresh),
    moments: keep(raw.moments, repairMoment),
    // 결혼 계획이 생기기 전에 저장된 데이터에는 이 키가 없다. null로 떨어뜨린다.
    marriage: repairMarriage(raw.marriage),
    settings: repairSettings(raw.settings),
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
    if (raw) {
      state = normalise(JSON.parse(raw));
      // 채워 넣은 ageAsOf를 바로 저장해 둔다. 안 그러면 다음에 열 때 또 오늘로
      // 채워져서 나이가 영영 제자리를 맴돈다.
      persist();
    }
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

/*
 * 다른 탭(또는 설치한 앱과 브라우저)에서 저장하면 여기도 따라 읽는다. 안 그러면 늦게
 * 저장하는 쪽이 자기가 들고 있던 옛 상태로 상대가 추가한 것을 지운다.
 */
function onStorage(event: StorageEvent): void {
  if (event.key !== STORAGE_KEY || !booted) return;
  try {
    state = event.newValue ? normalise(JSON.parse(event.newValue)) : EMPTY_STATE;
  } catch {
    return;
  }
  emit();
}

function subscribe(listener: () => void): () => void {
  if (listeners.size === 0 && typeof window !== "undefined") {
    window.addEventListener("storage", onStorage);
  }
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

/*
 * 있는 순간을 본떠 새 순간을 만든다.
 *
 * "강아지 산책"을 강아지별로, "수영"을 장소별로, "만들기"를 공방별로 — 같은 것의
 * 변주를 반복해서 넣게 된다. 매번 빈도와 기간을 다시 고르는 건 같은 일을 두 번 하는
 * 것이다. 조건 필터까지 가져오되, 필터 id는 새로 뽑는다(배열 안에서만 유일하면
 * 되지만, 같은 id가 여기저기 흩어져 있으면 나중에 헷갈린다).
 */
export function momentFrom(source: Moment): Moment {
  const now = new Date().toISOString();
  return {
    ...source,
    id: newId(),
    filters: source.filters.map((filter) => ({ ...filter, id: newId() })),
    createdAt: now,
    updatedAt: now,
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

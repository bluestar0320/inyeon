/*
 * 개인정보 안내 동의.
 *
 * 앱 기록(STORAGE_KEY)과 다른 키에 둔다. 불러오기가 앱 기록을 통째로 바꾸고,
 * 전체 삭제가 기록을 비우고, 망가진 기록은 복구 과정에서 다시 쓰인다 — 그 어느 쪽도
 * 동의를 건드리면 안 된다. 남의 백업 파일로 동의를 건너뛸 수 없게 하는 것도 이 분리다.
 *
 * "use client"를 붙이지 않는다. 단위 테스트가 Node에서 바로 읽는다.
 */

export const CONSENT_KEY = "inyeon.consent";

/** 안내 문구(components/PrivacyText.tsx)를 바꾸면 올린다. 올리면 모두에게 다시 묻는다. */
export const CONSENT_VERSION = 1;

function parse(raw: string | null): { version: number; at: string } | null {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw);
    if (value && typeof value === "object" && typeof value.version === "number" && typeof value.at === "string") {
      return value;
    }
  } catch {
    // 아래로.
  }
  return null;
}

export function needsConsent(raw: string | null): boolean {
  return parse(raw)?.version !== CONSENT_VERSION;
}

export function consentRecord(now: Date): string {
  return JSON.stringify({ version: CONSENT_VERSION, at: now.toISOString() });
}

export function consentDate(raw: string | null): string | null {
  return parse(raw)?.at ?? null;
}

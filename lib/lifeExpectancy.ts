import { resolveAge } from "./calc.ts";
import { healthAgeOffset } from "./health.ts";
import { getLang, locale } from "./i18n.ts";
import { LIFE_TABLE, LIFE_TABLE_AGES, WORLD_LIFE_TABLE } from "./lifeTable.ts";
import type { HealthProfile, LifeSpan, Sex } from "./types";

export interface Country {
  code: string;
  /** 지금 언어의 나라 이름. 한국어는 아래 표기를 그대로, 나머지는 Intl에 맡긴다. */
  readonly name: string;
}

/** 이름만 둔다. 숫자는 전부 생명표(lifeTable.ts)에서 온다. */
const KO_NAMES: [code: string, name: string][] = [
  ["KR", "대한민국"],
  ["JP", "일본"],
  ["CN", "중국"],
  ["TW", "대만"],
  ["HK", "홍콩"],
  ["SG", "싱가포르"],
  ["US", "미국"],
  ["CA", "캐나다"],
  ["GB", "영국"],
  ["FR", "프랑스"],
  ["DE", "독일"],
  ["IT", "이탈리아"],
  ["ES", "스페인"],
  ["NL", "네덜란드"],
  ["SE", "스웨덴"],
  ["NO", "노르웨이"],
  ["DK", "덴마크"],
  ["FI", "핀란드"],
  ["CH", "스위스"],
  ["AU", "호주"],
  ["NZ", "뉴질랜드"],
  ["RU", "러시아"],
  ["PL", "폴란드"],
  ["BR", "브라질"],
  ["MX", "멕시코"],
  ["AR", "아르헨티나"],
  ["IN", "인도"],
  ["ID", "인도네시아"],
  ["TH", "태국"],
  ["VN", "베트남"],
  ["PH", "필리핀"],
  ["TR", "튀르키예"],
  ["SA", "사우디아라비아"],
  ["AE", "아랍에미리트"],
  ["ZA", "남아프리카공화국"],
  ["NG", "나이지리아"],
  ["EG", "이집트"],
];

function countryName(code: string, ko: string): string {
  if (getLang() === "ko") return ko;
  try {
    return new Intl.DisplayNames([locale()], { type: "region" }).of(code) ?? ko;
  } catch {
    return code;
  }
}

export const COUNTRIES: Country[] = KO_NAMES.map(([code, ko]) => ({
  code,
  get name() {
    return countryName(code, ko);
  },
}));

export const DEFAULT_COUNTRY_CODE = "KR";

/** 그 나라의 표를 고른다. 모르면 세계 평균. */
function tableFor(code: string | undefined, sex: Sex | undefined): number[] {
  const country = (code ? LIFE_TABLE[code] : undefined) ?? WORLD_LIFE_TABLE;
  if (sex === "male") return country.male;
  if (sex === "female") return country.female;
  return country.all;
}

/**
 * 그 나이까지 살아온 사람이 앞으로 더 살 것으로 기대되는 햇수.
 *
 * 표는 5년 단위라 사이는 직선으로 잇는다. 마지막 칸(85세) 위로는 바로 앞 구간의
 * 기울기를 이어서 줄이되, 0으로 떨어지지 않게 바닥을 둔다 — 아무리 고령이어도
 * "남은 시간 0년"은 계산으로 낼 값이 아니다.
 */
export function remainingLifeAt(
  code: string | undefined,
  sex: Sex | undefined,
  age: number,
): number {
  const table = tableFor(code, sex);
  const clamped = Math.max(0, age);

  for (let i = 0; i < LIFE_TABLE_AGES.length - 1; i += 1) {
    const from = LIFE_TABLE_AGES[i];
    const to = LIFE_TABLE_AGES[i + 1];
    if (clamped < to) {
      const ratio = (clamped - from) / (to - from);
      return table[i] + (table[i + 1] - table[i]) * ratio;
    }
  }

  const last = LIFE_TABLE_AGES.length - 1;
  const slopePerYear =
    (table[last] - table[last - 1]) / (LIFE_TABLE_AGES[last] - LIFE_TABLE_AGES[last - 1]);
  const beyond = clamped - LIFE_TABLE_AGES[last];
  return Math.max(1.2, table[last] + slopePerYear * beyond);
}

/**
 * 예상 수명(몇 세까지 살 것으로 볼지).
 *
 * 나이를 알면 그 나이의 기대여명을 더해 구한다. 출생 시 기대수명 하나로 모두를
 * 계산하면 나이 든 사람일수록 남은 시간이 실제보다 짧게 나온다.
 * 나이를 모르면 출생 시 기대수명(표의 첫 칸)으로 떨어진다.
 *
 * 생활 습관(health)은 **표를 조회하는 나이만** 밀어 준다. 실제 나이는 그대로 두고
 * "위험이 n세 더 많은 사람과 비슷하다"로 본다. 그래서 같은 흡연자라도 젊을수록
 * 많이 깎이고 고령일수록 덜 깎인다 — 이미 살아낸 몫까지 다시 빼지 않는다.
 * 나이를 모르면 보정할 기준이 없으므로 적용하지 않는다.
 */
export function lookupLifeExpectancy(
  code: string | undefined,
  sex: Sex | undefined,
  age?: number | null,
  health?: HealthProfile,
): number {
  if (age === undefined || age === null || !Number.isFinite(age)) {
    return round1(tableFor(code, sex)[0]);
  }
  const lookupAge = Math.max(0, age + healthAgeOffset(health));
  return round1(age + remainingLifeAt(code, sex, lookupAge));
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

/**
 * 저장된 예상 수명을 지금 나이에 맞게 다시 구한다.
 *
 * lifeExpectancy는 계산값이 아니라 **입력 시점에 한 번 구워진 저장값**이다.
 * 그대로 두면 나이만 늙고 수명은 안 늙어서, 68세가 되면 앱이 13.6년이라고 말한다
 * (맞는 값은 17.1년 — 26% 적다). 정작 설정 화면에서 "이미 68세까지 살아온 분은
 * 평균에 해당하지 않아 더 오래 사신다"고 설명해 놓고, 저장 방식 때문에 그 생명표가
 * 시간이 지나면 무력해지는 셈이었다.
 *
 * 사용자가 직접 고친 값(lifeExpectancyManual)은 건드리지 않는다. 그쪽이 항상 이긴다.
 * 바뀔 게 없으면 같은 객체를 그대로 돌려준다 — 불필요한 다시 그리기를 만들지 않는다.
 */
export function refreshLifeSpan<T extends LifeSpan>(span: T, now?: Date): T {
  if (span.lifeExpectancyManual) return span;
  const age = resolveAge(span, now);
  if (age === null) return span;
  const fresh = lookupLifeExpectancy(span.countryCode, span.sex, age, span.health);
  if (fresh === span.lifeExpectancy) return span;
  return { ...span, lifeExpectancy: fresh };
}

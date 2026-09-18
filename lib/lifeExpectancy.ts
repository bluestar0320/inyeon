import { ESTIMATED_TABLE_COUNTRIES, LIFE_TABLE, LIFE_TABLE_AGES } from "./lifeTable.ts";
import type { Sex } from "./types";

export interface Country {
  code: string;
  /** 한국어 표기. 셀렉트 박스에 그대로 쓴다. */
  name: string;
}

/** 이름만 둔다. 숫자는 전부 생명표(lifeTable.ts)에서 온다. */
export const COUNTRIES: Country[] = [
  { code: "KR", name: "대한민국" },
  { code: "JP", name: "일본" },
  { code: "CN", name: "중국" },
  { code: "TW", name: "대만" },
  { code: "HK", name: "홍콩" },
  { code: "SG", name: "싱가포르" },
  { code: "US", name: "미국" },
  { code: "CA", name: "캐나다" },
  { code: "GB", name: "영국" },
  { code: "FR", name: "프랑스" },
  { code: "DE", name: "독일" },
  { code: "IT", name: "이탈리아" },
  { code: "ES", name: "스페인" },
  { code: "NL", name: "네덜란드" },
  { code: "SE", name: "스웨덴" },
  { code: "NO", name: "노르웨이" },
  { code: "DK", name: "덴마크" },
  { code: "FI", name: "핀란드" },
  { code: "CH", name: "스위스" },
  { code: "AU", name: "호주" },
  { code: "NZ", name: "뉴질랜드" },
  { code: "RU", name: "러시아" },
  { code: "PL", name: "폴란드" },
  { code: "BR", name: "브라질" },
  { code: "MX", name: "멕시코" },
  { code: "AR", name: "아르헨티나" },
  { code: "IN", name: "인도" },
  { code: "ID", name: "인도네시아" },
  { code: "TH", name: "태국" },
  { code: "VN", name: "베트남" },
  { code: "PH", name: "필리핀" },
  { code: "TR", name: "튀르키예" },
  { code: "SA", name: "사우디아라비아" },
  { code: "AE", name: "아랍에미리트" },
  { code: "ZA", name: "남아프리카공화국" },
  { code: "NG", name: "나이지리아" },
  { code: "EG", name: "이집트" },
];

export const DEFAULT_COUNTRY_CODE = "KR";

/** 목록에 없는 국가의 폴백(WHO 세계 평균 기대여명, 2021년 기준 근사치). */
const WORLD_FALLBACK = [71.4, 71.6, 68.0, 63.2, 58.4, 53.7, 49.1, 44.5, 40.0, 35.6, 31.3, 27.2, 23.3, 19.6, 16.2, 13.0, 10.1, 7.6, 5.6];

/** 그 나라의 표를 고른다. 모르면 세계 평균. */
function tableFor(code: string | undefined, sex: Sex | undefined): number[] {
  const country = code ? LIFE_TABLE[code] : undefined;
  if (!country) return WORLD_FALLBACK;
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
 */
export function lookupLifeExpectancy(
  code: string | undefined,
  sex: Sex | undefined,
  age?: number | null,
): number {
  if (age === undefined || age === null || !Number.isFinite(age)) {
    return round1(tableFor(code, sex)[0]);
  }
  return round1(age + remainingLifeAt(code, sex, age));
}

/** 생명표를 빌려 쓴 국가인지(화면에서 근사치라고 밝힌다). */
export function isEstimatedTable(code: string | undefined): boolean {
  return code !== undefined && ESTIMATED_TABLE_COUNTRIES.includes(code);
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

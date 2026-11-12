// 지나온 만남 어림의 숫자 표. 출처와 상태는 docs/superpowers/specs/2026-11-12-past-meetings-design.md 「숫자와 출처」.
// 상태: 확인 / 미확인 / 앱이 정한 값 / 계산.

// 앱이 정한 값(운영자와 정함): 결석·다른 반을 뺀 출석 비율. 150/190.
export const ATTENDANCE = 150 / 190;
// 앱이 정한 값(운영자와 정함): 같이 산 날 중 실제로 만난 비율.
export const LIVE_TOGETHER = 0.9;
export const DAYS_TOGETHER_PER_YEAR = 365 * LIVE_TOGETHER;
// 앱이 정한 값(운영자와 정함): 대학 학년별 주당 만나는 날(1~4학년).
export const UNIVERSITY_DAYS_PER_WEEK = [4, 3, 2, 2];
export const UNIVERSITY_WEEKS = 30;
// 계산: 근로기준법 60조(연차 15일), 공휴일 수를 빼 약 230일.
export const WORK_DAYS_PER_YEAR = 230;
// 앱이 정한 값(운영자와 정함): 따로 사는 조부모님 1년 2번.
// 참고(확인): 따로 사는 부모님 왕래 중윗값은 1년 12번, 한국복지패널 https://www.kihasa.re.kr/api/kihasa/file/download?seq=6321 . 계산은 지금 빈도를 쓰므로 기본값으로 안 쓴다.
export const GRANDPARENT_APART_PER_YEAR = 2;
// 앱이 정한 값(운영자와 정함): 학원 주 2번, 기간을 비워 두면 1년.
export const ACADEMY_DEFAULT = { years: 1, perWeek: 2 };

// 법정 수업일수 220 / 205 / 190. 확인: 초·중등교육법 시행령 45조 1항.
//   https://hangyo.com/mobile/article.html?no=71399 (한국교육신문)
//   https://hangyo.com/mobile/article.html?no=20059 (놀토 월 2회)
//   https://www.jjan.kr/articleAmp/20110614399984 (2012 전면 주5일)
// 2000년 이전 220은 미확인: 2000년 기사의 「현행 220일」만 있어 그 이전도 220으로 둔다.
//   https://hangyo.com/mobile/article.html?no=20636
export function schoolDaysFor(year: number): number {
  if (year <= 2005) return 220;
  if (year <= 2011) return 205;
  return 190;
}
export function schoolMeetingsFor(year: number): number {
  return schoolDaysFor(year) * ATTENDANCE;
}

// 앱이 정한 값: 3월 학년도에 만 6세가 된 해의 다음 해에 입학한다(1993년생 → 2000년).
export const entryYear = (birthYear: number): number => birthYear + 7;
// 입학한 해부터 몇 해째인지 [시작, 끝).
export const stageYears = { elementary: [0, 6], middle: [6, 9], high: [9, 12] };
// 그해 2월에 졸업한다. 독립 나이 기본값도 이 해(앱이 정한 값: 실제 독립 나이 통계 없음).
export const highSchoolEndYear = (birthYear: number): number => birthYear + 19;

const MONTH = 30.44;
// 육군 복무 일수. 확인: 30→26개월(1993.1), 21개월(2011 중단), 18개월(2020.6.15 입대자부터).
//   https://www.seoul.co.kr/news/1991/09/06/19910906001001
//   https://www.korea.kr/news/policyNewsView.do?newsId=148896977
//   https://www.khan.co.kr/article/201808221511001
// 미확인: 1993·2003·2008~2011 단축의 하루 단위 식. 모르는 해는 단축 전의 긴 기간으로 둔다.
//   빼는 값이라 길게 잡아야 숫자가 작게 나온다(보수적).
// 확인: 2017.1.3 입대자 1일 단축, 2주 뒤 입대자 2일… 2021.12 18개월 완료. https://www.wikitree.co.kr/articles/359160
//   이 구간은 그해 1월 1일 입대로 쳐서(가장 길게) 식대로 센다. 18개월보다 짧아지지 않는다.
export function armyServiceDays(enlistYear: number): number {
  if (enlistYear < 1993) return 30 * MONTH;
  if (enlistYear <= 2003) return 26 * MONTH;
  if (enlistYear <= 2010) return 24 * MONTH;
  if (enlistYear <= 2016) return 21 * MONTH;
  if (enlistYear <= 2020) {
    const since = Date.UTC(2017, 0, 3), jan1 = Date.UTC(enlistYear, 0, 1);
    const cut = jan1 < since ? 1 : Math.floor((jan1 - since) / 86400000 / 14) + 1;
    return Math.max(18 * MONTH, 21 * MONTH - cut);
  }
  return 18 * MONTH;
}

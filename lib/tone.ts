import type { LimitedBy } from "./calc";
import type { Tone } from "./types";

/**
 * 같은 숫자라도 문장에 따라 무게가 달라진다. 계산 결과는 건드리지 않고 문구만
 * 고른다. calm은 담담하게, aware는 유한함을 또렷하게 드러낸다.
 */
export interface ToneCopy {
  label: string;
  description: string;
  /** 대시보드 인사말. */
  greeting: string;
  /** 인연 카드의 숫자 위에 붙는 라벨. */
  meetingLabel: string;
  /** 순간 카드의 숫자 위에 붙는 라벨. */
  momentLabel: string;
  /** 내 남은 시간 카드 라벨. */
  lifeLabel: string;
  /** 결혼 계획 카드의 숫자 위에 붙는 라벨. */
  marriageLabel: string;
  meetingSentence: (name: string, count: string) => string;
  momentSentence: (title: string, count: string) => string;
  marriageSentence: (targetAge: number, count: string) => string;
  limitedBySentence: (limitedBy: LimitedBy, name: string) => string;
  emptyPeople: string;
  emptyMoments: string;
  emptyMarriage: string;
}

const CALM: ToneCopy = {
  label: "담담하게",
  description: "숫자를 계획의 재료로 다룹니다.",
  greeting: "앞으로 남은 것들을 세어 봅니다.",
  meetingLabel: "앞으로 만날 수 있는 횟수",
  momentLabel: "앞으로 할 수 있는 횟수",
  lifeLabel: "앞으로 남은 시간",
  marriageLabel: "앞으로 만날 수 있는 사람",
  meetingSentence: (name, count) => `${name}와(과) 앞으로 ${count}번 만날 수 있어요.`,
  momentSentence: (title, count) => `${title}은(는) 앞으로 ${count}번 할 수 있어요.`,
  marriageSentence: (targetAge, count) =>
    `${targetAge}세까지 새로운 사람을 ${count}번 만날 수 있어요.`,
  limitedBySentence: (limitedBy, name) => {
    if (limitedBy === "me") return "이 횟수는 내 남은 시간이 기준이에요.";
    if (limitedBy === "them") return `이 횟수는 ${name}의 남은 시간이 기준이에요.`;
    if (limitedBy === "both") return "두 사람의 남은 시간이 비슷해요.";
    if (limitedBy === "horizon") return "이 횟수는 정해 둔 목표 시점이 기준이에요.";
    return "나이를 채우면 기준이 되는 쪽을 알려드려요.";
  },
  emptyPeople: "자주 만나는 사람부터 한 명 적어 보세요.",
  emptyMoments: "올해 꼭 하고 싶은 일을 하나 적어 보세요.",
  emptyMarriage: "목표로 하는 나이가 있다면 세어 볼 수 있어요.",
};

const AWARE: ToneCopy = {
  label: "또렷하게",
  description: "남은 횟수가 유한하다는 걸 분명히 드러냅니다.",
  greeting: "남은 횟수는 이미 정해져 있습니다.",
  meetingLabel: "남은 만남",
  momentLabel: "남은 횟수",
  lifeLabel: "남은 시간",
  marriageLabel: "남은 기회",
  meetingSentence: (name, count) => `${name}와(과) 남은 만남, ${count}번.`,
  momentSentence: (title, count) => `${title}, 남은 횟수 ${count}번.`,
  marriageSentence: (targetAge, count) => `${targetAge}세까지 남은 기회, ${count}번.`,
  limitedBySentence: (limitedBy, name) => {
    if (limitedBy === "me") return "먼저 끝나는 쪽은 내 시간입니다.";
    if (limitedBy === "them") return `먼저 끝나는 쪽은 ${name}의 시간입니다.`;
    if (limitedBy === "both") return "두 사람의 시간이 거의 동시에 끝납니다.";
    if (limitedBy === "horizon") return "수명보다 목표 시점이 먼저 옵니다.";
    return "나이를 채우면 어느 쪽이 먼저 끝나는지 계산됩니다.";
  },
  emptyPeople: "아직 아무도 세지 않았습니다.",
  emptyMoments: "아직 아무것도 세지 않았습니다.",
  emptyMarriage: "목표 나이를 정하면 남은 기회가 계산됩니다.",
};

export const TONES: Record<Tone, ToneCopy> = { calm: CALM, aware: AWARE };

export function copyFor(tone: Tone): ToneCopy {
  return TONES[tone] ?? CALM;
}

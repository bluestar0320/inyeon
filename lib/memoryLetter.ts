import { isElder } from "./birthdays.ts";
import { hasFinal, josa } from "./format.ts";
import { defineCopy, locale, tr } from "./i18n.ts";
import type { Person } from "./types";

/*
 * 기억으로 쓰는 편지. 「만났어요」 뒤에 남긴 한 줄들을 모아, 그 사람에게 쓰는 편지 한 장으로 돌려준다.
 * 날짜 목록(일지)이 아니라 편지다: 부르는 말 → 안부 → 기억을 이어 쓴 한 문단 → 맺음 → 날짜·이름.
 * 기억 문장은 지어내지 않는다 — 앱은 "3월엔" 같은 이음말과 앞뒤 인사만 붙인다.
 * 지난 1년(오늘 포함 365일) 안의 기억이 두 줄은 있어야 편지가 된다.
 */

export const LETTER_MIN = 2;

export interface MemoryLetter {
  greeting: string;
  /** 안부 문단. */
  open: string;
  /** 기억 문단을 이루는 문장들(이음말 포함). 이어 붙여 한 문단으로 쓴다. */
  memories: string[];
  /** 맺음 문단. */
  close: string;
  date: string;
  /** "청규 올림". 부르는 이름이 없으면 null — 날짜만 남긴다. */
  from: string | null;
}

/** 열 번까지는 우리말로 센다. 편지에 "6번"보다 "여섯 번"이 자연스럽다. */
const KO_COUNT = ["", "한", "두", "세", "네", "다섯", "여섯", "일곱", "여덟", "아홉", "열"];

const COPY = defineCopy({
  ko: {
    greeting: (name: string, elder: boolean) => (elder ? `사랑하는 ${name}께` : `${name}에게`),
    open: (name: string, n: number, elder: boolean) => {
      const times = n <= 10 ? `${KO_COUNT[n]} 번` : `${n}번`;
      return elder
        ? `${name}, 잘 지내셨어요? 지난 1년 동안 ${josa(name, "와/과")} 보낸 날을 세어 봤어요. ${times}이더라고요.`
        : `${name}, 잘 지냈어요? 지난 1년 동안 우리가 만난 날을 세어 보니 ${times}이더라고요.`;
    },
    month: (m: number, lastYear: boolean) => `${lastYear ? "작년 " : ""}${m}월엔`,
    close: (elder: boolean): string =>
      elder
        ? "그날그날 적어 두길 잘했다 싶어요. 남은 날들도 이렇게 한 줄씩 채워 갈게요. 늘 건강하세요."
        : "그날그날 적어 두길 잘했다 싶어요. 남은 날들도 이렇게 한 줄씩 채워 가요. 또 만나요.",
    // 친구에게는 "청규가", "민정이가". 받침을 모르는 이름(영문 등)은 이름만.
    from: (me: string, elder: boolean) => {
      if (elder) return `${me} 올림`;
      const final = hasFinal(me);
      return final === null ? me : `${me}${final ? "이가" : "가"}`;
    },
  },
  en: {
    greeting: (name) => `Dear ${name},`,
    open: (_name, n) => `How have you been? I counted the days we spent together this past year — ${n} of them.`,
    month: (m, lastYear) => `${lastYear ? "Last" : "In"} ${new Date(2000, m - 1, 1).toLocaleDateString("en-US", { month: "long" })},`,
    close: () => "I’m glad I wrote them down. I’ll keep adding a line for the days ahead. Take care.",
    from: (me) => `With love, ${me}`,
  },
  ja: {
    greeting: (name) => `${name}へ`,
    open: (_name, n) => `お元気ですか。この一年、一緒に過ごした日を数えてみたら${n}回でした。`,
    month: (m, lastYear) => `${lastYear ? "去年の" : ""}${m}月は、`,
    close: () => "書きとめておいてよかったと思います。これからの日々も一行ずつ書いていきます。どうかお元気で。",
    from: (me) => `${me}より`,
  },
  es: {
    greeting: (name) => `Para ${name}:`,
    open: (_name, n) => `¿Cómo estás? Conté los días que pasamos juntos este último año: fueron ${n}.`,
    month: (m, lastYear) => `${lastYear ? "El pasado" : "En"} ${new Date(2000, m - 1, 1).toLocaleDateString("es", { month: "long" })},`,
    close: () => "Me alegra haberlos escrito. Seguiré sumando una línea por cada día que venga. Cuídate mucho.",
    from: (me) => `Con cariño, ${me}`,
  },
  zh: {
    greeting: (name) => `亲爱的${name}：`,
    open: (_name, n) => `最近好吗？我数了数这一年我们一起度过的日子，一共${n}次。`,
    month: (m, lastYear) => `${lastYear ? "去年" : ""}${m}月，`,
    close: () => "幸好都记了下来。接下来的日子，我也会这样一句一句写下去。多保重。",
    from: (me) => me,
  },
});

const DAY = 86_400_000;
const CJK = /^(ja|zh)/;

/** 오늘(YYYY-MM-DD)로부터 365일 안의 날짜인지. */
function withinYear(iso: string, today: string): boolean {
  const diff = Date.parse(`${today}T00:00:00Z`) - Date.parse(`${iso}T00:00:00Z`);
  return diff >= 0 && diff < 365 * DAY;
}

/** 사용자가 마침표 없이 적었으면 붙인다. */
function endSentence(text: string, cjk: boolean): string {
  return /[.!?。！？…~)」』"']$/.test(text) ? text : `${text}${cjk ? "。" : "."}`;
}

export function memoryLetter(
  person: Pick<Person, "name" | "relation" | "meetings" | "memories">,
  today: string,
  me?: string,
): MemoryLetter | null {
  const memories = (person.memories ?? []).filter((m) => withinYear(m.date, today)).sort((a, b) => a.date.localeCompare(b.date));
  if (memories.length < LETTER_MIN) return null;
  // 기억은 만난 날에만 남기지만, 기록을 지웠을 수도 있으니 기억 수보다 적게 세지 않는다.
  const met = Math.max(memories.length, (person.meetings ?? []).filter((d) => withinYear(d, today)).length);
  const t = tr(COPY);
  const elder = isElder(person);
  const cjk = CJK.test(locale());

  // 같은 달에 여러 줄이면 이음말은 처음 한 번만.
  let prev = "";
  const body = memories.map((m) => {
    const key = m.date.slice(0, 7);
    const lead = key === prev ? "" : `${t.month(Number(m.date.slice(5, 7)), m.date.slice(0, 4) !== today.slice(0, 4))}${cjk ? "" : " "}`;
    prev = key;
    return lead + endSentence(m.text, cjk);
  });

  const name = me?.trim();
  return {
    greeting: t.greeting(person.name, elder),
    open: t.open(person.name, met, elder),
    memories: body,
    close: t.close(elder),
    date: new Date(`${today}T00:00:00`).toLocaleDateString(locale(), { year: "numeric", month: "long" }),
    from: name ? t.from(name, elder) : null,
  };
}

/** 기억 문장들을 한 문단으로. 한·영·스페인어는 띄우고, 일·중은 붙인다. */
export function memoryParagraph(memories: string[]): string {
  return memories.join(CJK.test(locale()) ? "" : " ");
}

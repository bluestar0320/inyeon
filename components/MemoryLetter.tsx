"use client";

import ShareButton from "@/components/ShareButton";
import { UPCOMING_DAYS, nextBirthday } from "@/lib/birthdays";
import { defineCopy, tr } from "@/lib/i18n";
import { memoryLetter, memoryParagraph } from "@/lib/memoryLetter";
import { useAppState } from "@/lib/store";
import type { Person } from "@/lib/types";
import { useToday } from "@/lib/useToday";

const COPY = defineCopy({
  ko: { open: "지난 1년의 기억, 편지로 읽기", file: "기억편지" },
  en: { open: "Read this past year’s memories as a letter", file: "memory-letter" },
  ja: { open: "この一年の思い出を手紙で読む", file: "思い出の手紙" },
  es: { open: "Leer los recuerdos del año como una carta", file: "carta-de-recuerdos" },
  zh: { open: "把这一年的回忆读成一封信", file: "回忆信" },
});

/*
 * 남긴 한 줄들을 그 사람에게 쓰는 편지로 돌려준다. 기억이 두 줄은 있어야 나온다.
 * 생일이 2주 안이면 펼친 채로 — 그때 건네라고.
 */
export default function MemoryLetter({ person }: { person: Person }) {
  const t = tr(COPY);
  const today = useToday();
  const { state } = useAppState();
  const letter = memoryLetter(person, today, state.profile?.nickname);
  if (!letter) return null;
  const soon = (nextBirthday(person.birthDate)?.days ?? Infinity) <= UPCOMING_DAYS;

  return (
    <details data-testid="memory-letter" open={soon} className="group">
      <summary className="cursor-pointer list-none rounded-2xl border border-ink-200/70 bg-surface px-4 py-3 text-sm font-medium text-ink-800">
        {t.open}
      </summary>
      <div className="mt-3 space-y-3">
        <div className="letter letter-ruled space-y-8 break-keep">
          <p>{letter.greeting}</p>
          <p>{letter.open}</p>
          <p>{memoryParagraph(letter.memories)}</p>
          <p>{letter.close}</p>
          <p className="text-right text-ink-600">
            {letter.date}
            {letter.from && (
              <>
                <br />
                {letter.from}
              </>
            )}
          </p>
        </div>
        <ShareButton spec={{ title: person.name, value: "", unit: "" }} fileNameParts={[person.name, t.file]} letter={letter} />
      </div>
    </details>
  );
}

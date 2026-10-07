"use client";

import Link from "next/link";

import { defineCopy, tr } from "@/lib/i18n";
import { useActions, useAppState } from "@/lib/store";
import type { Story } from "@/lib/story";
import { TONE_ORDER, copyFor } from "@/lib/tone";

const COPY = defineCopy({
  ko: { assumed: "스무 살까지 함께 살았다고 치면", change: "바꾸기", tone: "말투" },
  en: { assumed: "Assuming you lived together until 20", change: "Change", tone: "Tone" },
  ja: { assumed: "20歳まで一緒に暮らしたとすると", change: "変える", tone: "言い方" },
  es: { assumed: "Suponiendo que vivisteis juntos hasta los 20", change: "Cambiar", tone: "Tono" },
  zh: { assumed: "假设你20岁前和对方住在一起", change: "修改", tone: "语气" },
});

/**
 * 큰 숫자 아래의 짧은 이야기. 그때 → 지금 → 오늘, 그리고 지나간 비율.
 * 말투 바꾸기는 다시 들어온 사람에게만 — 처음 결과를 보는 사람의 눈을 흩뜨리지 않는다.
 */
export default function StoryLines({
  story,
  personId,
  returning,
}: {
  story: Story;
  personId: string;
  returning: boolean;
}) {
  const t = tr(COPY);
  const { state } = useAppState();
  const { saveSettings } = useActions();

  return (
    <div data-testid="story" className="space-y-3 text-[15px] leading-relaxed text-ink-800">
      {story.cheer && (
        <p data-testid="story-cheer" className="font-medium text-accent-600">
          {story.cheer}
        </p>
      )}
      {/* 그때 · 지금 · 오늘은 한 사람이 이어 말하듯 한 문단으로 붙인다. */}
      <p>
        {story.then && <span data-testid="story-then">{story.then} </span>}
        {story.now && <span data-testid="story-now">{story.now} </span>}
        {story.today && (
          <span data-testid="story-today" className="font-medium">
            {story.today}
          </span>
        )}
      </p>
      {story.past && (
        <div>
          <p data-testid="story-past">{story.past}</p>
          {story.assumed && (
            <p className="mt-0.5 text-[11px] text-ink-400">
              {t.assumed} ·{" "}
              <Link href={`/people/edit?id=${personId}`} prefetch={false} className="underline">
                {t.change}
              </Link>
            </p>
          )}
        </div>
      )}
      {returning && (
        <div data-testid="story-tone" className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-ink-400">
          <span>{t.tone}</span>
          {TONE_ORDER.map((tone) => {
            const active = state.settings.tone === tone;
            return (
              <button
                key={tone}
                type="button"
                aria-pressed={active}
                className={active ? "font-semibold text-ink-800" : "underline"}
                onClick={() => saveSettings({ tone })}
              >
                {copyFor(tone).label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

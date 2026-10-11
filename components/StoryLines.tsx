"use client";

import Link from "next/link";
import { useState } from "react";

import { count } from "@/lib/analytics";
import { getLang, defineCopy, locale, tr } from "@/lib/i18n";
import { messageFor } from "@/lib/message";
import { isNativeApp } from "@/lib/nativeShare";
import { useActions, useAppState } from "@/lib/store";
import { hash, relationKind, type Story } from "@/lib/story";
import { TONE_ORDER, copyFor } from "@/lib/tone";

const COPY = defineCopy({
  ko: { assumed: "스무 살까지 함께 살았다고 치면", change: "바꾸기", tone: "말투", send: (name: string, elder: boolean) => `${name}${elder ? "께" : "에게"} 한마디 보내기`, copied: "보낼 말을 복사했어요. 메신저에 붙여 넣으세요." },
  en: { assumed: "Assuming you lived together until you were 20", change: "Change", tone: "Tone", send: (name) => `Send ${name} a message`, copied: "Copied. Paste it into your messenger." },
  ja: { assumed: "20歳まで一緒に暮らしたとすると", change: "変える", tone: "言い方", send: (name) => `${name}にひと言送る`, copied: "コピーしました。メッセージに貼り付けてください。" },
  es: { assumed: "Suponiendo que viviste con ellos hasta los 20", change: "Cambiar", tone: "Tono", send: (name) => `Mandar un mensaje a ${name}`, copied: "Copiado. Pégalo en tu app de mensajes." },
  zh: { assumed: "假设你20岁前和对方住在一起", change: "修改", tone: "语气", send: (name) => `给${name}发句话`, copied: "已复制，粘贴到聊天软件里发送吧。" },
});

/**
 * 큰 숫자 아래의 짧은 이야기. 그때 → 지금 → 오늘, 그리고 지나간 비율.
 * 말투 바꾸기는 다시 들어온 사람에게만 — 처음 결과를 보는 사람의 눈을 흩뜨리지 않는다.
 */
export default function StoryLines({
  story,
  personId,
  returning,
  person,
}: {
  story: Story;
  personId: string;
  returning: boolean;
  /** 인연이면 편지 끝에 「한마디 보내기」를 붙인다. 순간에는 없다. */
  person?: { name: string; relation?: string };
}) {
  const t = tr(COPY);
  const [copied, setCopied] = useState(false);
  const rel = relationKind(person?.relation);

  /*
   * 그 사람에게 보낼 첫 문장을 공유 창에 담아 띄운다. 메신저에서 고쳐 보내면 된다.
   * 공유 창이 없으면(데스크톱 브라우저) 복사해 둔다.
   */
  async function send(): Promise<void> {
    if (!person) return;
    const text = messageFor(getLang(), rel, person.name, hash(`${personId}${new Date().toDateString()}`));
    count({ event: "send-message" });
    try {
      if (isNativeApp()) {
        const { Share } = await import("@capacitor/share");
        await Share.share({ text });
        return;
      }
      if (navigator.share) {
        await navigator.share({ text });
        return;
      }
      await navigator.clipboard.writeText(text);
      setCopied(true);
    } catch {
      // 공유 창을 닫은 것도 여기로 온다 — 실패가 아니다.
    }
  }
  const { state } = useAppState();
  const { saveSettings } = useActions();

  return (
    // 편지 한 장. 이 앱에서 마음이 움직이는 곳이 여기라, 화면 속 상자가 아니라 받은 편지처럼 보이게 한다.
    <div data-testid="story" className="letter space-y-3 leading-relaxed">
      <p className="text-right text-xs text-ink-400">
        {new Date().toLocaleDateString(locale(), { year: "numeric", month: "long", day: "numeric" })}
      </p>
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
      {person && (
        <div className="pt-1">
          <button type="button" data-testid="send-message" className="btn-secondary w-full" onClick={() => void send()}>
            {t.send(person.name, rel === "parent" || rel === "grandparent")}
          </button>
          {copied && <p className="mt-1 text-center text-[11px] text-ink-600" role="status">{t.copied}</p>}
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

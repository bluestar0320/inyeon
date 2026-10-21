"use client";

import { useState } from "react";

import { isElder } from "@/lib/birthdays";
import { defineCopy, tr } from "@/lib/i18n";
import { SAYING_MAX_LENGTH, SAYING_MAX_LINES, cleanSaying, pickSaying } from "@/lib/meetings";
import { useActions } from "@/lib/store";
import type { Person } from "@/lib/types";
import { useToday } from "@/lib/useToday";

const COPY = defineCopy({
  ko: {
    add: (elder: boolean): string => (elder ? "자주 하시는 말 적기" : "자주 하는 말 적기"),
    label: (elder: boolean): string => (elder ? "자주 하시는 말" : "자주 하는 말"),
    placeholder: "예: 밥은 먹고 다니니?",
    hint: "여러 마디면 한 줄에 하나씩. 날마다 돌아가며 보여요.",
    keep: "남기기",
    cancel: "취소",
    edit: "고치기",
  },
  en: {
    add: () => "Add something they often say",
    label: () => "Something they often say",
    placeholder: "e.g. Have you eaten?",
    hint: "Several? One per line — a different one shows each day.",
    keep: "Save",
    cancel: "Cancel",
    edit: "Edit",
  },
  ja: {
    add: () => "よく言う言葉を書く",
    label: () => "よく言う言葉",
    placeholder: "例：ちゃんとご飯食べてる？",
    hint: "いくつかあれば一行にひとつずつ。日ごとに入れ替わります。",
    keep: "残す",
    cancel: "やめる",
    edit: "直す",
  },
  es: {
    add: () => "Anotar algo que suele decir",
    label: () => "Algo que suele decir",
    placeholder: "Ej.: ¿Ya comiste?",
    hint: "Si son varias, una por línea: cada día se muestra otra.",
    keep: "Guardar",
    cancel: "Cancelar",
    edit: "Editar",
  },
  zh: {
    add: () => "写下常说的话",
    label: () => "常说的话",
    placeholder: "例：吃饭了没？",
    hint: "有好几句的话，一行写一句，每天轮流显示。",
    keep: "留下",
    cancel: "取消",
    edit: "修改",
  },
});

/*
 * 폴라로이드 아래, 그 사람이 자주 하는 말 한 줄. 사용자가 적은 그대로만 보여 준다.
 * 칸을 늘 펼쳐 두지 않는다 — 비어 있으면 작은 링크 하나, 적으면 따옴표 속 손글씨.
 * 여러 줄을 적으면 날마다 한 줄씩 돌아가며 보인다.
 */
export default function Saying({ person }: { person: Person }) {
  const t = tr(COPY);
  const { savePerson } = useActions();
  const elder = isElder(person);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const today = useToday();
  const save = (saying: string | undefined) => savePerson({ ...person, saying, updatedAt: new Date().toISOString() });

  if (editing) {
    return (
      <form
        className="mx-auto max-w-sm space-y-2"
        onSubmit={(e) => {
          e.preventDefault();
          save(cleanSaying(draft));
          setEditing(false);
        }}
      >
        <label htmlFor={`saying-${person.id}`} className="block text-center text-xs text-ink-600">
          {t.label(elder)}
        </label>
        <textarea
          id={`saying-${person.id}`}
          className="input text-center"
          rows={Math.min(SAYING_MAX_LINES, Math.max(2, draft.split("\n").length))}
          value={draft}
          maxLength={(SAYING_MAX_LENGTH + 4) * SAYING_MAX_LINES}
          placeholder={t.placeholder}
          autoComplete="off"
          autoFocus
          onChange={(e) => setDraft(e.target.value)}
        />
        <p className="text-center text-[11px] text-ink-400">{t.hint}</p>
        <div className="flex justify-center gap-2">
          <button type="button" className="btn-secondary" onClick={() => setEditing(false)}>
            {t.cancel}
          </button>
          <button type="submit" className="btn-primary">
            {t.keep}
          </button>
        </div>
      </form>
    );
  }

  const open = () => {
    setDraft(person.saying ?? "");
    setEditing(true);
  };
  const shown = pickSaying(person.saying, today);
  if (!shown) {
    return (
      <div className="flex justify-center text-xs text-ink-400">
        <button type="button" className="underline" onClick={open}>
          {t.add(elder)}
        </button>
      </div>
    );
  }
  return (
    <figure className="px-4 text-center">
      <blockquote data-testid="saying" className="font-album break-keep text-base text-ink-800">
        “{shown}”
      </blockquote>
      <figcaption className="mt-1 text-xs text-ink-400">
        {t.label(elder)} ·{" "}
        <button type="button" className="underline" onClick={open}>
          {t.edit}
        </button>
      </figcaption>
    </figure>
  );
}

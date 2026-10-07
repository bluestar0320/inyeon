"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import ConsentCheck, { useConsent } from "@/components/ConsentCheck";
import EditConflict, { confirmOverwrite, type Conflict } from "@/components/EditConflict";
import LifeSpanFields from "@/components/LifeSpanFields";
import { remainingYears } from "@/lib/calc";
import { formatYears } from "@/lib/format";
import { defineCopy, tr } from "@/lib/i18n";
import { emptyProfile, useActions, useAppState } from "@/lib/store";
import { confirmLeave, useUnsavedGuard, leaveTo, blockImeEnter } from "@/lib/unsaved";
import type { Profile } from "@/lib/types";

const COPY = defineCopy({
  ko: {
    title: "내 정보",
    subtitle: "내 나이 하나면 시작할 수 있어요. 부모님과 남은 만남까지, 30초면 셉니다.",
    nickname: "부르는 이름 (선택)",
    nicknamePlaceholder: '비워 두면 "당신"이라고 불러요.',
    ageLabel: "내 나이",
    remaining: "앞으로 남은 시간",
    save: "저장하기",
    cancel: "취소",
    needAge: "생년월일이나 나이를 먼저 채워 주세요.",
  },
  en: {
    title: "My details",
    subtitle: "Your age is all it takes to start. In 30 seconds you’ll see the visits left with your parents.",
    nickname: "What should we call you? (optional)",
    nicknamePlaceholder: 'Leave it blank and we’ll just say "you".',
    ageLabel: "My age",
    remaining: "Time ahead",
    save: "Save",
    cancel: "Cancel",
    needAge: "Please enter your date of birth or age first.",
  },
  ja: {
    title: "自分の情報",
    subtitle: "自分の年齢だけで始められます。親と会える残りの回数まで、30秒で数えます。",
    nickname: "呼び名(任意)",
    nicknamePlaceholder: '空欄なら「あなた」と呼びます。',
    ageLabel: "自分の年齢",
    remaining: "これからの時間",
    save: "保存する",
    cancel: "キャンセル",
    needAge: "先に生年月日か年齢を入力してください。",
  },
  es: {
    title: "Mis datos",
    subtitle: "Basta con tu edad para empezar. En 30 segundos verás las veces que te quedan con tus padres.",
    nickname: "¿Cómo te llamamos? (opcional)",
    nicknamePlaceholder: 'Si lo dejas vacío, te hablaremos de "tú".',
    ageLabel: "Mi edad",
    remaining: "Tiempo por delante",
    save: "Guardar",
    cancel: "Cancelar",
    needAge: "Primero indica tu fecha de nacimiento o tu edad.",
  },
  zh: {
    title: "我的信息",
    subtitle: "只要填年龄就能开始。30秒就能算出和父母还能见几次。",
    nickname: "怎么称呼你(选填)",
    nicknamePlaceholder: '不填就称呼“你”。',
    ageLabel: "我的年龄",
    remaining: "今后的时间",
    save: "保存",
    cancel: "取消",
    needAge: "请先填写出生日期或年龄。",
  },
});

export default function SetupPage() {
  const t = tr(COPY);
  const router = useRouter();
  const { state, hydrated } = useAppState();
  const { saveProfile } = useActions();
  const [draft, setDraft] = useState<Profile>(emptyProfile);
  const [loaded, setLoaded] = useState(false);
  // 편집을 시작할 때의 내 정보. 다른 창에서 바뀌었는지 견주는 기준이자, "안 저장됨"을
  // 가리는 기준이다. 지금 저장된 값과 견주면 다른 창에서 바꾼 것만으로 이 화면이
  // "저장하지 않은 변경이 있다"고 물었다.
  const [started, setStarted] = useState<string | null>(null);
  const savedHere = useRef(false);

  // 저장된 프로필은 하이드레이션 뒤에야 들어오므로, 한 번만 폼에 옮겨 담는다.
  useEffect(() => {
    if (!hydrated || loaded) return;
    if (state.profile) setDraft(state.profile);
    setStarted(JSON.stringify(state.profile));
    setLoaded(true);
  }, [hydrated, loaded, state.profile]);

  const remaining = remainingYears(draft);

  const baseline: Profile = (started && JSON.parse(started)) ?? emptyProfile();
  const dirty = loaded && JSON.stringify(baseline) !== JSON.stringify(draft);
  useUnsavedGuard(dirty);

  const conflict: Conflict =
    !loaded || savedHere.current || JSON.stringify(state.profile) === started
      ? null
      : state.profile === null
        ? "deleted"
        : "changed";

  const consent = useConsent();

  function save(): void {
    if (remaining === null || consent.blocking || !confirmOverwrite(conflict)) return;
    consent.commit();
    savedHere.current = true;
    saveProfile(draft);
    /*
     * 사람을 때리는 건 "47년"이 아니라 "엄마 232번"이다.
     * 그런데 저장하고 빈 홈으로 보내면 약한 숫자를 먼저 보여주고, 센 숫자는
     * 사용자가 알아서 두 화면을 더 거쳐야 나온다. 처음 들어온 사람은
     * 거기서 멈춘다. 그래서 첫 설정일 때만 바로 첫 인연을 세우러 보낸다.
     * 나중에 내 정보를 고치러 다시 온 경우는 그대로 홈으로 돌아간다.
     */
    const first = state.profile === null && state.people.length === 0;
    leaveTo(router, first ? "/people/new" : "/");
  }

  return (
    // form: 입력 칸에서 Enter를 누르면 저장한다(저장 단추가 type="submit").
    <form
      className="space-y-5"
      noValidate
      onKeyDown={blockImeEnter}
      onSubmit={(event) => {
        event.preventDefault();
        save();
      }}
    >
      <div className="pt-2">
        <h1 className="text-xl font-semibold tracking-tight text-ink-900">{t.title}</h1>
        <p className="mt-1 text-sm text-ink-400">
          {t.subtitle}
        </p>
      </div>

      <EditConflict conflict={conflict} />

      <div className="card space-y-4">
        {/* 선택 칸. 비워도 저장된다 — 이야기 문장에서 "당신" 대신 부를 이름일 뿐이다. */}
        <div>
          <label className="label" htmlFor="setup-nickname">
            {t.nickname}
          </label>
          <input
            id="setup-nickname"
            className="input"
            maxLength={20}
            value={draft.nickname ?? ""}
            placeholder={t.nicknamePlaceholder}
            onChange={(e) => setDraft({ ...draft, nickname: e.target.value || undefined })}
          />
        </div>
        <LifeSpanFields value={draft} onChange={setDraft} ageLabel={t.ageLabel} showHealth />
      </div>

      {/* 나이를 넣기 전에는 비워 둔 상자를 띄우지 않는다. 넣는 순간 숫자가 나타난다. */}
      {remaining !== null && (
        <div className="card">
          <p className="text-xs font-medium text-ink-400">{t.remaining}</p>
          <p className="numeral mt-1 text-4xl text-ink-900">{formatYears(remaining)}</p>
        </div>
      )}

      <div className="flex gap-2">
        <button
          type="submit"
          className="btn-primary"
          disabled={remaining === null || consent.blocking}
        >
          {t.save}
        </button>
        {state.profile && (
          <button
            type="button"
            className="btn-secondary"
            onClick={() => {
              if (!confirmLeave()) return;
              leaveTo(router, "/");
            }}
          >
            {t.cancel}
          </button>
        )}
      </div>
      <ConsentCheck consent={consent} />
      {remaining === null && (
        <p className="px-1 text-xs text-ink-600">{t.needAge}</p>
      )}
    </form>
  );
}

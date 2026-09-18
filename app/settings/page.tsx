"use client";

import { useRef, useState } from "react";

import { exportState, useActions, useAppState } from "@/lib/store";
import { offerUndo } from "@/lib/undo";
import { TONES } from "@/lib/tone";
import type { Theme, Tone } from "@/lib/types";

const THEMES: { value: Theme; label: string }[] = [
  { value: "system", label: "시스템" },
  { value: "light", label: "밝게" },
  { value: "dark", label: "어둡게" },
];

export default function SettingsPage() {
  const { state, hydrated } = useAppState();
  const { saveSettings, replaceAll, clearAll } = useActions();
  const fileRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [confirmingClear, setConfirmingClear] = useState(false);

  if (!hydrated) {
    return <p className="py-12 text-center text-sm text-ink-400">불러오는 중…</p>;
  }

  function download(): void {
    const blob = new Blob([exportState()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `인연계산기-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  async function importFile(file: File): Promise<void> {
    try {
      replaceAll(JSON.parse(await file.text()));
      setMessage("불러왔습니다.");
    } catch {
      setMessage("파일을 읽지 못했습니다. 내보내기로 만든 JSON인지 확인해 주세요.");
    }
  }

  return (
    <div className="space-y-5">
      <h1 className="pt-2 text-xl font-semibold tracking-tight text-ink-900">설정</h1>

      <section className="card space-y-3">
        <div>
          <p className="text-sm font-semibold text-ink-800">숫자의 무게</p>
          <p className="mt-1 text-xs text-ink-400">
            계산 결과는 같고 문장만 달라집니다.
          </p>
        </div>
        <div className="space-y-2">
          {(Object.keys(TONES) as Tone[]).map((tone) => {
            const copy = TONES[tone];
            const active = state.settings.tone === tone;
            return (
              <button
                key={tone}
                type="button"
                onClick={() => saveSettings({ tone })}
                className={`w-full rounded-xl border px-4 py-3 text-left transition ${
                  active ? "border-ink-800 bg-ink-800 text-onInk" : "border-ink-200 hover:border-ink-400"
                }`}
              >
                <span className="block text-sm font-medium">{copy.label}</span>
                <span className={`block text-xs ${active ? "text-onInk/70" : "text-ink-400"}`}>
                  {copy.description}
                </span>
                <span className={`mt-2 block text-xs ${active ? "text-onInk/90" : "text-ink-600"}`}>
                  &ldquo;{copy.meetingSentence("어머니", "240")}&rdquo;
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="card space-y-3">
        <div>
          <p className="text-sm font-semibold text-ink-800">화면</p>
          <p className="mt-1 text-xs text-ink-400">
            시스템을 고르면 기기 설정을 따라갑니다.
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {THEMES.map((option) => (
            <button
              key={option.value}
              type="button"
              className={`chip ${state.settings.theme === option.value ? "chip-active" : ""}`}
              onClick={() => saveSettings({ theme: option.value })}
            >
              {option.label}
            </button>
          ))}
        </div>
      </section>

      <section className="card space-y-3">
        <div>
          <p className="text-sm font-semibold text-ink-800">내 데이터</p>
          <p className="mt-1 text-xs text-ink-400">
            모든 기록은 이 브라우저 안에만 있습니다. 서버로 보내지 않으므로 기기를 바꾸면
            내보내기 파일로 옮겨야 합니다.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2 text-center">
          <div className="rounded-xl border border-ink-200/70 px-3 py-2">
            <p className="numeral text-lg text-ink-800">{state.people.length}</p>
            <p className="text-[11px] text-ink-400">인연</p>
          </div>
          <div className="rounded-xl border border-ink-200/70 px-3 py-2">
            <p className="numeral text-lg text-ink-800">{state.moments.length}</p>
            <p className="text-[11px] text-ink-400">순간</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn-secondary" onClick={download}>
            내보내기
          </button>
          <button type="button" className="btn-secondary" onClick={() => fileRef.current?.click()}>
            불러오기
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void importFile(file);
              e.target.value = "";
            }}
          />
        </div>
        {message && <p className="text-xs text-ink-600">{message}</p>}
      </section>

      <section className="card space-y-3">
        <div>
          <p className="text-sm font-semibold text-ink-800">전체 삭제</p>
          <p className="mt-1 text-xs text-ink-400">
            지운 직후 잠깐만 되돌릴 수 있고, 그 뒤에는 방법이 없습니다. 먼저 내보내기를
            권합니다.
          </p>
        </div>
        {confirmingClear ? (
          <div className="flex gap-2">
            <button
              type="button"
              className="btn-danger"
              onClick={() => {
                // 되돌릴 수 없다고 적어 뒀지만, 잠깐이라도 기회를 남기는 편이 낫다.
                const snapshot = JSON.parse(exportState());
                clearAll();
                setConfirmingClear(false);
                setMessage(null);
                offerUndo("모두 지웠습니다.", () => replaceAll(snapshot));
              }}
            >
              정말 지우기
            </button>
            <button type="button" className="btn-secondary" onClick={() => setConfirmingClear(false)}>
              취소
            </button>
          </div>
        ) : (
          <button type="button" className="btn-danger" onClick={() => setConfirmingClear(true)}>
            전체 삭제
          </button>
        )}
      </section>

      <section className="card space-y-2">
        <p className="text-sm font-semibold text-ink-800">예상 수명 데이터</p>
        <p className="text-xs leading-relaxed text-ink-400">
          WHO Global Health Observatory의 연령별 생명표(2021년)를 앱에 내장해 씁니다.
          37개국을 나이·성별로 나눠 담고 있어서, 같은 나라 사람이라도 나이에 따라 다른
          값이 나옵니다. 한국 수치는 통계청(KOSIS) 생명표와 일치합니다.
        </p>
        <p className="text-xs leading-relaxed text-ink-400">
          흔히 말하는 &ldquo;평균 수명 83.5세&rdquo;는 갓 태어난 사람 기준입니다. 이미
          68세까지 살아온 분은 일찍 떠난 분들이 끌어내린 그 평균에 해당하지 않아, 실제로는
          더 오래 사십니다. 그래서 나이별 표를 그대로 씁니다.
        </p>
        <p className="text-xs leading-relaxed text-ink-400">
          대만·홍콩은 WHO 회원국이 아니라 실측 표가 없어, 일본 표를 조정한 근사치를
          씁니다. 어느 경우든 예상 수명은 직접 바꿀 수 있습니다.
        </p>
      </section>
    </div>
  );
}

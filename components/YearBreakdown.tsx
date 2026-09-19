"use client";

import type { YearSlice } from "@/lib/calc";
import { formatCount } from "@/lib/format";

/** 해마다 값이 같으면(= 조건 필터가 형태를 바꾸지 않으면) 막대는 정보를 담지 못한다. */
function isFlat(slices: YearSlice[]): boolean {
  const full = slices.filter((s) => s.span > 0.99);
  if (full.length < 2) return true;
  const first = full[0].adjusted;
  return full.every((s) => Math.abs(s.adjusted - first) < 0.01);
}

/**
 * 조건 필터가 결과를 어떻게 깎는지 연도별로 보여준다. 총합만 들이밀면 숫자를 믿을
 * 근거가 없으므로 계산 과정을 펼쳐 놓는다.
 *
 * 다만 매년 같은 값이면 막대 48줄이 전부 같은 길이가 되어, 아무것도 말해주지 않으면서
 * 화면만 밀어낸다. 그럴 때는 한 줄로 접는다. 이 그림은 "변하는 것"을 보여줄 때만 값이 있다.
 */
export default function YearBreakdown({ slices }: { slices: YearSlice[] }) {
  const peak = slices.reduce((max, slice) => Math.max(max, slice.baseline), 0);
  if (peak <= 0 || slices.length === 0) return null;

  const thisYear = new Date().getFullYear();
  const lastYear = thisYear + slices.length - 1;

  if (isFlat(slices)) {
    const perYear = slices[0].adjusted;
    return (
      <p className="text-[11px] leading-relaxed text-ink-400">
        {thisYear}년부터 {lastYear}년까지 해마다 {formatCount(perYear)}번씩, 고르게
        이어집니다. 조건을 걸면 연도별로 어떻게 달라지는지 여기에 그려집니다.
      </p>
    );
  }

  // 변하는 경우에만 막대를 그린다. 너무 길면 읽히지 않으므로 앞쪽만 보여준다.
  const shown = slices.slice(0, 24);

  return (
    <div>
      <div className="space-y-1">
        {shown.map((slice) => {
          const baseWidth = (slice.baseline / peak) * 100;
          const adjWidth = (slice.adjusted / peak) * 100;
          return (
            <div key={slice.index} className="flex items-center gap-2 text-[11px] text-ink-400">
              <span className="w-10 shrink-0 tabular-nums">{thisYear + slice.index}</span>
              <span className="relative h-2.5 flex-1 overflow-hidden rounded-full bg-ink-50">
                <span
                  className="absolute inset-y-0 left-0 rounded-full bg-ink-200"
                  style={{ width: `${baseWidth}%` }}
                />
                <span
                  className="absolute inset-y-0 left-0 rounded-full bg-ink-800"
                  style={{ width: `${adjWidth}%` }}
                />
              </span>
              <span className="w-12 shrink-0 text-right tabular-nums">
                {formatCount(slice.adjusted)}번
              </span>
            </div>
          );
        })}
      </div>
      {slices.length > shown.length && (
        <p className="mt-2 text-[11px] text-ink-400">
          이후 {slices.length - shown.length}년은 생략했습니다.
        </p>
      )}
    </div>
  );
}

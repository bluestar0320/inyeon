"use client";

import type { YearSlice } from "@/lib/calc";
import { formatCount } from "@/lib/format";

/**
 * 필터가 결과를 얼마나 깎았는지 연도별로 보여준다. 총합만 들이밀면 숫자를 믿을
 * 근거가 없으므로, 계산 과정을 그대로 펼쳐 놓는 쪽을 택했다.
 */
export default function YearBreakdown({ slices }: { slices: YearSlice[] }) {
  const shown = slices.slice(0, 30);
  const peak = shown.reduce((max, slice) => Math.max(max, slice.baseline), 0);
  if (peak <= 0) return null;

  const thisYear = new Date().getFullYear();

  return (
    <div>
      <p className="text-xs font-medium text-ink-400">연도별 추이</p>
      <div className="mt-2 space-y-1">
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

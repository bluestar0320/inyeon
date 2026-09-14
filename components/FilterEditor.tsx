"use client";

import { FILTER_PRESETS } from "@/lib/presets";
import type { CalcFilter } from "@/lib/types";

function describe(filter: CalcFilter): string {
  switch (filter.kind) {
    case "multiplier": {
      const factor = filter.factor ?? 1;
      const delta = Math.round(Math.abs(1 - factor) * 100);
      if (delta === 0) return "빈도 그대로";
      return factor < 1 ? `빈도 ${delta}% 감소` : `빈도 ${delta}% 증가`;
    }
    case "decay": {
      const rate = Math.round((filter.ratePerYear ?? 0) * 1000) / 10;
      return rate >= 0 ? `매년 ${rate}%씩 감소` : `매년 ${Math.abs(rate)}%씩 증가`;
    }
    case "window": {
      const from = filter.fromYear ?? 0;
      const to = filter.toYear;
      const range = to === undefined ? `${from}년차부터 끝까지` : `${from}~${to}년차`;
      return filter.mode === "except" ? `${range} 제외` : `${range}만 포함`;
    }
    case "cap":
      return `최대 ${filter.maxTotal ?? 0}번`;
    default:
      return "";
  }
}

function FilterRow({
  filter,
  onChange,
  onRemove,
}: {
  filter: CalcFilter;
  onChange: (next: CalcFilter) => void;
  onRemove: () => void;
}) {
  return (
    <div className="rounded-xl border border-ink-200/70 bg-ink-50/40 p-3">
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          className="h-4 w-4 accent-ink-800"
          checked={filter.enabled}
          onChange={(e) => onChange({ ...filter, enabled: e.target.checked })}
          aria-label={`${filter.label} 사용`}
        />
        <input
          className="input flex-1 py-1.5"
          value={filter.label}
          placeholder="조건 이름"
          aria-label="조건 이름"
          onChange={(e) => onChange({ ...filter, label: e.target.value })}
        />
        <button type="button" className="btn-quiet" onClick={onRemove}>
          삭제
        </button>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-2 pl-6 text-sm text-ink-600">
        {filter.kind === "multiplier" && (
          <>
            <span>빈도에</span>
            <input
              className="input w-20 py-1"
              type="number"
              min={0}
              step="0.05"
              value={filter.factor ?? 1}
              onChange={(e) => onChange({ ...filter, factor: Number(e.target.value) })}
              aria-label="배수"
            />
            <span>배</span>
          </>
        )}

        {filter.kind === "decay" && (
          <>
            <span>매년</span>
            <input
              className="input w-20 py-1"
              type="number"
              step="0.5"
              value={Math.round((filter.ratePerYear ?? 0) * 1000) / 10}
              onChange={(e) => onChange({ ...filter, ratePerYear: Number(e.target.value) / 100 })}
              aria-label="연간 감소율(%)"
            />
            <span>%씩 감소 (음수면 증가)</span>
          </>
        )}

        {filter.kind === "window" && (
          <>
            <select
              className="input w-28 py-1"
              value={filter.mode ?? "only"}
              onChange={(e) => onChange({ ...filter, mode: e.target.value as "only" | "except" })}
              aria-label="구간 포함 여부"
            >
              <option value="only">이 구간만</option>
              <option value="except">이 구간 제외</option>
            </select>
            <input
              className="input w-20 py-1"
              type="number"
              min={0}
              step="0.5"
              value={filter.fromYear ?? 0}
              onChange={(e) => onChange({ ...filter, fromYear: Number(e.target.value) })}
              aria-label="시작 연차"
            />
            <span>년차부터</span>
            <input
              className="input w-20 py-1"
              type="number"
              min={0}
              step="0.5"
              value={filter.toYear ?? ""}
              placeholder="끝까지"
              onChange={(e) =>
                onChange({
                  ...filter,
                  toYear: e.target.value === "" ? undefined : Number(e.target.value),
                })
              }
              aria-label="종료 연차"
            />
            <span>년차까지</span>
          </>
        )}

        {filter.kind === "cap" && (
          <>
            <span>아무리 많아도</span>
            <input
              className="input w-24 py-1"
              type="number"
              min={0}
              value={filter.maxTotal ?? 0}
              onChange={(e) => onChange({ ...filter, maxTotal: Number(e.target.value) })}
              aria-label="최대 횟수"
            />
            <span>번까지</span>
          </>
        )}
      </div>

      <p className="mt-2 pl-6 text-[11px] text-ink-400">{describe(filter)}</p>
    </div>
  );
}

export default function FilterEditor({
  filters,
  onChange,
}: {
  filters: CalcFilter[];
  onChange: (next: CalcFilter[]) => void;
}) {
  return (
    <div className="space-y-3">
      <div>
        <p className="text-sm font-semibold text-ink-800">조건 필터</p>
        <p className="mt-1 text-xs text-ink-400">
          기본값을 밀어 넣지 않습니다. 이 항목에만 해당하는 조건을 직접 세워 보세요.
        </p>
      </div>

      {filters.length > 0 && (
        <div className="space-y-2">
          {filters.map((filter) => (
            <FilterRow
              key={filter.id}
              filter={filter}
              onChange={(next) => onChange(filters.map((f) => (f.id === next.id ? next : f)))}
              onRemove={() => onChange(filters.filter((f) => f.id !== filter.id))}
            />
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-1.5">
        {FILTER_PRESETS.map((preset) => (
          <button
            key={preset.label}
            type="button"
            className="chip"
            title={preset.hint}
            onClick={() => onChange([...filters, preset.build()])}
          >
            + {preset.label}
          </button>
        ))}
      </div>
    </div>
  );
}

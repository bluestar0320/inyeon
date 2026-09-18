"use client";

import { useId } from "react";

export interface SortOption<T extends string> {
  key: T;
  label: string;
}

/**
 * 목록이 짧을 때는 아무것도 띄우지 않는다. 항목 두세 개짜리 화면에 검색창과
 * 정렬 칩을 얹으면 도구가 내용보다 커진다.
 */
export const SEARCH_THRESHOLD = 6;

export default function ListControls<T extends string>({
  total,
  shown,
  query,
  onQuery,
  sort,
  onSort,
  options,
  placeholder,
}: {
  total: number;
  shown: number;
  query: string;
  onQuery: (next: string) => void;
  sort: T;
  onSort: (next: T) => void;
  options: SortOption<T>[];
  placeholder: string;
}) {
  const ids = useId();
  if (total < 2) return null;

  return (
    <div className="space-y-2">
      {total >= SEARCH_THRESHOLD && (
        <div>
          <label className="sr-only" htmlFor={`${ids}-q`}>
            검색
          </label>
          <input
            id={`${ids}-q`}
            className="input"
            type="search"
            value={query}
            placeholder={placeholder}
            onChange={(e) => onQuery(e.target.value)}
          />
        </div>
      )}

      <div className="flex flex-wrap items-center gap-1.5">
        {options.map((option) => (
          <button
            key={option.key}
            type="button"
            className={`chip ${sort === option.key ? "chip-active" : ""}`}
            onClick={() => onSort(option.key)}
          >
            {option.label}
          </button>
        ))}
        {query.trim() !== "" && (
          <span className="ml-auto text-[11px] text-ink-400">
            {shown === 0 ? "일치하는 항목 없음" : `${total}개 중 ${shown}개`}
          </span>
        )}
      </div>
    </div>
  );
}

"use client";

import { useState, type InputHTMLAttributes } from "react";

/**
 * 숫자 칸. 입력하는 동안은 친 글자를 그대로 들고 있고, 유한한 숫자로 읽힐 때만
 * 위로 올린다. 칸을 비우면 0이 되어 결과가 튀던 문제를 막는다 — 빈 칸이나 "-"는
 * 올리지 않고, 부모는 마지막으로 올바른 값을 지킨다. 칸을 떠나면 지금 값으로 돌아간다.
 * min/max는 올릴 때 잘라 낸다(max 130에 200을 치면 130이 올라간다).
 */
export default function NumberInput({
  value,
  onChange,
  onEmpty,
  min,
  max,
  ...rest
}: Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "type" | "min" | "max"> & {
  /** undefined면 빈 칸으로 보인다. */
  value: number | undefined;
  onChange: (next: number) => void;
  /** 비우는 것 자체가 뜻이 있는 칸(나이 모름, 끝까지)만 준다. 없으면 빈 칸은 무시한다. */
  onEmpty?: () => void;
  min?: number;
  max?: number;
}) {
  const [text, setText] = useState<string | null>(null); // null = 포커스 밖, value를 그대로 보인다
  const shown = value === undefined || !Number.isFinite(value) ? "" : String(value);

  return (
    <input
      {...rest}
      type="number"
      min={min}
      max={max}
      value={text ?? shown}
      onFocus={(e) => {
        setText(shown);
        rest.onFocus?.(e);
      }}
      onBlur={(e) => {
        setText(null);
        rest.onBlur?.(e);
      }}
      onChange={(e) => {
        const raw = e.target.value;
        setText(raw);
        if (raw.trim() === "") {
          onEmpty?.();
          return;
        }
        const n = Number(raw);
        if (!Number.isFinite(n)) return;
        onChange(Math.min(max ?? Infinity, Math.max(min ?? -Infinity, n)));
      }}
    />
  );
}

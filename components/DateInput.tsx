"use client";

import { useState, type InputHTMLAttributes } from "react";

import { todayISO, typedDate } from "@/lib/format";

/**
 * 날짜 칸. type="date"는 폰에서 달력만 떠서 1960년대를 고르려면 한참 넘겨야 한다.
 * 숫자 자판을 띄워 19650312처럼 치게 하고, 다 맞는 날짜일 때만 위로 올린다.
 * NumberInput과 같은 규칙 — 치는 동안은 글자를 그대로 들고, 칸을 떠나면 지금 값으로 돌아간다.
 */
export default function DateInput({
  value,
  onChange,
  max = todayISO(),
  ...rest
}: Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "type" | "max"> & {
  value: string | undefined;
  /** 비우면 undefined. */
  onChange: (next: string | undefined) => void;
  max?: string;
}) {
  const [text, setText] = useState<string | null>(null);

  return (
    <input
      placeholder="19650312"
      {...rest}
      type="text"
      inputMode="numeric"
      autoComplete="off"
      maxLength={10}
      value={text ?? value ?? ""}
      onFocus={(e) => {
        setText(value ?? "");
        rest.onFocus?.(e);
      }}
      onBlur={(e) => {
        setText(null);
        rest.onBlur?.(e);
      }}
      onChange={(e) => {
        const next = typedDate(e.target.value, max);
        setText(next.text);
        if (next.text === "") onChange(undefined);
        else if (next.iso) onChange(next.iso);
      }}
    />
  );
}

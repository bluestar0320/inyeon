/*
 * 이 앱에서 가장 큰 글자.
 *
 * 원래 48px이었다. 숫자 하나 보러 오는 앱인데 카드 여럿 중 하나처럼 보였고,
 * 공유 카드(1080px 폭에 340px 숫자, 약 31%)를 앱 화면과 나란히 놓으면 공유 카드가
 * 오히려 더 앱다웠다. 그 밀도를 화면으로 가져온다 — 폭의 20%.
 */

/*
 * 값에 단위가 붙어 오는 경우가 있다 — formatYears()는 "47년"을 통째로 준다.
 * 그대로 두면 "년"까지 78px로 찍혀 숫자가 둘로 갈라져 보인다. 뒤에 붙은 글자는
 * 떼어 내 작게 쓴다.
 */
function split(value: string, unit?: string): [string, string | undefined] {
  if (unit) return [value, unit];
  const m = /^([\d,.]+)(.+)$/.exec(value);
  return m ? [m[1], m[2]] : [value, undefined];
}

/** 자릿수가 늘면 줄인다. shareCard의 valueFontSize()와 같은 이유다. */
function sizeFor(value: string): string {
  if (value.length > 6) return "text-[clamp(2.5rem,13vw,4rem)]";
  if (value.length > 4) return "text-[clamp(3rem,16vw,5rem)]";
  return "text-[clamp(3.5rem,20vw,6rem)]";
}

export default function BigNumber({
  label,
  value,
  unit,
  sub,
  muted,
}: {
  label: string;
  value: string;
  unit?: string;
  sub?: string;
  muted?: boolean;
}) {
  const [num, suffix] = split(value, unit);

  return (
    <div>
      <p className="text-xs font-medium tracking-[0.08em] text-ink-600">{label}</p>
      {/* key를 값으로 둬서, 숫자가 달라지면 다시 떠오른다. */}
      <p
        key={value}
        className={`numeral numeral-hero mt-2 ${sizeFor(num)} ${muted ? "text-ink-400" : ""}`}
      >
        {num}
        {suffix && (
          <span className="ml-1.5 text-[0.28em] font-semibold tracking-normal text-ink-600">
            {suffix}
          </span>
        )}
      </p>
      {sub && <p className="mt-3 text-sm leading-relaxed text-ink-600">{sub}</p>}
    </div>
  );
}

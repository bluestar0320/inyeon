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
  return (
    <div>
      <p className="text-xs font-medium text-ink-400">{label}</p>
      <p className={`numeral mt-1 text-5xl ${muted ? "text-ink-400" : "text-ink-900"}`}>
        {value}
        {unit && <span className="ml-1 text-2xl font-semibold text-ink-400">{unit}</span>}
      </p>
      {sub && <p className="mt-2 text-sm text-ink-400">{sub}</p>}
    </div>
  );
}

export default function StatCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="rounded-xl border border-ink-200/70 bg-white px-4 py-3">
      <p className="text-[11px] text-ink-400">{label}</p>
      <p className="numeral mt-0.5 text-lg text-ink-800">{value}</p>
      {sub && <p className="mt-0.5 text-[11px] text-ink-400">{sub}</p>}
    </div>
  );
}

/*
 * 보조 지표 한 칸.
 *
 * 이름은 Card지만 더 이상 상자가 아니다. 카드 안에 작은 카드를 넣으면 테두리가
 * 두 겹이 되고, 주인공 숫자와 같은 무게로 보여 무엇이 중요한지 사라진다.
 * 여백과 글자 크기로만 나눈다.
 */
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
    <div>
      <p className="text-[11px] text-ink-600">{label}</p>
      <p className="numeral mt-0.5 text-lg text-ink-800">{value}</p>
      {sub && <p className="mt-0.5 text-[11px] text-ink-400">{sub}</p>}
    </div>
  );
}

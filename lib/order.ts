/*
 * 이용자가 정한 순서(설정의 peopleOrder, id 목록). 홈 사진 더미와 인연 목록의 「내 순서」가 같이 쓴다.
 * 순서에 없는 것(정한 뒤에 새로 추가한 사람)은 들어온 순서를 지켜 맨 뒤에 붙는다.
 */
export function inOrder<T>(items: T[], order: string[] | undefined, id: (item: T) => string): T[] {
  if (!order?.length) return items;
  const rank = new Map(order.map((value, i) => [value, i]));
  return items
    .map((item, i) => ({ item, at: rank.get(id(item)) ?? order.length + i }))
    .sort((a, b) => a.at - b.at)
    .map(({ item }) => item);
}

/** i번째를 한 칸 위(-1)나 아래(+1)로 옮긴 순서. 끝을 넘으면 그대로. */
export function moved(ids: string[], i: number, step: -1 | 1): string[] {
  const j = i + step;
  if (i < 0 || j < 0 || j >= ids.length) return ids;
  const next = [...ids];
  [next[i], next[j]] = [next[j], next[i]];
  return next;
}

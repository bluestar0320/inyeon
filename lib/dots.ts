/** 점이 이보다 많으면 묶는다. 폰 화면에서 한눈에 들어오는 정도. */
const MAX_DOTS = 100;

/**
 * 지나간 만남과 남은 만남을 점 몇 개로 그릴지. 점 하나가 몇 번인지(unit)는 1·2·5·10·20…에서
 * 전체가 MAX_DOTS를 넘지 않는 가장 작은 값이다. 남은 게 있으면 점 하나는 꼭 남긴다.
 */
export function dotsFor(past: number, remaining: number): { unit: number; past: number; left: number } {
  const total = Math.max(0, past) + Math.max(0, remaining);
  let unit = 1;
  for (let i = 1; total / unit > MAX_DOTS; i += 1) unit = [1, 2, 5][i % 3] * 10 ** Math.floor(i / 3);
  return {
    unit,
    past: Math.round(Math.max(0, past) / unit),
    left: remaining > 0 ? Math.max(1, Math.round(remaining / unit)) : 0,
  };
}

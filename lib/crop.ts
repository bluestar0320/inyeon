/*
 * 내 사진 맞추기(components/OwnPhotoPicker.tsx)의 계산. 원본 사진 좌표로 정사각형 한 칸을 들고 다닌다.
 * cx·cy는 칸의 가운데, zoom 1은 짧은 변을 꽉 채우는 크기. 칸은 사진 밖으로 나가지 않는다.
 */
export const MAX_ZOOM = 4;

export interface Crop {
  cx: number;
  cy: number;
  zoom: number;
}

/** 칸 한 변(원본 픽셀). */
export const cropSide = (w: number, h: number, zoom: number): number => Math.min(w, h) / zoom;

/** 배율을 1~MAX_ZOOM으로, 가운데를 칸이 사진 안에 남는 자리로 당긴다. */
export function clampCrop(w: number, h: number, c: Crop): Crop {
  const zoom = Math.min(MAX_ZOOM, Math.max(1, Number.isFinite(c.zoom) ? c.zoom : 1));
  const half = cropSide(w, h, zoom) / 2;
  const fit = (v: number, max: number) => Math.min(max - half, Math.max(half, Number.isFinite(v) ? v : max / 2));
  return { cx: fit(c.cx, w), cy: fit(c.cy, h), zoom };
}

/** 처음 자리: 가운데, 꽉 채움. */
export const centerCrop = (w: number, h: number): Crop => ({ cx: w / 2, cy: h / 2, zoom: 1 });

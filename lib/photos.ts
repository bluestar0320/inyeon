/*
 * 폴라로이드에 거는 사진. 사용자 사진은 받지 않고, 앱에 넣어 둔 24장 중에서 고른다.
 * 프리셋 18개(관계 7, 순간 11)에 한 장씩, 그리고 공용 "인생의 순간" 6장.
 * 이모지는 lib/presets.ts의 RELATION_SPECS·MOMENT_SPECS와 같은 값이어야 한다.
 */
export const PHOTOS = [
  { key: "mother", emoji: "🌷" },
  { key: "father", emoji: "🌳" },
  { key: "grandparent", emoji: "🫖" },
  { key: "sibling", emoji: "🧩" },
  { key: "spouse", emoji: "🕊️" },
  { key: "child", emoji: "🧸" },
  { key: "friend", emoji: "🍻" },
  { key: "blossom", emoji: "🌸" },
  { key: "sea", emoji: "🌊" },
  { key: "travel", emoji: "✈️" },
  { key: "hometown", emoji: "🏠" },
  { key: "books", emoji: "📖" },
  { key: "surf", emoji: "🏄" },
  { key: "guitar", emoji: "🎸" },
  { key: "snow", emoji: "❄️" },
  { key: "dog", emoji: "🐕" },
  { key: "swim", emoji: "🏊" },
  { key: "woodwork", emoji: "🪚" },
  { key: "graduation" },
  { key: "sportsday" },
  { key: "firstpay" },
  { key: "bouquet" },
  { key: "moving" },
  { key: "railway" },
] as const satisfies readonly { key: string; emoji?: string }[];

export type PhotoKey = (typeof PHOTOS)[number]["key"];

export const SHARED_PHOTOS: string[] = PHOTOS.filter((p) => !("emoji" in p)).map((p) => p.key);

const KEYS = new Set<string>(PHOTOS.map((p) => p.key));
const BY_EMOJI = new Map<string, string>(
  PHOTOS.flatMap((p) => ("emoji" in p ? [[p.emoji as string, p.key] as [string, string]] : [])),
);

/** 같은 id면 늘 같은 수. 사진이 열 때마다 바뀌면 "내 사진"이 되지 못한다. */
function hash(text: string): number {
  let h = 0;
  for (const ch of text) h = (h * 31 + ch.codePointAt(0)!) >>> 0;
  return h;
}

export function photoFor(item: { id: string; emoji?: string; photo?: string }): string {
  if (item.photo && KEYS.has(item.photo)) return item.photo;
  const byEmoji = item.emoji ? BY_EMOJI.get(item.emoji) : undefined;
  if (byEmoji) return byEmoji;
  return SHARED_PHOTOS[hash(item.id) % SHARED_PHOTOS.length];
}

export function photoSrc(key: string): string {
  return `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/photos/${key}.webp`;
}

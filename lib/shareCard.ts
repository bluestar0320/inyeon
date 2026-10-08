/**
 * 결과를 이미지 한 장으로 그린다.
 *
 * html2canvas 같은 도구를 쓰지 않고 canvas에 직접 그린다. 화면을 그대로 베끼면
 * 공유용으로는 군더더기가 많고(입력 폼, 내비게이션), 라이브러리마다 폰트와 그림자
 * 처리가 달라 결과가 들쭉날쭉하다. 카드는 화면과 다른 물건이라 따로 그리는 게 맞다.
 *
 * 나이와 예상 수명은 일부러 넣지 않는다. 남은 횟수는 내보일 만하지만
 * "어머니 68세, 예상 수명 87.3세"는 남에게 보낼 정보가 아니다.
 */

import { josa } from "./format.ts";
import { defineCopy, tr } from "./i18n.ts";

/** 인연 카드의 제목. 숫자보다 관계가 먼저 보이게 — "어머니와 나". 카드를 보내는 사람 쪽에서 본 말이다. */
const PAIR = defineCopy({
  ko: (name: string) => `${josa(name, "와/과")} 나`,
  en: (name) => `${name} & me`,
  ja: (name) => `${name}と私`,
  es: (name) => `${name} y yo`,
  zh: (name) => `我和${name}`,
});

export function pairTitle(name: string): string {
  return tr(PAIR)(name.trim());
}

/** 이름이 비었을 때 쓰는 파일 이름. */
const FALLBACK_NAME = defineCopy({ ko: "카드", en: "card", ja: "カード", es: "tarjeta", zh: "卡片" });

/** 인스타그램 세로 비율(4:5). 피드에서 가장 크게 잡힌다. */
export const CARD_WIDTH = 1080;
export const CARD_HEIGHT = 1350;

export interface ShareSpec {
  /** 카드 위쪽 큰 이모지. */
  emoji?: string;
  /**
   * 누구/무엇인지. "어머니", "벚꽃 보기" 같은 짧은 말.
   *
   * 처음에는 "어머니와(과) 앞으로 만날 수 있는 횟수"를 한 줄에 넣었는데, 카드 폭을
   * 꽉 채우고 조사까지 어색했다. 주어와 설명을 나누니 둘 다 짧아지고 "와(과)"도 사라졌다.
   */
  title: string;
  /** 무엇을 센 것인지. "앞으로 만날 수 있는 횟수" 같은 작은 줄. */
  subtitle?: string;
  /** 주인공 숫자. 이미 사람이 읽는 형식이어야 한다("232", "3,392"). */
  value: string;
  /** 숫자 뒤에 붙는 단위. */
  unit: string;
  /** 근거 한 줄. "한 달에 1번 · 19년" 같은 것. */
  caption?: string;
  /** 카드 위쪽 폴라로이드에 넣을 사진 주소. 있으면 이모지 대신 사진이 들어간다. */
  photo?: string;
  /** 폴라로이드 아래 여백에 손글씨처럼 적는 이름. */
  label?: string;
  /** 숫자 아래 이야기 줄(지금·오늘·비율). 있으면 caption 대신 그린다. */
  story?: string[];
}

export interface CardTheme {
  background: string;
  surface: string;
  text: string;
  muted: string;
  accent: string;
  border: string;
}

/** 사진 카드의 제목·이름·이야기. 앱 사진첩과 같은 명조(public/fonts). 그리기 전에 ShareButton이 받아 둔다. */
export const SERIF_STACK = '"Nanum Myeongjo", AppleMyungjo, Batang, serif';

const FONT_STACK =
  'Pretendard, -apple-system, BlinkMacSystemFont, "Apple SD Gothic Neo", "Malgun Gothic", "Noto Sans KR", "Hiragino Sans", "Noto Sans JP", "PingFang SC", "Microsoft YaHei", "Noto Sans SC", sans-serif';

/** `--ink-900` 같은 "r g b" 변수를 canvas가 아는 색 문자열로 바꾼다. */
function readColor(styles: CSSStyleDeclaration, name: string, fallback: string): string {
  const raw = styles.getPropertyValue(name).trim();
  if (!raw) return fallback;
  const parts = raw.split(/[\s,]+/).filter(Boolean);
  if (parts.length < 3) return raw;
  return `rgb(${parts[0]}, ${parts[1]}, ${parts[2]})`;
}

/** 지금 화면 테마를 그대로 카드에 쓴다. 보고 있던 것과 다른 색이 나오면 당황스럽다. */
export function currentTheme(): CardTheme {
  if (typeof window === "undefined") {
    return {
      background: "#f7f1e6",
      surface: "#fffdf8",
      text: "#2a221c",
      muted: "#706053",
      accent: "#a85230",
      border: "#e2d8ca",
    };
  }
  const s = window.getComputedStyle(document.documentElement);
  return {
    background: readColor(s, "--page", "#f7f1e6"),
    surface: readColor(s, "--surface", "#fffdf8"),
    text: readColor(s, "--ink-900", "#2a221c"),
    muted: readColor(s, "--ink-400", "#706053"),
    accent: readColor(s, "--accent-500", "#a85230"),
    border: readColor(s, "--ink-200", "#e2d8ca"),
  };
}

/**
 * 너무 긴 글자는 잘라 낸다. 카드에서 줄이 넘치면 레이아웃이 통째로 어긋나므로,
 * 줄바꿈보다 자르는 쪽이 안전하다.
 */
export function truncateToWidth(
  ctx: Pick<CanvasRenderingContext2D, "measureText">,
  text: string,
  maxWidth: number,
): string {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let cut = text;
  while (cut.length > 1 && ctx.measureText(`${cut}…`).width > maxWidth) {
    cut = cut.slice(0, -1);
  }
  return `${cut}…`;
}

/** 이야기 줄은 자르지 않고 나눈다. 공백이 있으면 낱말 사이에서, 없으면(한·중·일) 글자 사이에서. */
export function wrapLines(
  ctx: Pick<CanvasRenderingContext2D, "measureText">,
  text: string,
  maxWidth: number,
  maxLines: number,
): string[] {
  const lines: string[] = [];
  let line = "";
  for (const ch of Array.from(text.trim())) {
    if (line === "" || ctx.measureText(line + ch).width <= maxWidth) {
      line += ch;
      continue;
    }
    const cut = line.lastIndexOf(" ");
    if (ch !== " " && cut > 0) {
      lines.push(line.slice(0, cut));
      line = line.slice(cut + 1) + ch;
    } else {
      lines.push(line.trimEnd());
      line = ch === " " ? "" : ch;
    }
  }
  if (line) lines.push(line);
  if (lines.length <= maxLines) return lines;
  // 넘치면 마지막 줄에 나머지를 붙여 줄임표로 자른다 — 잘렸다는 걸 보여야 한다.
  const kept = lines.slice(0, maxLines);
  const last = truncateToWidth(ctx, lines.slice(maxLines - 1).join(" "), maxWidth);
  kept[maxLines - 1] = last.endsWith("…") ? last : truncateToWidth(ctx, `${last}…`, maxWidth);
  return kept;
}

/**
 * wrapLines와 같은 줄 수를 지키면서 폭을 줄여 본다. 앞줄만 꽉 차고 마지막 줄에 "못해요."
 * 한 낱말만 남는 모양을 피하려는 것이다. 줄 수가 늘기 직전의 가장 좁은 폭을 찾는다.
 */
export function balanceLines(
  ctx: Pick<CanvasRenderingContext2D, "measureText">,
  text: string,
  maxWidth: number,
  maxLines: number,
): string[] {
  // 문장이 여럿이면 문장마다 새 줄에서 시작한다. 줄 수가 모자라면 아래처럼 이어 채운다.
  const sentences = text.trim().split(/(?<=[.?!])\s+|(?<=[。？！])/).filter(Boolean);
  if (sentences.length > 1) {
    const lines = sentences.flatMap((s) => balanceSentence(ctx, s, maxWidth, maxLines));
    if (lines.length <= maxLines && !lines.some((l) => l.endsWith("…"))) return lines;
  }
  return balanceSentence(ctx, text, maxWidth, maxLines);
}

function balanceSentence(
  ctx: Pick<CanvasRenderingContext2D, "measureText">,
  text: string,
  maxWidth: number,
  maxLines: number,
): string[] {
  const greedy = wrapLines(ctx, text, maxWidth, maxLines);
  if (greedy.length < 2 || greedy[greedy.length - 1].endsWith("…")) return greedy;
  let lo = maxWidth / greedy.length;
  let hi = maxWidth;
  let best = greedy;
  for (let i = 0; i < 12; i += 1) {
    const mid = (lo + hi) / 2;
    const lines = wrapLines(ctx, text, mid, maxLines);
    if (lines.length <= greedy.length && !lines[lines.length - 1].endsWith("…")) {
      best = lines;
      hi = mid;
    } else {
      lo = mid;
    }
  }
  return best;
}

/** 숫자가 길어질수록 글자 크기를 줄여 카드 밖으로 나가지 않게 한다. */
export function valueFontSize(value: string): number {
  const digits = value.replace(/[^0-9]/g, "").length;
  if (digits <= 3) return 340;
  if (digits === 4) return 280;
  if (digits === 5) return 230;
  return 190;
}

function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** 카드를 그린다. 캔버스를 돌려주므로 호출하는 쪽에서 원하는 형식으로 뽑는다. */
export function drawCard(
  canvas: HTMLCanvasElement,
  spec: ShareSpec,
  theme: CardTheme,
  wordmark: string,
  image?: CanvasImageSource & { width: number; height: number },
  url?: string,
): void {
  canvas.width = CARD_WIDTH;
  canvas.height = CARD_HEIGHT;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const cx = CARD_WIDTH / 2;
  const margin = 72;

  ctx.fillStyle = theme.background;
  ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);

  ctx.fillStyle = theme.surface;
  ctx.strokeStyle = theme.border;
  ctx.lineWidth = 2;
  roundedRect(ctx, margin, margin, CARD_WIDTH - margin * 2, CARD_HEIGHT - margin * 2, 56);
  ctx.fill();
  ctx.stroke();

  ctx.textAlign = "center";
  const inner = CARD_WIDTH - margin * 2 - 96;

  ctx.textBaseline = "middle";

  /*
   * 사진이 있으면 위쪽에 살짝 기운 폴라로이드로 걸고, 글자와 숫자를 그만큼 아래로 내린다.
   * 없으면 예전처럼 이모지 한 개.
   */
  const story = spec.story?.filter(Boolean) ?? [];
  // 이야기 줄이 있으면 사진 카드는 숫자를 조금 올리고 작게 해 두 줄 자리를 낸다.
  /*
   * 사진 카드는 관계가 주인공이다 — 큰 폴라로이드(이름 손글씨) → "어머니와 나" → 숫자 → 이야기.
   * 숫자는 그 아래에서 받쳐 준다. 사진이 없는 카드(결혼)는 예전 배치 그대로.
   */
  const y = image
    ? story.length
      ? { title: 800, subtitle: 856, baseline: 1000, caption: 1056, maxSize: 150, lines: 2, rule: 1146 }
      : { title: 810, subtitle: 866, baseline: 1050, caption: 1104, maxSize: 190, lines: 0, rule: 1146 }
    : { title: 460, subtitle: 530, baseline: 830, caption: story.length ? 916 : 940, maxSize: Infinity, lines: 5, rule: 1120 };
  const serif = Boolean(image);

  if (image) {
    const side = 480;
    const pad = 24;
    const height = side + pad * 5;
    ctx.save();
    ctx.translate(cx, 110 + height / 2);
    ctx.rotate((-2 * Math.PI) / 180);
    ctx.shadowColor = "rgba(42, 34, 28, 0.18)";
    ctx.shadowBlur = 24;
    ctx.shadowOffsetY = 8;
    ctx.fillStyle = "#fffdf8";
    ctx.fillRect(-side / 2 - pad, -height / 2, side + pad * 2, height);
    ctx.shadowColor = "transparent";
    // 가운데를 정사각형으로 잘라 넣는다(내 사진은 세로·가로 제각각이다).
    const crop = Math.min(image.width, image.height);
    ctx.drawImage(
      image,
      (image.width - crop) / 2,
      (image.height - crop) / 2,
      crop,
      crop,
      -side / 2,
      -height / 2 + pad,
      side,
      side,
    );
    if (spec.label) {
      ctx.fillStyle = "#3a2f27";
      ctx.font = `40px ${SERIF_STACK}`;
      ctx.fillText(truncateToWidth(ctx, spec.label, side), 0, -height / 2 + pad + side + (height - pad - side) / 2);
    }
    ctx.restore();
  } else if (spec.emoji) {
    ctx.font = `120px ${FONT_STACK}`;
    ctx.fillText(spec.emoji, cx, 320);
  }

  ctx.fillStyle = theme.text;
  ctx.font = serif ? `700 58px ${SERIF_STACK}` : `700 56px ${FONT_STACK}`;
  ctx.fillText(truncateToWidth(ctx, spec.title, inner), cx, y.title);

  if (spec.subtitle) {
    ctx.fillStyle = theme.muted;
    ctx.font = `34px ${FONT_STACK}`;
    ctx.fillText(truncateToWidth(ctx, spec.subtitle, inner), cx, y.subtitle);
  }

  /*
   * 숫자와 단위를 한 덩어리로 가운데 맞춘다.
   * 기준선을 830에 두는 이유: 340px 글자의 윗머리가 830 - 0.71×340 ≈ 589까지 올라가는데,
   * 그 위 설명줄이 537에서 끝나므로 50px쯤 남는다. 더 올리면 서로 겹친다.
   */
  /*
   * 자릿수만 보고 크기를 고르면 단위 폭을 못 본다. "3,614 times"·"3614 veces"처럼
   * 단위가 긴 언어에서는 카드 밖으로 나갔다. 숫자+단위를 실제로 재어 보고 넘치면 줄인다.
   */
  let size = Math.min(valueFontSize(spec.value), y.maxSize);
  const gap = 18;
  const measure = (s: number) => {
    ctx.font = `700 ${s}px ${FONT_STACK}`;
    const value = ctx.measureText(spec.value).width;
    ctx.font = `600 ${Math.round(s * 0.34)}px ${FONT_STACK}`;
    return { value, unit: ctx.measureText(spec.unit).width };
  };
  let widths = measure(size);
  const total = widths.value + gap + widths.unit;
  if (total > inner) {
    size = Math.floor((size * inner) / total);
    widths = measure(size);
  }
  const valueWidth = widths.value;
  const unitWidth = widths.unit;
  const unitSize = Math.round(size * 0.34);
  const startX = cx - (valueWidth + gap + unitWidth) / 2;
  const baselineY = y.baseline;

  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = theme.text;
  ctx.font = `700 ${size}px ${FONT_STACK}`;
  ctx.fillText(spec.value, startX, baselineY);

  ctx.fillStyle = theme.muted;
  ctx.font = `600 ${unitSize}px ${FONT_STACK}`;
  ctx.fillText(spec.unit, startX + valueWidth + gap, baselineY);

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  if (story.length) {
    ctx.fillStyle = serif ? theme.text : theme.muted;
    ctx.font = serif ? `30px ${SERIF_STACK}` : `28px ${FONT_STACK}`;
    const out: string[] = [];
    for (const line of story) {
      if (out.length >= y.lines) break;
      out.push(...balanceLines(ctx, line, inner, y.lines - out.length));
    }
    out.forEach((line, i) => ctx.fillText(line, cx, y.caption + i * 42));
  } else if (spec.caption) {
    ctx.fillStyle = theme.muted;
    ctx.font = `34px ${FONT_STACK}`;
    ctx.fillText(truncateToWidth(ctx, spec.caption, inner), cx, y.caption);
  }

  ctx.strokeStyle = theme.border;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx - 60, y.rule);
  ctx.lineTo(cx + 60, y.rule);
  ctx.stroke();

  ctx.fillStyle = theme.accent;
  ctx.font = `600 34px ${FONT_STACK}`;
  ctx.fillText(wordmark, cx, y.rule + (url ? 50 : 70));

  // 카드가 퍼졌을 때 "이거 어디서 했어?"에 답하는 한 줄.
  if (url) {
    ctx.fillStyle = theme.muted;
    ctx.font = `28px ${FONT_STACK}`;
    ctx.fillText(url, cx, y.rule + 98);
  }
}

export function toBlob(canvas: HTMLCanvasElement): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
}

/** 파일 이름에 쓸 수 없는 글자를 걸러 낸다. */
export function safeFileName(parts: string[]): string {
  const joined = parts
    .map((p) => p.trim())
    .filter(Boolean)
    .join("-")
    .replace(/[\\/:*?"<>|]+/g, "")
    .replace(/\s+/g, "-");
  // 이름이 길면 파일 이름이 수백 바이트가 되어 일부 기기에서 저장이 실패한다.
  // 글자(코드포인트) 단위로 자르므로 한글·이모지 중간에서 깨지지 않는다.
  const short = Array.from(joined).slice(0, 60).join("");
  return `${short || tr(FALLBACK_NAME)}.png`;
}

/** 사진을 불러온다. 못 불러오면 null — 카드는 사진 없이도 그려져야 한다. */
export function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

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
}

export interface CardTheme {
  background: string;
  surface: string;
  text: string;
  muted: string;
  accent: string;
  border: string;
}

const FONT_STACK =
  'Pretendard, -apple-system, BlinkMacSystemFont, "Apple SD Gothic Neo", "Malgun Gothic", "Noto Sans KR", sans-serif';

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
      background: "#fbfaf8",
      surface: "#ffffff",
      text: "#15161b",
      muted: "#6a6c76",
      accent: "#b05632",
      border: "#d9dade",
    };
  }
  const s = window.getComputedStyle(document.documentElement);
  return {
    background: readColor(s, "--page", "#fbfaf8"),
    surface: readColor(s, "--surface", "#ffffff"),
    text: readColor(s, "--ink-900", "#15161b"),
    muted: readColor(s, "--ink-400", "#6a6c76"),
    accent: readColor(s, "--accent-500", "#b05632"),
    border: readColor(s, "--ink-200", "#d9dade"),
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

  if (spec.emoji) {
    ctx.font = `120px ${FONT_STACK}`;
    ctx.fillText(spec.emoji, cx, 320);
  }

  ctx.fillStyle = theme.text;
  ctx.font = `700 56px ${FONT_STACK}`;
  ctx.fillText(truncateToWidth(ctx, spec.title, inner), cx, 460);

  if (spec.subtitle) {
    ctx.fillStyle = theme.muted;
    ctx.font = `34px ${FONT_STACK}`;
    ctx.fillText(truncateToWidth(ctx, spec.subtitle, inner), cx, 530);
  }

  /*
   * 숫자와 단위를 한 덩어리로 가운데 맞춘다.
   * 기준선을 830에 두는 이유: 340px 글자의 윗머리가 830 - 0.71×340 ≈ 589까지 올라가는데,
   * 그 위 설명줄이 537에서 끝나므로 50px쯤 남는다. 더 올리면 서로 겹친다.
   */
  const size = valueFontSize(spec.value);
  ctx.font = `700 ${size}px ${FONT_STACK}`;
  const valueWidth = ctx.measureText(spec.value).width;
  const unitSize = Math.round(size * 0.34);
  ctx.font = `600 ${unitSize}px ${FONT_STACK}`;
  const unitWidth = ctx.measureText(spec.unit).width;
  const gap = 18;
  const startX = cx - (valueWidth + gap + unitWidth) / 2;
  const baselineY = 830;

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
  if (spec.caption) {
    ctx.fillStyle = theme.muted;
    ctx.font = `34px ${FONT_STACK}`;
    ctx.fillText(truncateToWidth(ctx, spec.caption, inner), cx, 940);
  }

  ctx.strokeStyle = theme.border;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx - 60, 1120);
  ctx.lineTo(cx + 60, 1120);
  ctx.stroke();

  ctx.fillStyle = theme.accent;
  ctx.font = `600 34px ${FONT_STACK}`;
  ctx.fillText(wordmark, cx, 1190);
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
  return `${joined || "카드"}.png`;
}

"use client";

import { defineCopy, tr } from "@/lib/i18n";
import { OWN_PHOTO_MAX } from "@/lib/store";

const COPY = defineCopy({
  ko: { pick: "내 사진 넣기", reset: "원래 사진으로", failed: "사진을 읽지 못했어요." },
  en: { pick: "Use my photo", reset: "Back to original", failed: "Couldn't read that photo." },
  ja: { pick: "自分の写真にする", reset: "元の写真に戻す", failed: "写真を読み込めませんでした。" },
  es: { pick: "Poner mi foto", reset: "Volver a la original", failed: "No se pudo leer la foto." },
  zh: { pick: "换成我的照片", reset: "恢复原图", failed: "无法读取照片。" },
});

/** 폴라로이드 한 칸 크기. 화면에서는 16rem, 카드에서는 420px로 그리니 이 정도면 충분하다. */
const SIDE = 600;

/** 가운데를 정사각형으로 잘라 줄인다. 원본은 어디에도 남기지 않는다. */
async function squareJpeg(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const crop = Math.min(bitmap.width, bitmap.height);
  const canvas = document.createElement("canvas");
  canvas.width = SIDE;
  canvas.height = SIDE;
  canvas.getContext("2d")!.drawImage(bitmap, (bitmap.width - crop) / 2, (bitmap.height - crop) / 2, crop, crop, 0, 0, SIDE, SIDE);
  bitmap.close();
  for (const quality of [0.82, 0.7, 0.55]) {
    const url = canvas.toDataURL("image/jpeg", quality);
    if (url.length <= OWN_PHOTO_MAX) return url;
  }
  throw new Error("too large");
}

/**
 * 폴라로이드 아래 작은 줄. 고른 사진은 이 기기의 기록에만 들어가고, 화면과 공유 카드에 같이 쓰인다.
 */
export default function OwnPhotoPicker({
  value,
  onChange,
}: {
  value: string | undefined;
  onChange: (next: string | undefined) => void;
}) {
  const t = tr(COPY);
  return (
    <div className="flex justify-center gap-3 text-xs text-ink-400">
      <label className="cursor-pointer underline">
        {t.pick}
        <input
          type="file"
          accept="image/*"
          className="sr-only"
          data-testid="own-photo"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            if (!file) return;
            try {
              onChange(await squareJpeg(file));
            } catch {
              window.alert(t.failed);
            }
          }}
        />
      </label>
      {value && (
        <button type="button" className="underline" onClick={() => onChange(undefined)}>
          {t.reset}
        </button>
      )}
    </div>
  );
}

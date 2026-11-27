"use client";

import { useEffect, useRef, useState } from "react";

import { centerCrop, clampCrop, cropSide, MAX_ZOOM, type Crop } from "@/lib/crop";
import { defineCopy, tr } from "@/lib/i18n";
import { OWN_PHOTO_MAX } from "@/lib/store";

const COPY = defineCopy({
  ko: {
    pick: "내 사진 넣기", reset: "원래 사진으로", failed: "사진을 읽지 못했어요.",
    title: "사진 맞추기", hint: "끌어서 옮기고, 아래 막대로 키워 보세요.", zoom: "크기", cancel: "취소", done: "이대로 넣기",
  },
  en: {
    pick: "Use my photo", reset: "Back to original", failed: "Couldn't read that photo.",
    title: "Fit the photo", hint: "Drag to move it, use the slider to zoom.", zoom: "Size", cancel: "Cancel", done: "Use this",
  },
  ja: {
    pick: "自分の写真にする", reset: "元の写真に戻す", failed: "写真を読み込めませんでした。",
    title: "写真を合わせる", hint: "ドラッグで動かし、下のバーで拡大します。", zoom: "大きさ", cancel: "キャンセル", done: "これにする",
  },
  es: {
    pick: "Poner mi foto", reset: "Volver a la original", failed: "No se pudo leer la foto.",
    title: "Ajustar la foto", hint: "Arrástrala para moverla y usa la barra para acercar.", zoom: "Tamaño", cancel: "Cancelar", done: "Usar así",
  },
  zh: {
    pick: "换成我的照片", reset: "恢复原图", failed: "无法读取照片。",
    title: "调整照片", hint: "拖动来移动，用下面的滑块放大。", zoom: "大小", cancel: "取消", done: "就用这张",
  },
});

/** 폴라로이드 한 칸 크기. 화면에서는 16rem, 카드에서는 420px로 그리니 이 정도면 충분하다. */
const SIDE = 600;

/** 고른 칸을 정사각형으로 잘라 줄인다. 원본은 어디에도 남기지 않는다. */
function squareJpeg(bitmap: ImageBitmap, crop: Crop): string {
  const side = cropSide(bitmap.width, bitmap.height, crop.zoom);
  const canvas = document.createElement("canvas");
  canvas.width = SIDE;
  canvas.height = SIDE;
  canvas.getContext("2d")!.drawImage(bitmap, crop.cx - side / 2, crop.cy - side / 2, side, side, 0, 0, SIDE, SIDE);
  for (const quality of [0.82, 0.7, 0.55]) {
    const url = canvas.toDataURL("image/jpeg", quality);
    if (url.length <= OWN_PHOTO_MAX) return url;
  }
  throw new Error("too large");
}

/**
 * 고른 사진을 폴라로이드 칸에 맞추는 창. 끌어서 옮기고 막대로 키운다(화살표 키로도 옮긴다).
 * 단체 사진에서 한 사람만 오려 넣을 수 있게.
 */
function CropDialog({ bitmap, src, onDone, onCancel }: {
  bitmap: ImageBitmap;
  src: string;
  onDone: (crop: Crop) => void;
  onCancel: () => void;
}) {
  const t = tr(COPY);
  const ref = useRef<HTMLDialogElement>(null);
  const frame = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; y: number } | null>(null);
  const { width: w, height: h } = bitmap;
  const [crop, setCrop] = useState<Crop>(() => centerCrop(w, h));
  const [view, setView] = useState(256);

  useEffect(() => {
    ref.current?.showModal();
    if (frame.current) setView(frame.current.clientWidth);
  }, []);

  const side = cropSide(w, h, crop.zoom);
  const scale = view / side;
  const move = (dx: number, dy: number) => setCrop((c) => clampCrop(w, h, { ...c, cx: c.cx - dx / scale, cy: c.cy - dy / scale }));

  return (
    <dialog
      ref={ref}
      aria-labelledby="crop-title"
      className="m-auto w-[min(22rem,calc(100vw-2rem))] rounded-2xl bg-surface p-5 text-ink-900 backdrop:bg-black/50"
      onCancel={(e) => {
        e.preventDefault();
        onCancel();
      }}
    >
      <h2 id="crop-title" className="text-base font-semibold">{t.title}</h2>
      <p className="mt-1 text-xs text-ink-400">{t.hint}</p>
      <div
        ref={frame}
        tabIndex={0}
        data-testid="crop-frame"
        className="relative mt-4 aspect-square w-full cursor-grab touch-none overflow-hidden rounded-sm bg-ink-900/10 outline-offset-2 select-none active:cursor-grabbing"
        onPointerDown={(e) => {
          drag.current = { x: e.clientX, y: e.clientY };
          e.currentTarget.setPointerCapture(e.pointerId);
        }}
        onPointerMove={(e) => {
          if (!drag.current) return;
          move(e.clientX - drag.current.x, e.clientY - drag.current.y);
          drag.current = { x: e.clientX, y: e.clientY };
        }}
        onPointerUp={() => (drag.current = null)}
        onPointerCancel={() => (drag.current = null)}
        onKeyDown={(e) => {
          const step = { ArrowLeft: [10, 0], ArrowRight: [-10, 0], ArrowUp: [0, 10], ArrowDown: [0, -10] }[e.key];
          if (!step) return;
          e.preventDefault();
          move(step[0], step[1]);
        }}
      >
        <img
          src={src}
          alt=""
          draggable={false}
          className="pointer-events-none absolute top-0 left-0 max-w-none origin-top-left"
          style={{ width: w, height: h, transform: `translate(${view / 2 - crop.cx * scale}px, ${view / 2 - crop.cy * scale}px) scale(${scale})` }}
        />
      </div>
      <label className="mt-4 flex items-center gap-3 text-xs text-ink-400">
        {t.zoom}
        <input
          type="range"
          min={1}
          max={MAX_ZOOM}
          step={0.01}
          value={crop.zoom}
          className="flex-1 accent-ink-800"
          onChange={(e) => {
            const zoom = Number(e.target.value);
            setCrop((c) => clampCrop(w, h, { ...c, zoom }));
          }}
        />
      </label>
      <div className="mt-5 flex justify-end gap-2">
        <button type="button" className="btn-secondary" onClick={onCancel}>{t.cancel}</button>
        <button type="button" className="btn-primary" onClick={() => onDone(crop)}>{t.done}</button>
      </div>
    </dialog>
  );
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
  const [picked, setPicked] = useState<{ bitmap: ImageBitmap; src: string } | null>(null);
  const close = () => {
    if (!picked) return;
    picked.bitmap.close();
    URL.revokeObjectURL(picked.src);
    setPicked(null);
  };
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
              setPicked({ bitmap: await createImageBitmap(file), src: URL.createObjectURL(file) });
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
      {picked && (
        <CropDialog
          bitmap={picked.bitmap}
          src={picked.src}
          onCancel={close}
          onDone={(crop) => {
            try {
              onChange(squareJpeg(picked.bitmap, crop));
            } catch {
              window.alert(t.failed);
            }
            close();
          }}
        />
      )}
    </div>
  );
}

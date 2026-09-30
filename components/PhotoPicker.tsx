"use client";

import { useId } from "react";

import { defineCopy, tr } from "@/lib/i18n";
import { PHOTOS, photoSrc } from "@/lib/photos";

/* 화면 낭독기와 툴팁이 읽을 사진 이름. 순서는 lib/photos.ts의 PHOTOS와 같다. */
const NAMES = defineCopy<string[]>({
  ko: ["밥상", "자전거", "툇마루", "이층침대", "머그잔 둘", "스케치북", "포장마차", "벚꽃길", "여름 바다", "공항 창밖", "고향길", "책장", "서핑", "기타", "눈 온 골목", "산책", "수영장", "목공", "졸업식", "운동회", "첫 월급", "부케", "이삿짐", "기찻길"],
  en: ["Family meal", "Bicycle", "Porch", "Bunk bed", "Two mugs", "Sketchbook", "Street tent", "Cherry blossoms", "Summer sea", "Airport window", "Road home", "Bookshelf", "Surfing", "Guitar", "Snowy alley", "Walk", "Pool", "Woodwork", "Graduation", "Sports day", "First paycheck", "Bouquet", "Moving boxes", "Railway"],
  ja: ["食卓", "自転車", "縁側", "二段ベッド", "マグカップ", "スケッチブック", "屋台", "桜並木", "夏の海", "空港の窓", "帰り道", "本棚", "サーフィン", "ギター", "雪の路地", "散歩", "プール", "木工", "卒業式", "運動会", "初任給", "ブーケ", "引っ越し", "線路"],
  es: ["Comida en familia", "Bicicleta", "Porche", "Litera", "Dos tazas", "Cuaderno", "Puesto callejero", "Cerezos", "Mar de verano", "Ventana del aeropuerto", "Camino a casa", "Estantería", "Surf", "Guitarra", "Callejón nevado", "Paseo", "Piscina", "Carpintería", "Graduación", "Día deportivo", "Primer sueldo", "Ramo", "Mudanza", "Vías del tren"],
  zh: ["家常饭", "自行车", "檐廊", "双层床", "两个杯子", "素描本", "路边摊", "樱花路", "夏日海边", "机场窗外", "回乡路", "书架", "冲浪", "吉他", "雪中小巷", "散步", "泳池", "木工", "毕业典礼", "运动会", "第一份工资", "捧花", "搬家", "铁路"],
});

const COPY = defineCopy({
  ko: { legend: "사진" },
  en: { legend: "Photo" },
  ja: { legend: "写真" },
  es: { legend: "Foto" },
  zh: { legend: "照片" },
});

export default function PhotoPicker({ value, onChange }: { value: string; onChange: (key: string) => void }) {
  const names = tr(NAMES);
  const group = useId();
  return (
    <fieldset>
      <legend className="label">{tr(COPY).legend}</legend>
      <div className="grid grid-cols-6 gap-2">
        {PHOTOS.map(({ key }, i) => (
          <label key={key} title={names[i]} className="cursor-pointer">
            <input
              type="radio"
              name={group}
              value={key}
              checked={value === key}
              onChange={() => onChange(key)}
              // 이미 걸린 사진(이모지·id로 자동으로 고른 것)을 다시 눌러도 onChange는 나지 않는다.
              // 그래도 "이걸로 하겠다"는 선택이므로 적어 둔다. 안 그러면 나중에 이모지를 바꿀 때
              // 사진이 말없이 따라 바뀐다.
              onClick={() => onChange(key)}
              className="peer sr-only"
              aria-label={names[i]}
            />
            <img
              src={photoSrc(key)}
              alt=""
              loading="lazy"
              className="aspect-square w-full rounded-md object-cover opacity-70 ring-offset-2 ring-offset-surface transition peer-checked:opacity-100 peer-checked:ring-2 peer-checked:ring-ink-800 peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-4 peer-focus-visible:outline-ink-800"
            />
          </label>
        ))}
      </div>
    </fieldset>
  );
}

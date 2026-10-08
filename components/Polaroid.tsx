const WIDTH = { sm: "w-12", md: "w-full", lg: "w-full max-w-[16rem]" } as const;

/*
 * 사진은 꾸밈이다(alt=""). 누구의 사진인지는 옆의 이름이 말한다 — 화면 낭독기가
 * "부엌 식탁 사진"을 읽어 봐야 어머니에 대해 알려 주는 것이 없다.
 * 기울기는 움직임을 줄인 사람에게는 걷는다.
 */
export default function Polaroid({
  src,
  size,
  tilt = 0,
  children,
}: {
  /** 그림 주소(lib/photos.ts의 imageFor). */
  src: string;
  size: keyof typeof WIDTH;
  tilt?: number;
  children?: React.ReactNode;
}) {
  return (
    <span
      className={`polaroid shrink-0 motion-safe:transition-transform motion-reduce:!transform-none ${WIDTH[size]} ${size === "sm" ? "p-1 pb-1.5" : ""}`}
      style={tilt ? { transform: `rotate(${tilt}deg)` } : undefined}
    >
      <img src={src} alt="" loading="lazy" decoding="async" />
      {children}
    </span>
  );
}

/** ZIYO robot — rasm emas, div'lardan yig'ilgan (components.md Â§7). */
export function ZiyoMascot({
  size = 54,
  bob = true,
  halo = true,
}: {
  size?: number;
  bob?: boolean;
  halo?: boolean;
}) {
  const screenW = Math.round(size * 0.65);
  const screenH = Math.round(size * 0.43);
  const eyeW = Math.max(4, Math.round(size * 0.11));
  const eyeH = Math.max(8, Math.round(size * 0.2));

  return (
    <div
      aria-hidden="true"
      className={`imk-mascot ${bob ? 'imk-mascot--bob' : ''}`}
      style={{ width: size, height: size }}
    >
      {halo && <div className="imk-mascot__halo" />}
      <div className="imk-mascot__antenna" />
      <div
        className="imk-mascot__body"
        style={{ width: size, height: size, borderRadius: Math.round(size * 0.35) }}
      >
        <div
          className="imk-mascot__screen"
          style={{ width: screenW, height: screenH, borderRadius: Math.round(screenH * 0.4) }}
        >
          <div className="imk-mascot__eye" style={{ width: eyeW, height: eyeH }} />
          <div className="imk-mascot__eye" style={{ width: eyeW, height: eyeH }} />
        </div>
      </div>
    </div>
  );
}

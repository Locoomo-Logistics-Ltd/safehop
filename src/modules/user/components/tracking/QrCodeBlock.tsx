/**
 * Styled QR placeholder.
 *
 * SWAP POINT: replace the inner SVG pattern with a real QR code
 * generated from `value` (e.g. via the `qrcode` npm package) when
 * you're ready — the prop contract stays identical.
 */
export function QrCodeBlock({ value }: { value: string }) {
  return (
    <div className="flex flex-col items-center gap-3 py-2">
      <div className="w-[140px] h-[140px] rounded-[16px] bg-white border border-border-default p-3 flex items-center justify-center">
        <QrPatternPlaceholder />
      </div>
      <p className="text-[12px] font-mono tracking-wide text-text-muted">{value}</p>
    </div>
  );
}

function QrPatternPlaceholder() {
  // Deterministic-looking decorative grid — purely visual, not a real QR.
  const cells = Array.from({ length: 49 });
  return (
    <svg viewBox="0 0 70 70" className="w-full h-full" aria-label="QR code placeholder" role="img">
      <rect width="70" height="70" fill="white" />
      {cells.map((_, i) => {
        const row = Math.floor(i / 7);
        const col = i % 7;
        const seed = (row * 13 + col * 7) % 5;
        if (seed === 0) return null;
        return (
          <rect key={i} x={col * 10} y={row * 10} width="8" height="8" fill="#0B1530" rx="1.5" />
        );
      })}
      {/* Corner markers, like a real QR code */}
      <rect x="0" y="0" width="18" height="18" fill="none" stroke="#0B1530" strokeWidth="3" />
      <rect x="52" y="0" width="18" height="18" fill="none" stroke="#0B1530" strokeWidth="3" />
      <rect x="0" y="52" width="18" height="18" fill="none" stroke="#0B1530" strokeWidth="3" />
    </svg>
  );
}

/* eslint-disable @next/next/no-img-element */
export function ReceiptQrCode({ value }: { value: string }) {
  const src = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(value)}`;
  return (
    <div className="inline-flex rounded-xl border border-sobaya-border bg-white p-3">
      <img src={src} alt={`QR de vérification ${value}`} width={180} height={180} className="h-[180px] w-[180px]" />
    </div>
  );
}

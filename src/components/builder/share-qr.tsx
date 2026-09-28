import { Heart } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

export function ShareQr({ url }: { url: string }) {
  return (
    <div className="mx-auto mt-8 flex w-fit flex-col items-center gap-3">
      <div className="relative rounded-[20px] bg-white p-2 shadow-[0_18px_60px_rgba(0,0,0,.2)]">
        <QRCodeSVG
          value={url}
          size={192}
          level="H"
          marginSize={4}
          bgColor="#ffffff"
          fgColor="#28121a"
          title="QR-код для открытия открытки"
        />
        <span aria-hidden="true" className="absolute left-1/2 top-1/2 flex size-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white">
          <Heart className="size-5 fill-[#bd4f6c] text-[#bd4f6c]" />
        </span>
      </div>
      <p className="text-xs text-[#bda6a4]">Или покажите QR-код, чтобы открыть открытку</p>
    </div>
  );
}

"use client";

import { useRef, useState } from "react";
import { Crop, ImagePlus, Move, RotateCcw, ZoomIn } from "lucide-react";
import { CroppedImage } from "@/components/ui/cropped-image";
import {
  DEFAULT_PHOTO_CROP,
  movePhotoCrop,
  normalizePhotoCrop,
  PHOTO_CROP_MAX_ZOOM,
  PHOTO_CROP_MIN_ZOOM,
  PHOTO_FRAME_BORDER_RADIUS,
  type PhotoCrop,
  type PhotoSize,
} from "@/lib/photo-crop";

type PhotoEditorProps = {
  src: string;
  fileName: string;
  inputId?: string;
  crop: PhotoCrop;
  onCropChange: (crop: PhotoCrop) => void;
};

type DragState = {
  pointerId: number;
  startX: number;
  startY: number;
  crop: PhotoCrop;
};

export function PhotoEditor({ src, fileName, inputId = "photo", crop, onCropChange }: PhotoEditorProps) {
  const frameRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<DragState | null>(null);
  const [imageSize, setImageSize] = useState<PhotoSize>({ width: 0, height: 0 });
  const [dragging, setDragging] = useState(false);

  const moveFromStart = (deltaX: number, deltaY: number, startCrop = crop) => {
    const frame = frameRef.current;
    if (!frame || imageSize.width <= 0) return;
    onCropChange(
      movePhotoCrop(
        startCrop,
        deltaX,
        deltaY,
        { width: frame.clientWidth, height: frame.clientHeight },
        imageSize,
      ),
    );
  };

  const endDrag = (pointerId: number) => {
    if (dragRef.current?.pointerId !== pointerId) return;
    dragRef.current = null;
    setDragging(false);
  };

  return (
    <div>
      <div
        ref={frameRef}
        role="group"
        tabIndex={0}
        aria-label="Кадрирование фотографии. Перетаскивайте изображение или используйте стрелки."
        style={{ borderRadius: PHOTO_FRAME_BORDER_RADIUS }}
        onPointerDown={(event) => {
          if (imageSize.width <= 0 || dragRef.current) return;
          event.currentTarget.setPointerCapture(event.pointerId);
          dragRef.current = {
            pointerId: event.pointerId,
            startX: event.clientX,
            startY: event.clientY,
            crop,
          };
          setDragging(true);
        }}
        onPointerMove={(event) => {
          const drag = dragRef.current;
          if (!drag || drag.pointerId !== event.pointerId) return;
          moveFromStart(event.clientX - drag.startX, event.clientY - drag.startY, drag.crop);
        }}
        onPointerUp={(event) => endDrag(event.pointerId)}
        onPointerCancel={(event) => endDrag(event.pointerId)}
        onKeyDown={(event) => {
          const directions: Record<string, [number, number]> = {
            ArrowLeft: [-10, 0],
            ArrowRight: [10, 0],
            ArrowUp: [0, -10],
            ArrowDown: [0, 10],
          };
          const direction = directions[event.key];
          if (!direction) return;
          event.preventDefault();
          moveFromStart(direction[0], direction[1]);
        }}
        className={`group relative mx-auto aspect-[4/5] w-full max-w-[330px] touch-none overflow-hidden border bg-[#32131d] shadow-[0_24px_75px_rgba(0,0,0,.36)] outline-none transition ${
          dragging
            ? "cursor-grabbing border-[#e5c78c]/55 ring-4 ring-[#bd4f6c]/12"
            : "cursor-grab border-[#e5c78c]/28 focus-visible:ring-4 focus-visible:ring-[#bd4f6c]/18"
        }`}
      >
        <CroppedImage
          src={src}
          alt="Предпросмотр фотографии"
          crop={crop}
          sizes="(max-width: 640px) 88vw, 330px"
          onImageSize={setImageSize}
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#1b0b11]/38 via-transparent to-white/[0.035]" />
        <div className={`pointer-events-none absolute inset-0 transition-opacity duration-200 ${dragging ? "opacity-100" : "opacity-0 group-hover:opacity-55"}`}>
          <span className="absolute inset-y-0 left-1/3 border-l border-white/18" />
          <span className="absolute inset-y-0 left-2/3 border-l border-white/18" />
          <span className="absolute inset-x-0 top-1/3 border-t border-white/18" />
          <span className="absolute inset-x-0 top-2/3 border-t border-white/18" />
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-5 flex justify-center">
          <span className="flex items-center gap-2 rounded-full border border-white/12 bg-[#1b0b11]/72 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#eadbd2] backdrop-blur-md">
            <Move className="size-3.5 text-[#d99ab0]" /> Двигайте фото
          </span>
        </div>
      </div>

      <div className="mx-auto mt-5 max-w-[390px] border-y border-white/[0.08] py-4">
        <div className="flex items-center gap-3">
          <ZoomIn className="size-4 shrink-0 text-[#d48aa0]" />
          <input
            type="range"
            suppressHydrationWarning
            min={PHOTO_CROP_MIN_ZOOM}
            max={PHOTO_CROP_MAX_ZOOM}
            step="0.01"
            value={crop.zoom}
            aria-label="Масштаб фотографии"
            onChange={(event) => {
              onCropChange(
                normalizePhotoCrop(
                  { ...crop, zoom: Number(event.target.value) },
                  imageSize,
                ),
              );
            }}
            className="h-1.5 min-w-0 flex-1 cursor-pointer accent-[#bd4f6c]"
          />
          <span className="w-10 text-right text-xs tabular-nums text-[#a98c95]">{Math.round(crop.zoom * 100)}%</span>
        </div>
        <div className="mt-4 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="flex items-center gap-1.5 text-xs font-semibold text-[#d9c5bf]"><Crop className="size-3.5 text-[#d48aa0]" /> Так фото откроется в финале</p>
            <p className="mt-1 truncate text-[10px] text-[#715f65]">{fileName}</p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() => onCropChange({ ...DEFAULT_PHOTO_CROP })}
              className="flex size-9 items-center justify-center rounded-full text-[#9f878e] transition hover:bg-white/[0.06] hover:text-[#eadbd2]"
              aria-label="Сбросить кадрирование"
            >
              <RotateCcw className="size-4" />
            </button>
            <label htmlFor={inputId} className="flex min-h-9 cursor-pointer items-center gap-1.5 rounded-full border border-white/12 px-3 text-[11px] font-semibold text-[#d9c5bf] transition hover:border-[#d48aa0]/40 hover:bg-white/[0.04]">
              <ImagePlus className="size-3.5" /> Заменить
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}

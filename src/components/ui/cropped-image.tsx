"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { getPhotoPlacement, type PhotoCrop, type PhotoSize } from "@/lib/photo-crop";
import { cn } from "@/lib/utils";

type CroppedImageProps = {
  src: string;
  alt: string;
  crop?: PhotoCrop;
  sizes: string;
  className?: string;
  onImageSize?: (size: PhotoSize) => void;
};

export function CroppedImage({
  src,
  alt,
  crop,
  sizes,
  className,
  onImageSize,
}: CroppedImageProps) {
  const frameRef = useRef<HTMLDivElement>(null);
  const [frameSize, setFrameSize] = useState<PhotoSize>({ width: 0, height: 0 });
  const [loadedImage, setLoadedImage] = useState<{ src: string; size: PhotoSize }>({
    src: "",
    size: { width: 0, height: 0 },
  });
  const imageSize = loadedImage.src === src ? loadedImage.size : { width: 0, height: 0 };

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;

    const measure = () => setFrameSize({ width: frame.clientWidth, height: frame.clientHeight });
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(frame);
    return () => observer.disconnect();
  }, []);

  const handleLoad = useCallback(
    (event: React.SyntheticEvent<HTMLImageElement>) => {
      const nextSize = {
        width: event.currentTarget.naturalWidth,
        height: event.currentTarget.naturalHeight,
      };
      setLoadedImage({ src, size: nextSize });
      onImageSize?.(nextSize);
    },
    [onImageSize, src],
  );

  const placement = crop ? getPhotoPlacement(frameSize, imageSize, crop) : null;

  return (
    <div ref={frameRef} className={cn("absolute inset-0 overflow-hidden", className)}>
      <Image
        src={src}
        alt={alt}
        width={imageSize.width || 1}
        height={imageSize.height || 1}
        sizes={sizes}
        unoptimized
        draggable={false}
        onLoad={handleLoad}
        className="select-none"
        style={
          placement
            ? {
                width: placement.width,
                height: placement.height,
                left: placement.left,
                top: placement.top,
                right: "auto",
                bottom: "auto",
                maxWidth: "none",
                objectFit: "fill",
                position: "absolute",
                transform: "translate(-50%, -50%)",
              }
            : {
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }
        }
      />
    </div>
  );
}

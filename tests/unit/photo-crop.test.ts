import { describe, expect, it } from "vitest";
import sharp from "sharp";
import {
  getPhotoCropRegion,
  getPhotoRenderPlan,
  movePhotoCrop,
  normalizePhotoCrop,
  type PhotoCrop,
} from "@/lib/photo-crop";

describe("photo crop", () => {
  it("creates a centered 4:5 crop for a landscape photo", () => {
    expect(getPhotoCropRegion({ width: 1600, height: 900 }, { x: 0.5, y: 0.5, zoom: 1 })).toEqual({
      left: 440,
      top: 0,
      width: 720,
      height: 900,
    });
  });

  it("keeps a zoomed crop inside image edges", () => {
    const crop = normalizePhotoCrop(
      { x: 0, y: 1, zoom: 2 },
      { width: 1000, height: 1000 },
    );

    expect(crop).toEqual({ x: 0.2, y: 0.75, zoom: 2 });
    expect(getPhotoCropRegion({ width: 1000, height: 1000 }, crop)).toEqual({
      left: 0,
      top: 500,
      width: 400,
      height: 500,
    });
  });

  it("moves the crop in the opposite direction to the dragged image", () => {
    const start: PhotoCrop = { x: 0.5, y: 0.5, zoom: 2 };
    const moved = movePhotoCrop(
      start,
      40,
      -25,
      { width: 320, height: 400 },
      { width: 1200, height: 1500 },
    );

    expect(moved.x).toBeCloseTo(0.4375);
    expect(moved.y).toBeCloseTo(0.53125);
  });

  it("allows zooming below 100% and plans the surrounding background", () => {
    const plan = getPhotoRenderPlan(
      { width: 1600, height: 900 },
      { x: 0.5, y: 0.5, zoom: 0.8 },
      { width: 1200, height: 1500 },
    );

    expect(plan).toEqual({
      source: { left: 350, top: 0, width: 900, height: 900 },
      destination: { left: 0, top: 150, width: 1200, height: 1200 },
    });
  });

  it("produces the same 4:5 frame in the image pipeline", async () => {
    const source = await sharp({
      create: {
        width: 1600,
        height: 900,
        channels: 3,
        background: "#bd4f6c",
      },
    })
      .png()
      .toBuffer();
    const outputSize = { width: 1200, height: 1500 };
    const plan = getPhotoRenderPlan(
      { width: 1600, height: 900 },
      { x: 0.6, y: 0.5, zoom: 1.5 },
      outputSize,
    );
    const rendered = await sharp(source)
      .extract(plan.source)
      .resize({ width: plan.destination.width, height: plan.destination.height, fit: "fill" })
      .png()
      .toBuffer();
    const result = await sharp({
      create: { ...outputSize, channels: 3, background: "#32131d" },
    })
      .composite([{ input: rendered, left: plan.destination.left, top: plan.destination.top }])
      .webp()
      .toBuffer();
    const metadata = await sharp(result).metadata();

    expect(metadata.width && metadata.height && metadata.width / metadata.height).toBeCloseTo(4 / 5);
  });
});

import { describe, expect, it } from "vitest";
import {
  buildReelTrack,
  FINAL_NEAR_MISS_OFFSETS,
  FINAL_NEAR_MISS_TIMES,
  getReelStopSeconds,
  REEL_DECELERATION_EASE,
  REEL_RESULTS,
  REEL_TARGET_INDEX,
} from "@/components/game/reel-script";

describe("deterministic reel script", () => {
  it("never returns the bad sign as a result", () => {
    expect(REEL_RESULTS.flat()).not.toContain("heartbreak");
  });

  it("guarantees three hearts in the final round", () => {
    expect(REEL_RESULTS[2]).toEqual(["heart", "heart", "heart"]);
  });

  it("shows heartbreak as the final near miss without landing on it", () => {
    const finalTrack = buildReelTrack(2, 2);
    expect(finalTrack[REEL_TARGET_INDEX - 1]).toBe("heartbreak");
    expect(finalTrack[REEL_TARGET_INDEX]).toBe("heart");
  });

  it("lets the bad sign pass through every spinning reel", () => {
    for (let round = 0; round < 3; round += 1) {
      for (let reel = 0; reel < 3; reel += 1) {
        expect(buildReelTrack(round, reel)).toContain("heartbreak");
      }
    }
  });

  it("stops the three reels one after another", () => {
    for (let round = 0; round < 3; round += 1) {
      const stops = [0, 1, 2].map((reel) =>
        getReelStopSeconds(round, reel),
      );
      expect(stops[1] - stops[0]).toBeGreaterThanOrEqual(0.6);
      expect(stops[2] - stops[1]).toBeGreaterThanOrEqual(0.6);
    }
  });

  it("keeps the spin long enough to build anticipation", () => {
    expect(getReelStopSeconds(0, 0)).toBeGreaterThanOrEqual(2.5);
    expect(getReelStopSeconds(0, 2)).toBeGreaterThanOrEqual(4.4);
    expect(getReelStopSeconds(2, 2)).toBeGreaterThanOrEqual(8);
  });

  it("uses one continuous curve that reaches zero speed at the finish", () => {
    expect(REEL_DECELERATION_EASE).toHaveLength(4);
    expect(REEL_DECELERATION_EASE[3]).toBe(1);
  });

  it("creeps across the near-miss line without stopping on it", () => {
    expect(FINAL_NEAR_MISS_OFFSETS[0]).toBeGreaterThan(0);
    expect(FINAL_NEAR_MISS_OFFSETS[1]).toBeLessThan(0);
    expect(FINAL_NEAR_MISS_TIMES[2] - FINAL_NEAR_MISS_TIMES[1]).toBeGreaterThanOrEqual(0.15);
  });
});

import { describe, expect, it } from "vitest";
import { createGameStore } from "@/store/game-store";

describe("game state machine", () => {
  it("never spins before the introduction is accepted", () => {
    const store = createGameStore();
    store.getState().spin();
    expect(store.getState().phase).toBe("intro");
  });

  it("runs two compliments and guarantees the final jackpot", () => {
    const store = createGameStore();
    store.getState().begin();

    for (const expectedRound of [0, 1] as const) {
      expect(store.getState().round).toBe(expectedRound);
      store.getState().spin();
      expect(store.getState().phase).toBe("spinning");
      store.getState().finishSpin();
      expect(store.getState().phase).toBe("reveal");
      store.getState().nextRound();
    }

    expect(store.getState().round).toBe(2);
    store.getState().spin();
    store.getState().finishSpin();
    expect(store.getState().phase).toBe("jackpot");
  });

  it("fully resets for replay", () => {
    const store = createGameStore();
    store.getState().begin();
    store.getState().spin();
    store.getState().finishSpin();
    store.getState().reset();
    expect(store.getState()).toMatchObject({ phase: "intro", round: 0 });
  });
});

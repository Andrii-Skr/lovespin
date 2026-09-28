"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { createStore, useStore, type StoreApi } from "zustand";

export type GamePhase = "intro" | "ready" | "spinning" | "reveal" | "jackpot";

export type GameState = {
  phase: GamePhase;
  round: 0 | 1 | 2;
  begin: () => void;
  spin: () => void;
  finishSpin: () => void;
  nextRound: () => void;
  reset: () => void;
};

export const initialGameState = { phase: "intro" as const, round: 0 as const };

export function createGameStore() {
  return createStore<GameState>((set) => ({
    ...initialGameState,
    begin: () => set({ phase: "ready", round: 0 }),
    spin: () =>
      set((state) => (state.phase === "ready" ? { phase: "spinning" } : state)),
    finishSpin: () =>
      set((state) => ({ phase: state.round === 2 ? "jackpot" : "reveal" })),
    nextRound: () =>
      set((state) =>
        state.phase === "reveal" && state.round < 2
          ? { round: (state.round + 1) as 1 | 2, phase: "ready" }
          : state,
      ),
    reset: () => set(initialGameState),
  }));
}

const GameStoreContext = createContext<StoreApi<GameState> | null>(null);

export function GameStoreProvider({ children }: { children: ReactNode }) {
  const [store] = useState(createGameStore);
  return <GameStoreContext.Provider value={store}>{children}</GameStoreContext.Provider>;
}

export function useGameStore<T>(selector: (state: GameState) => T) {
  const store = useContext(GameStoreContext);
  if (!store) throw new Error("useGameStore must be used inside GameStoreProvider");
  return useStore(store, selector);
}

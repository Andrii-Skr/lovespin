"use client";

import { motion } from "framer-motion";
import {
  Flower2,
  Gift,
  Heart,
  HeartCrack,
  Mail,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import {
  buildReelTrack,
  FINAL_NEAR_MISS_OFFSETS,
  FINAL_NEAR_MISS_TIMES,
  getReelResult,
  getReelStopSeconds,
  REEL_DECELERATION_EASE,
  REEL_TARGET_INDEX,
  RESTING_SYMBOLS,
  type ReelSymbol,
} from "@/components/game/reel-script";
import { cn } from "@/lib/utils";

const icons: Record<ReelSymbol, LucideIcon> = {
  heart: Heart,
  heartbreak: HeartCrack,
  letter: Mail,
  flower: Flower2,
  spark: Sparkles,
  gift: Gift,
};

const itemHeight = 82;

function SymbolIcon({ symbol, active = false }: { symbol: ReelSymbol; active?: boolean }) {
  const Icon = icons[symbol];
  const isBadSign = symbol === "heartbreak";
  return (
    <Icon
      aria-hidden="true"
      strokeWidth={1.5}
      className={cn(
        "size-9 transition-[color,filter,opacity] sm:size-10",
        isBadSign && "text-[#75545e] opacity-75",
        !isBadSign && !active && "text-[#d9b9c2]",
        active && "fill-[#c65575] text-[#f2adc1] drop-shadow-[0_0_16px_rgba(214,102,132,.55)]",
      )}
    />
  );
}

type ReelProps = {
  reel: number;
  round: number;
  spinning: boolean;
  showResult: boolean;
};

export function Reel({ reel, round, spinning, showResult }: ReelProps) {
  const result = getReelResult(round, reel);
  const track = buildReelTrack(round, reel);
  const duration = getReelStopSeconds(round, reel);
  // Трек начинается на половине высоты символа, поэтому индекс нужно
  // смещать ровно на itemHeight — тогда результат попадает в центр окна.
  const targetY = -(REEL_TARGET_INDEX * itemHeight);
  const nearMiss = -(REEL_TARGET_INDEX - 1) * itemHeight;
  const nearMissApproach = nearMiss + FINAL_NEAR_MISS_OFFSETS[0];
  const nearMissExit = nearMiss + FINAL_NEAR_MISS_OFFSETS[1];
  const finalThirdReel = round === 2 && reel === 2;

  return (
    <div className="relative h-[164px] min-w-0 flex-1 overflow-hidden rounded-[26px] border border-[#ead8cb]/20 bg-[linear-gradient(180deg,#11080b_0%,#1c0b11_50%,#10070a_100%)] shadow-[inset_0_0_38px_rgba(0,0,0,.7),0_1px_0_rgba(255,255,255,.05)]">
      <div className="pointer-events-none absolute inset-x-0 top-1/2 z-10 h-[82px] -translate-y-1/2 border-y border-[#e7c98e]/28 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,.035),transparent)]" />
      <div className="pointer-events-none absolute inset-x-4 top-0 z-20 h-px bg-gradient-to-r from-transparent via-white/18 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 h-12 bg-gradient-to-b from-black/65 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-12 bg-gradient-to-t from-black/65 to-transparent" />
      <div className="reel-mask absolute inset-0">
        {spinning ? (
          <motion.div
            key={`${round}-${reel}`}
            initial={{ y: 0, filter: "blur(0px)" }}
            animate={
              finalThirdReel
                ? {
                    y: [0, nearMissApproach, nearMissExit, targetY],
                    filter: ["blur(0px)", "blur(2px)", "blur(0px)", "blur(0px)"],
                  }
                : {
                    y: targetY,
                    filter: ["blur(0px)", "blur(2px)", "blur(1px)", "blur(0px)"],
                  }
            }
            transition={
              finalThirdReel
                ? {
                    y: {
                      duration,
                      times: [...FINAL_NEAR_MISS_TIMES],
                      ease: ["easeOut", "linear", "easeInOut"],
                    },
                    filter: {
                      duration,
                      times: [0, 0.66, 0.88, 1],
                      ease: "easeOut",
                    },
                  }
                : {
                    y: {
                      duration,
                      ease: [...REEL_DECELERATION_EASE],
                    },
                    filter: {
                      duration,
                      times: [0, 0.2, 0.86, 1],
                      ease: "easeOut",
                    },
                  }
            }
            className="absolute inset-x-0 top-[41px]"
          >
            {track.map((symbol, index) => (
              <div key={`${symbol}-${index}`} className="flex h-[82px] items-center justify-center">
                <SymbolIcon symbol={symbol} active={index === REEL_TARGET_INDEX && result === "heart"} />
              </div>
            ))}
          </motion.div>
        ) : (
          <motion.div
            key={`result-${round}-${reel}`}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <SymbolIcon symbol={showResult ? result : RESTING_SYMBOLS[reel]} active={showResult && result === "heart"} />
          </motion.div>
        )}
      </div>
    </div>
  );
}

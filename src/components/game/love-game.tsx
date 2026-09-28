"use client";

import { useEffect, useRef } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ExternalLink, FileText, Flower2, Gift, Heart, HeartCrack, Mail, RotateCcw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CroppedImage } from "@/components/ui/cropped-image";
import { Reel } from "@/components/game/reel";
import { getReelStopSeconds, getRoundRevealDelayMs } from "@/components/game/reel-script";
import { gameCopy, type GameLocale } from "@/components/game/game-copy";
import type { LovePageInput } from "@/lib/love-page-schema";
import { PHOTO_FRAME_BORDER_RADIUS, type PhotoCrop } from "@/lib/photo-crop";
import { cn } from "@/lib/utils";
import { GameStoreProvider, useGameStore } from "@/store/game-store";

type LoveGameProps = {
  data: LovePageInput;
  photoUrl?: string;
  photoCrop?: PhotoCrop;
  certificateUrl?: string;
  certificateName?: string;
  compact?: boolean;
  locale?: GameLocale;
};

const celebrationPieces = [
  { left: 5, delay: 0, duration: 4.2, drift: 38, kind: "gift" },
  { left: 13, delay: 0.65, duration: 4.7, drift: -24, kind: "sparkle" },
  { left: 21, delay: 0.3, duration: 4.4, drift: 30, kind: "gift" },
  { left: 29, delay: 1.15, duration: 4.8, drift: -22, kind: "heart" },
  { left: 38, delay: 0.8, duration: 4.6, drift: 25, kind: "sparkle" },
  { left: 62, delay: 0.4, duration: 4.5, drift: -30, kind: "gift" },
  { left: 71, delay: 1, duration: 4.9, drift: 28, kind: "heart" },
  { left: 79, delay: 0.15, duration: 4.3, drift: -32, kind: "gift" },
  { left: 87, delay: 0.9, duration: 4.7, drift: 20, kind: "sparkle" },
  { left: 95, delay: 0.5, duration: 4.4, drift: -35, kind: "gift" },
] as const;

function MiniRules({ locale }: { locale: GameLocale }) {
  const copy = gameCopy[locale];
  return (
    <div className="mb-5 grid w-full grid-cols-3 border-y border-white/[0.08] py-3" aria-label={copy.rules}>
      <div className="flex flex-col items-center gap-1.5 border-r border-white/[0.08] px-1 text-center">
        <div className="flex items-center gap-1 text-[#c9abb4]" aria-hidden="true">
          <Mail className="size-3.5" /><Flower2 className="size-3.5" /><Sparkles className="size-3.5" />
        </div>
        <span className="text-[8px] font-semibold uppercase tracking-[0.14em] text-[#89747b] sm:text-[9px]">{copy.compliment}</span>
      </div>
      <div className="flex flex-col items-center gap-1.5 border-r border-white/[0.08] px-1 text-center">
        <div className="flex items-center gap-0.5 text-[#d9829d]" aria-hidden="true">
          {[0, 1, 2].map((item) => <Heart key={item} className="size-3.5 fill-current" />)}
        </div>
        <span className="text-[8px] font-semibold uppercase tracking-[0.14em] text-[#9f7c87] sm:text-[9px]">{copy.grandPrize}</span>
      </div>
      <div className="flex flex-col items-center gap-1.5 px-1 text-center">
        <div className="flex items-center gap-0.5 text-[#6f535c]" aria-hidden="true">
          <HeartCrack className="size-3.5" />
        </div>
        <span className="text-[8px] font-semibold uppercase tracking-[0.14em] text-[#78666c] sm:text-[9px]">{copy.miss}</span>
      </div>
    </div>
  );
}

export function LoveGame(props: LoveGameProps) {
  return <GameStoreProvider><LoveGameInner {...props} /></GameStoreProvider>;
}

function LoveGameInner({
  data,
  photoUrl,
  photoCrop,
  certificateUrl,
  certificateName,
  compact = false,
  locale = "ru",
}: LoveGameProps) {
  const copy = gameCopy[locale];
  const phase = useGameStore((state) => state.phase);
  const round = useGameStore((state) => state.round);
  const begin = useGameStore((state) => state.begin);
  const spin = useGameStore((state) => state.spin);
  const finishSpin = useGameStore((state) => state.finishSpin);
  const nextRound = useGameStore((state) => state.nextRound);
  const reset = useGameStore((state) => state.reset);
  const reducedMotion = useReducedMotion() ?? false;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    reset();
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [reset]);

  const startSpin = () => {
    if (phase !== "ready") return;
    spin();
    timerRef.current = setTimeout(
      finishSpin,
      getRoundRevealDelayMs(round),
    );
  };

  const replay = () => {
    reset();
    window.setTimeout(begin, 220);
  };

  const compliment = round === 0 ? data.complimentOne : data.complimentTwo;

  return (
    <section
      className={cn(
        "velvet-bg grain relative isolate flex w-full overflow-x-hidden text-[#f7eadd]",
        compact ? "min-h-[680px] rounded-[34px]" : "min-h-[100svh]",
      )}
    >
      <div className="pointer-events-none absolute left-1/2 top-[42%] size-[560px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/[0.035]" />
      <div className="pointer-events-none absolute left-1/2 top-[42%] size-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#bd4f6c]/10" />

      <AnimatePresence mode="wait" initial={false}>
        {phase === "intro" ? (
          <motion.div
            key="intro"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: -20 }}
            className="relative z-10 m-auto flex w-full max-w-3xl flex-col items-center px-6 py-14 text-center"
          >
            <motion.div
              initial={{ scale: 0, rotate: -12 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", delay: 0.15, stiffness: 150 }}
              className="mb-8 flex size-14 items-center justify-center rounded-full border border-[#e7c98e]/30 bg-[#e7c98e]/[0.07]"
            >
              <Heart className="size-6 fill-[#bd4f6c] text-[#e99bb2]" strokeWidth={1.5} />
            </motion.div>
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.22 }}
              className="mb-5 text-[11px] font-semibold uppercase tracking-[0.32em] text-[#dcb4c0]"
            >
              {copy.introKicker}
            </motion.p>
            <motion.h1
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.32 }}
              className={cn("font-display max-w-2xl font-semibold leading-[0.93] tracking-[-0.035em]", compact ? "text-5xl" : "text-6xl sm:text-8xl")}
            >
              {data.recipientName},<br />{copy.introTitle}
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-7 max-w-md text-[15px] leading-7 text-[#d5c0ba] sm:text-base"
            >
              {data.introText}
            </motion.p>
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.62 }} className="mt-9">
              <Button size="lg" variant="accent" onClick={begin}>
                {copy.begin} <Heart className="size-4 fill-current" />
              </Button>
            </motion.div>
          </motion.div>
        ) : phase === "jackpot" ? (
          <motion.div
            key="jackpot"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="relative z-20 flex min-h-full w-full flex-col items-center justify-center px-5 py-10 sm:px-10"
          >
            {!reducedMotion && (
              <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
                {celebrationPieces.map(({ left, delay, duration, drift, kind }, index) => (
                  <motion.div
                    key={left}
                    initial={{ y: -64, x: 0, opacity: 0, rotate: -25 }}
                    animate={{ y: "110vh", x: drift, opacity: [0, 1, 1, 0], rotate: index % 2 ? 55 : -65 }}
                    transition={{ duration, delay, ease: "linear", times: [0, 0.15, 0.8, 1] }}
                    className={cn("absolute top-0", kind === "gift" ? "text-[#e5c78c]" : "text-[#d989a2]")}
                    style={{ left: `${left}%` }}
                  >
                    {kind === "gift" ? <Gift className="size-6 drop-shadow-[0_0_10px_rgba(229,199,140,.45)]" strokeWidth={1.6} />
                      : kind === "heart" ? <Heart className="size-4 fill-current" />
                        : <Sparkles className="size-5" strokeWidth={1.5} />}
                  </motion.div>
                ))}
              </div>
            )}
            {photoUrl ? (
              <motion.div
                initial={{ scale: 0.78, opacity: 0, y: 28 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                transition={{ type: "spring", damping: 18, stiffness: 110 }}
                style={{ borderRadius: PHOTO_FRAME_BORDER_RADIUS }}
                className="relative z-10 aspect-[4/5] w-full max-w-[330px] overflow-hidden border border-[#e7c98e]/35 bg-[#32131d] shadow-[0_30px_100px_rgba(0,0,0,.48),0_0_80px_rgba(229,199,140,.11)]"
              >
                <CroppedImage
                  src={photoUrl}
                  alt={copy.photoAlt(data.recipientName)}
                  crop={photoCrop}
                  sizes="330px"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#1b0b11]/65 via-transparent to-white/[0.05]" />
              </motion.div>
            ) : certificateUrl ? (
              <motion.a
                href={certificateUrl}
                target="_blank"
                rel="noreferrer"
                initial={{ scale: 0.78, opacity: 0, y: 28 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                transition={{ type: "spring", damping: 18, stiffness: 110 }}
                className="group relative z-10 flex aspect-[4/5] w-full max-w-[330px] flex-col items-center justify-center overflow-hidden rounded-[28px] border border-[#e7c98e]/35 bg-[radial-gradient(circle_at_50%_25%,rgba(229,199,140,.13),transparent_48%),#32131d] px-8 text-center shadow-[0_30px_100px_rgba(0,0,0,.48),0_0_80px_rgba(229,199,140,.11)] transition hover:border-[#e7c98e]/55"
                aria-label={copy.certificateAlt(certificateName ?? "").trim()}
              >
                <span className="absolute inset-4 rounded-[20px] border border-[#e5c78c]/10" />
                <span className="relative flex size-20 items-center justify-center rounded-full border border-[#e5c78c]/25 bg-[#e5c78c]/[0.08]">
                  <FileText className="size-9 text-[#e5c78c]" strokeWidth={1.4} />
                </span>
                <span className="relative mt-7 text-[10px] font-bold uppercase tracking-[0.32em] text-[#d6b879]">{copy.certificate}</span>
                <span className="relative mt-3 line-clamp-2 max-w-full text-sm font-semibold leading-5 text-[#eadbd2]">{certificateName ?? copy.certificate}</span>
                <span className="relative mt-7 flex items-center gap-2 text-xs font-semibold text-[#d9a9b7] transition group-hover:text-[#f0c3d0]">{copy.open} <ExternalLink className="size-3.5" /></span>
              </motion.a>
            ) : null}
            <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="relative z-10 mt-7 w-full max-w-xl text-center">
              <div className="mb-3 flex items-center justify-center gap-2 text-[#e5c78c]">
                <Sparkles className="size-4" />
                <span className="text-[11px] font-bold uppercase tracking-[0.3em]">{copy.grandPrize}</span>
                <Sparkles className="size-4" />
              </div>
              <h2 className={cn("font-display gold-text break-words font-semibold leading-none", compact ? "text-5xl" : "text-5xl sm:text-7xl")}>{data.prizeTitle}</h2>
              <p className="mx-auto mt-4 max-w-md text-[15px] leading-7 text-[#e4d4ca]">{data.prizeMessage}</p>
              <p className="font-display mt-4 text-2xl italic text-[#d89aae]">{copy.withLove}, {data.senderName}</p>
              <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
                {certificateUrl ? (
                  <Button variant="accent" asChild>
                    <a href={certificateUrl} target="_blank" rel="noreferrer">
                      <FileText className="size-4" /> {copy.open} {copy.certificate}
                    </a>
                  </Button>
                ) : null}
                <Button variant="outline" onClick={replay}>
                  <RotateCcw className="size-4" /> {copy.replay}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        ) : (
          <motion.div
            key="machine"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className={cn(
              "relative z-10 mx-auto flex w-full max-w-2xl flex-col items-center justify-center px-4 py-8 [overflow-anchor:none] sm:px-8",
              compact ? "min-h-[680px]" : "min-h-[100svh]",
            )}
          >
            <div className="mb-5 flex items-center gap-3 text-[10px] font-semibold uppercase tracking-[0.28em] text-[#bb9fa7]">
              <span>LoveSpin</span><span className="size-1 rounded-full bg-[#bd4f6c]" /><span>{copy.spinCount(round + 1)}</span>
            </div>
            <h2 className="font-display mb-5 text-center text-4xl font-semibold leading-none sm:text-5xl">
              {copy.roundTitles[round]}
            </h2>
            <MiniRules locale={locale} />
            <div className="relative w-full rounded-[42px] border border-[#e5c78c]/28 bg-[radial-gradient(circle_at_50%_0%,rgba(111,39,61,.28),transparent_55%),rgba(36,13,21,.92)] p-3 shadow-[0_34px_110px_rgba(0,0,0,.5),inset_0_1px_0_rgba(255,255,255,.08),0_0_60px_rgba(107,37,58,.08)] sm:p-5">
              <div className="pointer-events-none absolute -inset-px rounded-[42px] bg-gradient-to-b from-white/[0.055] via-transparent to-black/10" />
              <div className="pointer-events-none absolute left-5 top-3 size-1 rounded-full bg-[#d9b67c]/35 shadow-[0_0_8px_rgba(229,199,140,.25)]" />
              <div className="pointer-events-none absolute right-5 top-3 size-1 rounded-full bg-[#d9b67c]/35 shadow-[0_0_8px_rgba(229,199,140,.25)]" />
              <div className="relative flex gap-2 sm:gap-3">
                {[0, 1, 2].map((reel) => (
                  <Reel key={reel} reel={reel} round={round} spinning={phase === "spinning"} showResult={phase === "reveal"} />
                ))}
              </div>
              <div className="relative mt-4 flex items-center justify-between px-2 pb-1 text-[10px] uppercase tracking-[0.2em] text-[#886f76]">
                <span>{copy.machineHint}</span><Heart className="size-3 fill-[#8d4b61] text-[#8d4b61]" />
              </div>
            </div>

            <div className="relative mt-3 h-[208px] w-full text-center sm:h-[184px]" aria-live="polite">
              <div className="absolute inset-x-0 top-0 h-5">
                {phase === "spinning" && round === 2 ? (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0, 0, 1, 1, 0] }}
                    transition={{
                      duration: getReelStopSeconds(2, 2),
                      times: [0, 0.76, 0.83, 0.95, 1],
                    }}
                    className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#80616b]"
                  >
                    {copy.falseAlarm}
                  </motion.p>
                ) : null}
              </div>

              <AnimatePresence mode="wait" initial={false}>
                {phase === "reveal" ? (
                  <motion.div
                    key={`reveal-${round}`}
                    initial={{ opacity: 0, y: 18, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute inset-x-0 top-7 mx-auto max-w-xl"
                  >
                    <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.28em] text-[#d48aa0]">{copy.win}</p>
                    <p className="font-display text-3xl font-semibold leading-tight">{compliment}</p>
                    <Button className="mt-5" onClick={nextRound}>{copy.next} <Heart className="size-4 fill-current" /></Button>
                  </motion.div>
                ) : (
                  <motion.div
                    key="spin-button"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute inset-x-0 top-7 flex justify-center"
                  >
                    <Button size="lg" variant="accent" onClick={startSpin} disabled={phase === "spinning"}>
                      {phase === "spinning" ? copy.spinning : round === 2 ? copy.lastChance : copy.spin}
                      {round === 2 ? <Gift className="size-4" /> : <Sparkles className="size-4" />}
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

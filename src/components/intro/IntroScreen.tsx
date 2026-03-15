import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";

declare global {
  interface Window {
    __reverieIntroSoundPlayed?: boolean;
  }
}

function playIntroSound() {
  const AudioCtor = window.AudioContext || (window as typeof window & {
    webkitAudioContext?: typeof AudioContext;
  }).webkitAudioContext;

  if (!AudioCtor) return;

  const context = new AudioCtor();
  const master = context.createGain();
  master.gain.value = 0.02;
  master.connect(context.destination);

  [220, 330, 440].forEach((freq, index) => {
    const osc = context.createOscillator();
    const gain = context.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    gain.gain.value = 0;
    osc.connect(gain);
    gain.connect(master);
    const start = context.currentTime + index * 0.18;
    gain.gain.linearRampToValueAtTime(0.3, start + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.001, start + 0.85);
    osc.start(start);
    osc.stop(start + 0.9);
  });
}

export function IntroScreen({
  onComplete,
  soundEnabled = true,
}: {
  onComplete: () => void;
  soundEnabled?: boolean;
}) {
  const [visible, setVisible] = useState(true);
  const audioPlayed = useRef(false);
  const duration = 4600;

  const particles = useMemo(
    () =>
      Array.from({ length: 14 }, (_, i) => ({
        id: i,
        left: `${8 + i * 6}%`,
        delay: i * 0.12,
      })),
    [],
  );

  useEffect(() => {
    if (soundEnabled && !audioPlayed.current) {
      audioPlayed.current = true;
      const onFirstGesture = () => {
        if (window.__reverieIntroSoundPlayed) return;
        window.__reverieIntroSoundPlayed = true;
        try {
          playIntroSound();
        } catch {
          // If the browser still blocks audio, fail silently.
        }
        window.removeEventListener("pointerdown", onFirstGesture);
        window.removeEventListener("keydown", onFirstGesture);
      };

      window.addEventListener("pointerdown", onFirstGesture, { once: true });
      window.addEventListener("keydown", onFirstGesture, { once: true });

      return () => {
        window.removeEventListener("pointerdown", onFirstGesture);
        window.removeEventListener("keydown", onFirstGesture);
      };
    }

    const timer = window.setTimeout(() => {
      setVisible(false);
      window.setTimeout(onComplete, 600);
    }, duration);

    return () => window.clearTimeout(timer);
  }, [onComplete, soundEnabled]);

  return (
    <AnimatePresence>
      {visible ? (
        <motion.div
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-[100] overflow-hidden bg-[#03060b]"
          exit={{ opacity: 0 }}
          initial={{ opacity: 1 }}
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(207,176,122,0.14),transparent_40%)]" />
          {particles.map((particle) => (
            <motion.div
              key={particle.id}
              animate={{ opacity: [0.05, 0.3, 0], y: [0, -30, -100] }}
              className="absolute top-[70%] h-24 w-px bg-gradient-to-t from-transparent via-gold/70 to-transparent"
              initial={{ opacity: 0, y: 0 }}
              style={{ left: particle.left }}
              transition={{
                duration: 3.4,
                delay: particle.delay,
                repeat: Infinity,
                ease: "easeOut",
              }}
            />
          ))}
          <div className="relative flex h-full items-center justify-center">
            <motion.div
              animate={{ opacity: [0, 1, 1, 0.8], scale: [0.8, 1, 1.04, 1] }}
              className="relative"
              initial={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 2.8, ease: [0.19, 1, 0.22, 1] }}
            >
              <motion.div
                animate={{ opacity: [0.1, 0.35, 0.1], scale: [0.9, 1.2, 1.4] }}
                className="absolute inset-0 rounded-full bg-gold/20 blur-[90px]"
                transition={{ duration: 3.4, repeat: Infinity }}
              />
              <motion.div
                animate={{ letterSpacing: ["0.1em", "0.28em", "0.24em"] }}
                className="relative font-display text-[8rem] font-semibold text-gradient sm:text-[11rem]"
                transition={{ duration: 2.6 }}
              >
                R
              </motion.div>
              <motion.p
                animate={{ opacity: [0, 0.8, 0.6], y: [16, 0, 0] }}
                className="mt-6 text-center text-xs uppercase tracking-[0.72em] text-white/60 sm:text-sm"
                transition={{ duration: 2.2, delay: 0.35 }}
              >
                Reverie
              </motion.p>
            </motion.div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

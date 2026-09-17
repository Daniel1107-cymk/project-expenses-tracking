"use client";

import { useEffect, useRef, useState } from "react";
import { animate, useReducedMotion } from "motion/react";
import { formatRupiah } from "@/lib/rupiah";

// ponytail: satu-satunya animasi non-CSS di aplikasi ini. Motivasi: umpan balik
// bahwa angka total ini hidup mengikuti filter, bukan cuma efek. Nilai awal
// dirender di server (angka penuh langsung terlihat tanpa JS); begitu ter-hidrasi,
// perubahan nilai (klik filter) dihitung naik/turun dari nilai lama.
export function AnimatedRupiah({ value, className }: { value: number; className?: string }) {
  const [display, setDisplay] = useState(value);
  const prev = useRef(value);
  const reduce = useReducedMotion();

  useEffect(() => {
    if (prev.current === value) return;
    if (reduce) {
      prev.current = value;
      setDisplay(value);
      return;
    }
    const controls = animate(prev.current, value, {
      duration: 0.5,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => setDisplay(Math.round(v)),
    });
    prev.current = value;
    return () => controls.stop();
  }, [value, reduce]);

  return <span className={className}>{formatRupiah(display)}</span>;
}

"use client";

import { useRef } from "react";
import Image from "next/image";
import { motion, useScroll, useTransform } from "framer-motion";
import ScrollRevealText from "./ScrollRevealText";

const A = "/landing";

export default function OrbitSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "center center"],
  });
  const orbitRotate = useTransform(scrollYProgress, [0, 1], [15, 0]);

  const iconClass = "absolute z-10 w-[80px] h-[80px] bg-white border-[8px] border-[#5eb1ff] rounded-full flex items-center justify-center -translate-x-1/2";

  return (
    <section ref={sectionRef} className="relative bg-black rounded-t-[24px] sm:rounded-t-[36px] lg:rounded-t-[48px] overflow-hidden h-[500px] sm:h-[600px] lg:h-[800px]">
      {/* Text — lives outside the scale wrapper so it sizes independently */}
      <motion.div
        className="absolute left-1/2 -translate-x-1/2 top-[40px] sm:top-[60px] lg:top-[140px] w-full max-w-[1280px] px-5 text-center z-10"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
      >
        <ScrollRevealText
          text="Save and use context properly across all your coding agents."
          baseOverlayColor="rgba(255, 255, 255, 0.3)"
          activeColor="#ffffff"
          className="text-[24px] sm:text-[36px] lg:text-[56px] font-semibold text-center tracking-[-1.12px] leading-[1.2] sm:leading-[normal] max-w-[340px] sm:max-w-[600px] lg:max-w-[800px] mx-auto justify-center"
          style={{ fontFamily: "var(--font-jakarta)" }}
        />
      </motion.div>

      {/* Orbit visuals — scale wrapper only around the orbit, not the text */}
      <div
        className="absolute bottom-[8px] left-1/2 -translate-x-1/2 w-[1440px] h-[800px] scale-[0.65] sm:scale-[0.8] lg:scale-100"
        style={{ transformOrigin: "50% 100%" }}
      >
        {/* Radial glow behind the rings */}
        <div className="absolute left-1/2 -translate-x-1/2 top-[236px] w-[994px] h-[564px] pointer-events-none">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img alt="" src={`${A}/orbit-glow.svg`} className="w-full h-full" />
        </div>

        {/* Bottom ellipse glow — rotated tall ellipse matching Figma */}
        <div className="absolute left-1/2 -translate-x-1/2 w-[1700px] h-[400px] pointer-events-none overflow-visible" style={{ top: 610 }}>
          <div className="-rotate-90 origin-center w-full h-full flex items-center justify-center" style={{ skewX: "-0.61deg" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img alt="" src={`${A}/orbit-ellipse.svg`} className="w-[400px] h-[1700px] max-w-none" />
          </div>
        </div>

        {/* Orbit assembly */}
        <motion.div
          className="absolute inset-0"
          style={{ rotate: orbitRotate, transformOrigin: "50% 80%" }}
        >
          <div className="absolute left-1/2 -translate-x-1/2 w-[786px] h-[690px]" style={{ top: 425 }}>
            <Image src={`${A}/orbit-rings.svg`} alt="" fill className="object-contain" />
          </div>

          <div className={iconClass} style={{ left: 'calc(50% - 8px)', top: 385 }}>
            <Image src={`${A}/claude-icon.svg`} alt="Claude" width={40} height={40} className="object-contain" />
          </div>
          <div className={iconClass} style={{ left: 'calc(50% - 236px)', top: 455 }}>
            <Image src={`${A}/cursor-icon.svg`} alt="Cursor" width={40} height={40} className="object-contain" />
          </div>
          <div className={iconClass} style={{ left: 'calc(50% + 218px)', top: 456 }}>
            <Image src={`${A}/antigravity-icon.png`} alt="ChatGPT" width={40} height={40} className="object-contain" />
          </div>
          <div className={iconClass} style={{ left: 'calc(50% - 374px)', top: 643 }}>
            <Image src={`${A}/windsurf-icon.svg`} alt="Windsurf" width={40} height={40} className="object-contain" />
          </div>
          <div className={iconClass} style={{ left: 'calc(50% + 358px)', top: 643 }}>
            <Image src={`${A}/openai-icon.svg`} alt="OpenAI" width={40} height={40} className="object-contain" />
          </div>

          <div className="absolute left-1/2 -translate-x-1/2 z-20 w-[90px] h-[90px]" style={{ top: 641 }}>
            <Image src={`${A}/orbit-clean.svg`} alt="Clean" fill className="object-contain" />
          </div>

        </motion.div>
      </div>
    </section>
  );
}

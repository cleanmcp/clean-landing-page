"use client";

import { motion } from "framer-motion";

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  index?: number;
}

export default function FeatureCard({
  icon,
  title,
  description,
  index = 0,
}: FeatureCardProps) {
  return (
    <motion.div
      className="group rounded-xl border border-[var(--cream-dark)] bg-[var(--cream)] p-6 transition-all hover:border-[var(--accent)]"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
    >
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-[var(--accent)]/10 text-[var(--accent)]">
        {icon}
      </div>
      <h3 className="mb-2 text-lg font-semibold text-[var(--ink)]">{title}</h3>
      <p className="text-sm leading-relaxed text-[var(--ink-light)]">
        {description}
      </p>
    </motion.div>
  );
}

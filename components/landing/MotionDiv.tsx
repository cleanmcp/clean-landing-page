"use client";

import { motion } from "framer-motion";
import type { ComponentProps } from "react";

type MotionDivProps = ComponentProps<typeof motion.div>;

export default function MotionDiv(props: MotionDivProps) {
  return <motion.div {...props} />;
}

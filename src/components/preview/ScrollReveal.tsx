"use client";

import { motion } from "framer-motion";

interface Props {
  children: React.ReactNode;
}

/**
 * スクロールアニメーション
 * - whileInView を使うことで「最初から画面内にある要素」も正しく表示される
 * - once: true で1回だけ発火
 * - amount: 0.1 で要素の10%が見えたら起動
 */
export default function ScrollReveal({ children }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.08 }}
      transition={{
        duration: 0.65,
        ease: [0.22, 1, 0.36, 1],
      }}
    >
      {children}
    </motion.div>
  );
}

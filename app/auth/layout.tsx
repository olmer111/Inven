"use client";

import { AnimatePresence, motion } from "motion/react";
import { usePathname } from "next/navigation";
import AuthPanel from "@/components/AuthPanel";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <AuthPanel>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={pathname}
          initial={{ opacity: 0, x: 32 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -32 }}
          transition={{ type: "spring", stiffness: 320, damping: 30 }}
          className="w-full"
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </AuthPanel>
  );
}

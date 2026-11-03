"use client";

import { motion, HTMLMotionProps } from "framer-motion";
import React from "react";

export const FadeIn = ({ children, delay = 0, ...props }: HTMLMotionProps<"div"> & { delay?: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay, ease: [0.21, 1, 0.36, 1] }}
    {...props}
  >
    {children}
  </motion.div>
);

export const StaggerContainer = ({ children, stagger = 0.1, ...props }: HTMLMotionProps<"div"> & { stagger?: number }) => (
  <motion.div
    initial="hidden"
    animate="visible"
    variants={{
      visible: {
        transition: {
          staggerChildren: stagger,
        },
      },
    }}
    {...props}
  >
    {children}
  </motion.div>
);

export const StaggerItem = ({ children, ...props }: HTMLMotionProps<"div">) => (
  <motion.div
    variants={{
      hidden: { opacity: 0, y: 20 },
      visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.21, 1, 0.36, 1] } },
    }}
    {...props}
  >
    {children}
  </motion.div>
);

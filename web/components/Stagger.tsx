'use client'

import { motion } from 'framer-motion'
import { ReactNode } from 'react'

interface GroupProps {
  children: ReactNode
  className?: string
  style?: React.CSSProperties
  delay?: number
}

export function StaggerGroup({ children, className, style, delay = 0 }: GroupProps) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            staggerChildren: 0.08,
            delayChildren: delay
          }
        }
      }}
      className={className}
      style={style}
    >
      {children}
    </motion.div>
  )
}

interface ItemProps {
  children: ReactNode
  className?: string
  style?: React.CSSProperties
}

export function StaggerItem({ children, className, style }: ItemProps) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 30, rotateX: 10, scale: 0.95 },
        visible: { 
          opacity: 1, 
          y: 0, 
          rotateX: 0,
          scale: 1,
          transition: {
            type: "spring",
            stiffness: 110,
            damping: 15,
            mass: 0.8
          }
        }
      }}
      className={className}
      style={{ transformOrigin: 'top center', transformStyle: 'preserve-3d', ...style }}
    >
      {children}
    </motion.div>
  )
}

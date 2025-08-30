'use client';

import React from 'react';
import { ChevronDown } from 'lucide-react';
import { motion } from 'motion/react';

interface HeroSectionProps {
  t: any;
}

export function HeroSection({ t }: HeroSectionProps) {
  return (
    <section className="h-full flex flex-col items-center justify-center text-center px-6 sm:px-8 md:px-6 relative safe-padding">
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 1, ease: "easeOut" }}
        className="w-3 h-3 sm:w-4 sm:h-4 bg-[#FFD700] rounded-full mb-8 sm:mb-10 md:mb-8 shadow-lg shadow-[#FFD700]/50 cosmic-glow"
      />
      
      <motion.h1
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.5 }}
        className="text-2xl xs:text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-heading text-[#EAEAEA] mb-6 sm:mb-8 md:mb-6 max-w-5xl leading-tight"
      >
        {t.hero.title}
      </motion.h1>
      
      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.8 }}
        className="text-sm xs:text-base sm:text-lg md:text-xl text-[#EAEAEA]/80 max-w-3xl mb-12 sm:mb-16 md:mb-12 leading-relaxed"
      >
        {t.hero.subtitle}
      </motion.p>
      
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 1.2 }}
        className="flex items-center space-x-3 text-[#C0C0C0]"
      >
        <span className="text-xs sm:text-sm font-body">{t.hero.scrollDown}</span>
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <ChevronDown size={16} className="sm:w-5 sm:h-5" />
        </motion.div>
      </motion.div>
    </section>
  );
}

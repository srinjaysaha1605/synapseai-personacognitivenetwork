import React from 'react';
import { motion } from 'motion/react';
import { Terminal } from 'lucide-react';

interface LandingHeroProps {
  onEnterChat: () => void;
}

export const LandingHero: React.FC<LandingHeroProps> = ({ onEnterChat }) => {
  return (
    <div className="relative min-h-[100dvh] w-full bg-black text-white flex flex-col items-center justify-between p-4 sm:p-6 z-10 selection:bg-white selection:text-black">
      {/* Top minimal header indicator */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 0.6, y: 0 }}
        transition={{ duration: 1, delay: 0.2 }}
        className="pt-3 sm:pt-6 flex items-center gap-2 text-[11px] font-mono tracking-widest text-zinc-500 uppercase select-none"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-white/60 animate-pulse" />
        <span>SYNAPSE AI</span>
      </motion.div>

      {/* Main Hero Content */}
      <div className="max-w-3xl w-full mx-auto flex flex-col items-center text-center my-auto py-8 sm:py-12 px-4">
        <motion.h1
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.3 }}
          className="text-3xl sm:text-5xl md:text-6xl font-light font-syne tracking-tight text-white leading-tight max-w-2xl select-none"
        >
          Uncertainty is the threshold of true intelligence.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 0.7, y: 0 }}
          transition={{ duration: 1, delay: 0.5 }}
          className="mt-5 sm:mt-6 text-sm sm:text-base text-zinc-400 font-sans font-light max-w-md leading-relaxed select-none"
        >
          Engage with specialized reasoning modes. Challenge assumptions, explore principles, and test logic.
        </motion.p>

        {/* Central Action Button */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.7 }}
          className="mt-10 sm:mt-12 w-full sm:w-auto flex justify-center"
        >
          <button
            onClick={onEnterChat}
            className="group relative px-8 py-4 w-full sm:w-auto max-w-xs sm:max-w-none rounded-xl bg-white hover:bg-zinc-200 text-black text-xs font-mono font-medium tracking-[0.2em] uppercase transition-all duration-300 cursor-pointer shadow-2xl flex items-center justify-center gap-3"
          >
            <Terminal className="w-4 h-4 opacity-70 group-hover:opacity-100 transition-opacity shrink-0" />
            <span className="truncate">Enter Workspace</span>
          </button>
        </motion.div>
      </div>

      {/* Minimal Bottom Bar */}
      <div className="pb-4 sm:pb-6 select-none" />
    </div>
  );
};

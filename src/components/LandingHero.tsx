import React from 'react';
import { motion } from 'motion/react';
import { Terminal, Shield } from 'lucide-react';

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

      {/* Main Cryptic Hero Content */}
      <div className="max-w-3xl w-full mx-auto flex flex-col items-center text-center my-auto py-8 sm:py-12 px-2">
        {/* Cryptic Quote Message */}
        <motion.p
          initial={{ opacity: 0, filter: 'blur(10px)' }}
          animate={{ opacity: 0.4, filter: 'blur(0px)' }}
          transition={{ duration: 1.5, delay: 0.4 }}
          className="text-[11px] sm:text-xs font-mono uppercase tracking-[0.2em] sm:tracking-[0.3em] text-zinc-400 mb-4 sm:mb-6 select-none"
        >
          // Silence precedes conviction
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, delay: 0.6 }}
          className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-light font-syne tracking-tight text-white leading-snug sm:leading-tight max-w-2xl select-none"
        >
          Uncertainty is the threshold of true intelligence.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 0.7, y: 0 }}
          transition={{ duration: 1.2, delay: 0.8 }}
          className="mt-4 sm:mt-6 text-xs sm:text-base text-zinc-400 font-sans font-light max-w-md leading-relaxed select-none px-2"
        >
          Engage with specialized reasoning modes. Challenge assumptions, explore principles, and test logic.
        </motion.p>

        {/* Cryptic Semi-Visible Central Action Button */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 1.1 }}
          className="mt-8 sm:mt-12 w-full sm:w-auto flex justify-center"
        >
          <button
            onClick={onEnterChat}
            className="group relative px-6 py-3.5 sm:px-8 sm:py-4 w-full sm:w-auto max-w-xs sm:max-w-none rounded-xl bg-black border border-white/20 hover:border-white text-zinc-300 hover:text-black hover:bg-white text-[11px] sm:text-xs font-mono tracking-[0.15em] sm:tracking-[0.2em] uppercase transition-all duration-300 cursor-pointer shadow-2xl backdrop-blur-md flex items-center justify-center"
            style={{
              boxShadow: '0 0 30px -10px rgba(255, 255, 255, 0.1)',
            }}
          >
            <span className="relative z-10 flex items-center gap-2.5 sm:gap-3 font-medium">
              <Terminal className="w-4 h-4 opacity-60 group-hover:opacity-100 transition-opacity shrink-0" />
              <span className="truncate">[ INITIALIZE CONVERGENCE ]</span>
            </span>
          </button>
        </motion.div>
      </div>

      {/* Bottom Footer Info */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.4 }}
        transition={{ duration: 1, delay: 1.4 }}
        className="pb-4 sm:pb-6 flex flex-col sm:flex-row items-center justify-between w-full max-w-4xl text-[10px] font-mono text-zinc-600 uppercase select-none border-t border-white/5 pt-3 sm:pt-4 gap-2 text-center sm:text-left"
      >
        <div className="flex items-center gap-2">
          <Shield className="w-3 h-3 text-zinc-400" />
          <span>Interactive Reasoning Engine</span>
        </div>
        <div>
          <span>Press button or type / in chat to switch persona</span>
        </div>
      </motion.div>
    </div>
  );
};

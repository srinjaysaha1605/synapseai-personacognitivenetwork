import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Persona } from '../types';
import { PersonaIcon } from './PersonaIcon';
import { X, CheckCircle2, AlertOctagon, Terminal } from 'lucide-react';

interface PersonaInspectorModalProps {
  persona: Persona | null;
  isOpen: boolean;
  onClose: () => void;
}

export const PersonaInspectorModal: React.FC<PersonaInspectorModalProps> = ({
  persona,
  isOpen,
  onClose,
}) => {
  if (!persona || !isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/90 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.25 }}
          className="relative w-full max-w-2xl max-h-[90dvh] overflow-y-auto bg-zinc-950 rounded-xl sm:rounded-2xl border border-white/15 p-4 sm:p-8 shadow-2xl overscroll-contain"
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-3.5 right-3.5 sm:top-5 sm:right-5 p-2 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          {/* Persona Header */}
          <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6 pr-8">
            <div
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center border border-white/15 bg-zinc-900 text-white shrink-0"
            >
              <PersonaIcon name={persona.iconName} size={20} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-syne font-bold text-white truncate">{persona.name}</h2>
              </div>
              <p className="text-[11px] sm:text-xs font-mono text-zinc-400 mt-0.5 truncate">{persona.tagline}</p>
            </div>
          </div>

          <div className="space-y-4 sm:space-y-6 text-sm text-zinc-300 font-sans">
            {/* Description */}
            <div className="bg-black p-4 rounded-xl border border-white/10">
              <span className="text-xs font-mono uppercase text-zinc-400 block mb-1">
                Overview
              </span>
              <p className="leading-relaxed text-zinc-200">{persona.description}</p>
            </div>

            {/* Persona Parameters */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-black p-3.5 rounded-xl border border-white/10 font-mono text-xs">
                <span className="text-zinc-500 uppercase tracking-wider block mb-1">Communication Tone</span>
                <span className="text-zinc-200">{persona.communicationStyle}</span>
              </div>
              <div className="bg-black p-3.5 rounded-xl border border-white/10 font-mono text-xs">
                <span className="text-zinc-500 uppercase tracking-wider block mb-1">Reasoning Style</span>
                <span className="text-zinc-200">{persona.reasoningBehavior}</span>
              </div>
            </div>

            {/* Interaction Rules */}
            <div>
              <h3 className="text-xs font-mono uppercase text-zinc-400 tracking-wider mb-3 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-zinc-300" />
                <span>Behavior Rules</span>
              </h3>
              <ul className="space-y-2">
                {persona.interactionRules.map((rule, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-xs text-zinc-300 bg-black p-2.5 rounded-lg border border-white/10">
                    <span className="text-zinc-500 font-mono">{idx + 1}.</span>
                    <span>{rule}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Forbidden Behaviors */}
            <div>
              <h3 className="text-xs font-mono uppercase text-zinc-400 tracking-wider mb-3 flex items-center gap-2">
                <AlertOctagon className="w-4 h-4 text-zinc-400" />
                <span>Forbidden Behaviors</span>
              </h3>
              <ul className="space-y-2">
                {persona.forbiddenBehaviors.map((forbidden, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-xs text-zinc-400 bg-black p-2.5 rounded-lg border border-white/10">
                    <span className="text-zinc-500 font-mono">✕</span>
                    <span>{forbidden}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Prompt Instruction */}
            <div>
              <h3 className="text-xs font-mono uppercase text-zinc-400 tracking-wider mb-2 flex items-center gap-2">
                <Terminal className="w-4 h-4 text-zinc-300" />
                <span>System Directive</span>
              </h3>
              <pre className="p-4 rounded-xl bg-black border border-white/10 text-xs font-mono text-zinc-300 overflow-x-auto whitespace-pre-wrap leading-relaxed max-h-48">
                {persona.systemInstruction}
              </pre>
            </div>
          </div>

          <div className="mt-8 pt-4 border-t border-white/10 flex justify-end">
            <button
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-white text-black font-mono font-medium text-xs hover:bg-zinc-200 transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

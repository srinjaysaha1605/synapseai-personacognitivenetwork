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
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.25 }}
          className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto bg-zinc-950 rounded-2xl border border-white/15 p-6 sm:p-8 shadow-2xl"
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Persona Header */}
          <div className="flex items-center gap-4 mb-6">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center border border-white/15 bg-zinc-900 text-white"
            >
              <PersonaIcon name={persona.iconName} size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-syne font-bold text-white">{persona.name}</h2>
              </div>
              <p className="text-xs font-mono text-zinc-400 mt-1">{persona.tagline}</p>
            </div>
          </div>

          <div className="space-y-6 text-sm text-zinc-300 font-sans">
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

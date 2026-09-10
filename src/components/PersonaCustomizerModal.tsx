import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Persona, PreferredLength } from '../types';
import { X, Sparkles, Plus, Check } from 'lucide-react';

interface PersonaCustomizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSavePersona: (persona: Persona) => void;
}

const ACCENT_PRESETS = [
  { hex: '#ffffff', rgb: '255, 255, 255', label: 'Pure White' },
  { hex: '#a1a1aa', rgb: '161, 161, 170', label: 'Zinc Gray' },
  { hex: '#3b82f6', rgb: '59, 130, 246', label: 'Cobalt Blue' },
  { hex: '#a855f7', rgb: '168, 85, 247', label: 'Violet' },
  { hex: '#10b981', rgb: '16, 185, 129', label: 'Emerald' },
  { hex: '#f59e0b', rgb: '245, 158, 11', label: 'Amber' },
  { hex: '#ef4444', rgb: '239, 68, 68', label: 'Crimson' },
];

export const PersonaCustomizerModal: React.FC<PersonaCustomizerModalProps> = ({
  isOpen,
  onClose,
  onSavePersona,
}) => {
  const [name, setName] = useState('');
  const [tagline, setTagline] = useState('');
  const [description, setDescription] = useState('');
  const [accent, setAccent] = useState(ACCENT_PRESETS[0]);
  const [communicationStyle, setCommunicationStyle] = useState('Clear, direct, structured');
  const [reasoningBehavior, setReasoningBehavior] = useState('First-principles logic');
  const [preferredLength, setPreferredLength] = useState<PreferredLength>('concise');
  const [rules, setRules] = useState('Keep answers actionable.\nAvoid fluff.\nFocus on key insights.');
  const [systemPrompt, setSystemPrompt] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const id = `custom_${Date.now()}`;
    const ruleArray = rules.split('\n').filter(r => r.trim().length > 0);

    const generatedPrompt = systemPrompt.trim()
      ? systemPrompt
      : `You are ${name}, a custom persona.
TAGLINE: ${tagline}
STYLE: ${communicationStyle}
REASONING: ${reasoningBehavior}

RULES:
${ruleArray.map(r => `- ${r}`).join('\n')}

Speak with clarity according to your persona rules. Avoid robotic fluff or preachy disclaimers.`;

    const newPersona: Persona = {
      id,
      name,
      tagline: tagline || 'Custom Persona Mode',
      description: description || 'User-created custom persona mode.',
      accentColor: accent.hex,
      accentRgb: accent.rgb,
      iconName: 'Sparkles',
      communicationStyle,
      reasoningBehavior,
      responseStructure: 'Direct answer → Explanation → Follow-up question',
      interactionRules: ruleArray.length > 0 ? ruleArray : ['Be direct', 'Avoid fluff'],
      constraints: ['No generic AI disclaimers', 'Adhere to persona rules'],
      forbiddenBehaviors: ['Generic AI intros', 'Placating praise'],
      preferredLength,
      systemInstruction: generatedPrompt,
      thinkingPhrases: [
        `Activating ${name}...`,
        'Formulating response...',
      ],
      samplePrompts: [
        'How should I approach this problem?',
        'Give me a key perspective on this.'
      ],
      geometryType: 'icosahedron',
      isCustom: true,
    };

    onSavePersona(newPersona);
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/90 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-2xl max-h-[90dvh] overflow-y-auto bg-zinc-950 rounded-xl sm:rounded-2xl border border-white/15 p-4 sm:p-8 my-auto shadow-2xl overscroll-contain"
        >
          <button
            onClick={onClose}
            className="absolute top-3.5 right-3.5 sm:top-5 sm:right-5 p-2 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          <div className="flex items-center gap-2.5 sm:gap-3 mb-4 sm:mb-6 pr-8">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/15 text-white shrink-0">
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-syne font-bold text-white">Create Custom Persona</h2>
              <p className="text-[11px] sm:text-xs text-zinc-400 font-mono">Design a custom behavior and persona mode</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5 text-xs font-sans text-zinc-300">
            {/* Persona Name & Tagline */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-zinc-400 font-mono uppercase mb-1">Persona Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Minimalist Coach"
                  className="w-full bg-black border border-white/10 rounded-xl px-3.5 py-2.5 text-white text-xs focus:outline-none focus:border-white/30"
                />
              </div>
              <div>
                <label className="block text-zinc-400 font-mono uppercase mb-1">Tagline</label>
                <input
                  type="text"
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  placeholder="e.g. Focused execution & clarity"
                  className="w-full bg-black border border-white/10 rounded-xl px-3.5 py-2.5 text-white text-xs focus:outline-none focus:border-white/30"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-zinc-400 font-mono uppercase mb-1">Description</label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief summary of what this persona specializes in..."
                className="w-full bg-black border border-white/10 rounded-xl px-3.5 py-2 text-white text-xs focus:outline-none focus:border-white/30 resize-none"
              />
            </div>

            {/* Accent Color Selection */}
            <div>
              <label className="block text-zinc-400 font-mono uppercase mb-2">Accent Color</label>
              <div className="flex flex-wrap gap-2.5">
                {ACCENT_PRESETS.map((preset) => (
                  <button
                    key={preset.hex}
                    type="button"
                    onClick={() => setAccent(preset)}
                    className="w-8 h-8 rounded-full border flex items-center justify-center transition-transform hover:scale-110 cursor-pointer"
                    style={{
                      backgroundColor: preset.hex,
                      borderColor: accent.hex === preset.hex ? '#ffffff' : 'transparent',
                    }}
                    title={preset.label}
                  >
                    {accent.hex === preset.hex && <Check className="w-4 h-4 text-black" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Style & Response Length */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-zinc-400 font-mono uppercase mb-1">Communication Style</label>
                <input
                  type="text"
                  value={communicationStyle}
                  onChange={(e) => setCommunicationStyle(e.target.value)}
                  className="w-full bg-black border border-white/10 rounded-xl px-3.5 py-2.5 text-white text-xs focus:outline-none focus:border-white/30"
                />
              </div>
              <div>
                <label className="block text-zinc-400 font-mono uppercase mb-1">Response Length</label>
                <select
                  value={preferredLength}
                  onChange={(e) => setPreferredLength(e.target.value as PreferredLength)}
                  className="w-full bg-black border border-white/10 rounded-xl px-3.5 py-2.5 text-white text-xs focus:outline-none focus:border-white/30"
                >
                  <option value="concise">Concise & Direct</option>
                  <option value="balanced">Balanced</option>
                  <option value="rigorous">Detailed & Thorough</option>
                </select>
              </div>
            </div>

            {/* Directives / Rules */}
            <div>
              <label className="block text-zinc-400 font-mono uppercase mb-1">Rules (One per line)</label>
              <textarea
                rows={3}
                value={rules}
                onChange={(e) => setRules(e.target.value)}
                placeholder="Rule 1&#10;Rule 2&#10;Rule 3"
                className="w-full bg-black border border-white/10 rounded-xl px-3.5 py-2 text-white text-xs font-mono focus:outline-none focus:border-white/30 resize-none"
              />
            </div>

            {/* Custom System Prompt Override */}
            <div>
              <label className="block text-zinc-400 font-mono uppercase mb-1">System Directive (Optional Override)</label>
              <textarea
                rows={3}
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                placeholder="Leave blank to generate automatically..."
                className="w-full bg-black border border-white/10 rounded-xl px-3.5 py-2 text-white text-xs font-mono focus:outline-none focus:border-white/30 resize-none"
              />
            </div>

            {/* Actions */}
            <div className="pt-4 border-t border-white/10 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 font-mono text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-white text-black font-mono font-medium text-xs hover:bg-zinc-200 transition-colors cursor-pointer flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>Create Persona</span>
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

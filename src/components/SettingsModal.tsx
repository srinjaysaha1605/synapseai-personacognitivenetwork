import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AppSettings } from '../types';
import { X, Settings, Sliders, Database } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void;
  onClearAllSessions: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  onClearAllSessions,
}) => {
  const [confirmClear, setConfirmClear] = React.useState(false);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/90 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-lg max-h-[90dvh] overflow-y-auto bg-zinc-950 rounded-xl sm:rounded-2xl border border-white/15 p-4 sm:p-8 shadow-2xl overscroll-contain"
        >
          <button
            onClick={onClose}
            className="absolute top-3.5 right-3.5 sm:top-5 sm:right-5 p-2 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          <div className="flex items-center gap-2.5 sm:gap-3 mb-4 sm:mb-6 pr-8">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/15 text-white shrink-0">
              <Settings className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-syne font-bold text-white">Settings</h2>
              <p className="text-[11px] sm:text-xs text-zinc-400 font-mono">Customize interface behavior & storage</p>
            </div>
          </div>

          <div className="space-y-4 sm:space-y-6 text-xs font-sans text-zinc-300">
            {/* Creativity Slider */}
            <div>
              <div className="flex justify-between items-center mb-1.5 font-mono">
                <span className="text-zinc-400 uppercase flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-zinc-300" />
                  <span>Response Creativity</span>
                </span>
                <span className="text-white font-bold">{settings.temperature}</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="1.0"
                step="0.05"
                value={settings.temperature}
                onChange={(e) => onUpdateSettings({ temperature: parseFloat(e.target.value) })}
                className="w-full accent-white cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-zinc-500 font-mono mt-1">
                <span>Focused (0.1)</span>
                <span>Balanced (0.7)</span>
                <span>Creative (1.0)</span>
              </div>
            </div>

            {/* User Display Name */}
            <div>
              <label className="block text-zinc-400 font-mono uppercase mb-1">Display Name</label>
              <input
                type="text"
                value={settings.userDisplayName}
                onChange={(e) => onUpdateSettings({ userDisplayName: e.target.value })}
                placeholder="User"
                className="w-full bg-black border border-white/10 rounded-xl px-3.5 py-2.5 text-white text-xs focus:outline-none focus:border-white/30 font-mono"
              />
            </div>

            {/* Auto Scroll Toggle */}
            <div className="flex items-center justify-between p-3.5 bg-black rounded-xl border border-white/10">
              <div>
                <div className="font-mono text-xs text-white">Auto-Scroll Messages</div>
                <div className="text-[11px] text-zinc-400">Automatically scroll down when new text arrives</div>
              </div>
              <input
                type="checkbox"
                checked={settings.autoScroll}
                onChange={(e) => onUpdateSettings({ autoScroll: e.target.checked })}
                className="w-4 h-4 accent-white cursor-pointer"
              />
            </div>

            {/* Data Management */}
            <div className="pt-4 border-t border-white/10">
              <label className="block text-zinc-400 font-mono uppercase mb-2 flex items-center gap-2">
                <Database className="w-4 h-4 text-zinc-300" />
                <span>History & Storage</span>
              </label>
              {confirmClear ? (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      onClearAllSessions();
                      setConfirmClear(false);
                      onClose();
                    }}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-mono text-xs font-bold transition-colors cursor-pointer text-center"
                  >
                    Confirm Clear All
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmClear(false)}
                    className="py-2.5 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-mono text-xs transition-colors cursor-pointer text-center"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmClear(true)}
                  className="w-full py-2.5 px-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-zinc-300 hover:text-white font-mono text-xs transition-colors cursor-pointer text-center"
                >
                  Clear All Saved Conversations
                </button>
              )}
            </div>
          </div>

          <div className="mt-8 pt-4 border-t border-white/10 flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-white text-black font-mono font-medium text-xs hover:bg-zinc-200 transition-colors cursor-pointer"
            >
              Done
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

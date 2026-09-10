import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChatMessage, Persona, PersonaID, AppSettings } from '../types';
import { PersonaIcon } from './PersonaIcon';
import {
  Send,
  Square,
  Info,
  RotateCcw,
  Copy,
  Check,
  ChevronDown,
  ArrowLeft,
  Settings,
  Menu,
  Trash2,
  Terminal,
  HelpCircle,
  Command,
  Plus
} from 'lucide-react';

interface ChatInterfaceProps {
  activePersona: Persona;
  allPersonas: Persona[];
  messages: ChatMessage[];
  isStreaming: boolean;
  streamingContent: string;
  onSendMessage: (text: string) => void;
  onStopStreaming: () => void;
  onSelectPersona: (id: PersonaID) => void;
  onClearThread: () => void;
  onRegenerate: () => void;
  onOpenInspector: () => void;
  onOpenSettings: () => void;
  onOpenSidebar: () => void;
  onBackToLanding: () => void;
  onOpenCustomizer: () => void;
  settings: AppSettings;
}

interface CommandItem {
  cmd: string;
  alias: string;
  label: string;
  desc: string;
  type: 'persona' | 'action';
  personaId?: PersonaID;
  iconName?: string;
  actionType?: 'clear' | 'help' | 'custom';
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  activePersona,
  allPersonas,
  messages,
  isStreaming,
  streamingContent,
  onSendMessage,
  onStopStreaming,
  onSelectPersona,
  onClearThread,
  onRegenerate,
  onOpenInspector,
  onOpenSettings,
  onOpenSidebar,
  onBackToLanding,
  onOpenCustomizer,
  settings,
}) => {
  const [inputText, setInputText] = useState('');
  const [isPersonaMenuOpen, setIsPersonaMenuOpen] = useState(false);
  const [showCommandMenu, setShowCommandMenu] = useState(false);
  const [selectedCmdIndex, setSelectedCmdIndex] = useState(0);
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);
  const [thinkingIndex, setThinkingIndex] = useState(0);
  const [systemNotice, setSystemNotice] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Build commands list dynamically from all personas + built-in actions
  const commandItems: CommandItem[] = [
    ...allPersonas.map((p) => ({
      cmd: `/${p.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
      alias: `/${p.id}`,
      label: p.name,
      desc: p.tagline,
      type: 'persona' as const,
      personaId: p.id,
      iconName: p.iconName,
    })),
    {
      cmd: '/create',
      alias: '/custom',
      label: 'Create Custom Persona',
      desc: 'Design a new custom persona mode',
      type: 'action' as const,
      actionType: 'custom',
      iconName: 'Plus',
    },
    {
      cmd: '/clear',
      alias: '/reset',
      label: 'Clear Conversation',
      desc: 'Reset active chat thread',
      type: 'action' as const,
      actionType: 'clear',
      iconName: 'Trash2',
    },
    {
      cmd: '/help',
      alias: '/?',
      label: 'List Commands',
      desc: 'Show available chat slash commands',
      type: 'action' as const,
      actionType: 'help',
      iconName: 'HelpCircle',
    },
  ];

  // Filter commands based on input starting with '/'
  const filterQuery = inputText.startsWith('/')
    ? inputText.slice(1).split(' ')[0].toLowerCase()
    : '';

  const filteredCommands = commandItems.filter(
    (item) =>
      item.cmd.toLowerCase().includes(filterQuery) ||
      item.alias.toLowerCase().includes(filterQuery) ||
      item.label.toLowerCase().includes(filterQuery)
  );

  // Toggle command menu visibility
  useEffect(() => {
    if (inputText.startsWith('/')) {
      setShowCommandMenu(true);
      setSelectedCmdIndex(0);
    } else {
      setShowCommandMenu(false);
    }
  }, [inputText]);

  // Cycle thinking phrases during streaming
  useEffect(() => {
    if (!isStreaming) return;
    const interval = setInterval(() => {
      setThinkingIndex((prev) => (prev + 1) % activePersona.thinkingPhrases.length);
    }, 2200);
    return () => clearInterval(interval);
  }, [isStreaming, activePersona]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (settings.autoScroll) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, streamingContent, settings.autoScroll, systemNotice]);

  // Auto-expand textarea height
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  }, [inputText]);

  // Execute a selected command
  const executeCommand = (item: CommandItem, remainingArgs: string = '') => {
    setShowCommandMenu(false);
    setInputText('');

    if (item.type === 'persona' && item.personaId) {
      const targetPersona = allPersonas.find((p) => p.id === item.personaId) || activePersona;
      onSelectPersona(item.personaId);
      setSystemNotice(`Persona set to ${targetPersona.name}`);
      setTimeout(() => setSystemNotice(null), 4000);

      if (remainingArgs.trim()) {
        onSendMessage(remainingArgs.trim());
      }
    } else if (item.actionType === 'clear') {
      onClearThread();
      setSystemNotice('Conversation thread cleared');
      setTimeout(() => setSystemNotice(null), 3000);
    } else if (item.actionType === 'custom') {
      onOpenCustomizer();
    } else if (item.actionType === 'help') {
      setSystemNotice(
        'Slash Commands: /devils_advocate, /socratic, /skeptic, /strategist, /philosopher, /cybernetic, /create, /clear'
      );
      setTimeout(() => setSystemNotice(null), 6000);
    }
  };

  const handleSend = () => {
    const trimmed = inputText.trim();
    if (!trimmed || isStreaming) return;

    // Check if user submitted a slash command directly
    if (trimmed.startsWith('/')) {
      const parts = trimmed.split(' ');
      const cmdStr = parts[0].toLowerCase();
      const argsStr = parts.slice(1).join(' ');

      const matchedCmd = commandItems.find(
        (c) => c.cmd.toLowerCase() === cmdStr || c.alias.toLowerCase() === cmdStr
      );

      if (matchedCmd) {
        executeCommand(matchedCmd, argsStr);
        return;
      }
    }

    onSendMessage(trimmed);
    setInputText('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDownInput = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (showCommandMenu && filteredCommands.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedCmdIndex((prev) => (prev + 1) % filteredCommands.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedCmdIndex((prev) => (prev - 1 + filteredCommands.length) % filteredCommands.length);
        return;
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        const parts = inputText.split(' ');
        const argsStr = parts.slice(1).join(' ');
        executeCommand(filteredCommands[selectedCmdIndex], argsStr);
        return;
      }
      if (e.key === 'Escape') {
        setShowCommandMenu(false);
        return;
      }
    }

    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey || !e.shiftKey)) {
      e.preventDefault();
      handleSend();
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMsgId(id);
    setTimeout(() => setCopiedMsgId(null), 2000);
  };

  return (
    <div className="relative z-10 min-h-screen bg-black text-white flex flex-col justify-between max-w-5xl mx-auto px-3 sm:px-6 pt-3 pb-6 selection:bg-white selection:text-black">
      {/* Sleek Ultra-Dark Header Bar */}
      <header className="relative z-30 bg-zinc-950/90 rounded-2xl border border-white/10 p-3 sm:p-4 mb-4 flex items-center justify-between gap-3 shadow-2xl backdrop-blur-md">
        <div className="flex items-center gap-2">
          {/* Back & Sidebar Controls */}
          <button
            onClick={onBackToLanding}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer"
            title="Return to Home"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <button
            onClick={onOpenSidebar}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer flex items-center gap-1.5 font-mono text-xs"
            title="Sessions History"
          >
            <Menu className="w-4 h-4" />
            <span className="hidden sm:inline">Sessions</span>
          </button>

          {/* Persona Selector Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsPersonaMenuOpen(!isPersonaMenuOpen)}
              className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-white/15 transition-all cursor-pointer"
            >
              <div
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: activePersona.accentColor }}
              />
              <span className="text-xs font-mono font-medium text-white">
                {activePersona.name}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-zinc-500 ml-1" />
            </button>

            {/* Persona Quick Selector Dropdown */}
            <AnimatePresence>
              {isPersonaMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.98 }}
                  className="absolute left-0 top-full mt-2 w-72 bg-zinc-950 rounded-2xl border border-white/15 p-2 z-50 shadow-2xl backdrop-blur-xl"
                >
                  <div className="text-[10px] font-mono uppercase text-zinc-500 px-3 py-1.5 flex items-center justify-between">
                    <span>Select Persona Mode</span>
                    <span className="text-[9px] text-zinc-600">or type / in chat</span>
                  </div>
                  <div className="space-y-1 max-h-64 overflow-y-auto">
                    {allPersonas.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => {
                          onSelectPersona(p.id);
                          setIsPersonaMenuOpen(false);
                        }}
                        className={`w-full text-left p-2 rounded-xl flex items-center gap-3 transition-colors cursor-pointer ${
                          p.id === activePersona.id
                            ? 'bg-white/10 text-white border border-white/15'
                            : 'hover:bg-white/5 text-zinc-400 hover:text-zinc-200'
                        }`}
                      >
                        <div
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: p.accentColor }}
                        />
                        <div className="overflow-hidden">
                          <div className="font-mono text-xs font-medium truncate text-white">{p.name}</div>
                          <div className="text-[10px] font-sans text-zinc-500 truncate">{p.tagline}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                  <div className="pt-2 mt-1 border-t border-white/10">
                    <button
                      onClick={() => {
                        setIsPersonaMenuOpen(false);
                        onOpenCustomizer();
                      }}
                      className="w-full text-left p-2 rounded-xl hover:bg-white/5 text-xs font-mono text-zinc-300 hover:text-white flex items-center gap-2 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Create New Persona Mode</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Inspect Active Persona Button */}
          <button
            onClick={onOpenInspector}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer"
            title="Inspect Persona Rules"
          >
            <Info className="w-4 h-4" />
          </button>
        </div>

        {/* Right System Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Status Indicator */}
          <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-white/10 text-[10px] font-mono text-zinc-400">
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isStreaming ? 'animate-ping bg-amber-400' : 'bg-emerald-400'
              }`}
            />
            <span>{isStreaming ? 'STREAMING' : 'READY'}</span>
          </div>

          <button
            onClick={onClearThread}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-rose-400 transition-colors cursor-pointer"
            title="Clear Conversation Thread"
          >
            <Trash2 className="w-4 h-4" />
          </button>

          <button
            onClick={onOpenSettings}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer"
            title="Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* System Switch Notice Bar */}
      <AnimatePresence>
        {systemNotice && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-3 px-4 py-2 rounded-xl bg-zinc-900 border border-white/15 text-xs font-mono text-zinc-300 flex items-center gap-2"
          >
            <Terminal className="w-3.5 h-3.5 text-white shrink-0" />
            <span>{systemNotice}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Messages Thread Stream */}
      <div className="flex-1 overflow-y-auto space-y-6 px-1 py-4 min-h-[55vh]">
        {messages.length === 0 ? (
          /* Empty Thread Welcome State */
          <div className="h-full flex flex-col items-center justify-center text-center py-16 px-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-12 h-12 rounded-xl bg-zinc-900 border border-white/15 flex items-center justify-center mb-4"
            >
              <PersonaIcon name={activePersona.iconName} size={24} />
            </motion.div>
            <h3 className="text-xl font-syne font-medium text-white mb-2">
              {activePersona.name}
            </h3>
            <p className="text-xs text-zinc-400 font-sans max-w-md mb-6 leading-relaxed">
              {activePersona.description}
            </p>

            {/* Quick Slash Commands Tip */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-900 border border-white/10 text-xs font-mono text-zinc-400 mb-8">
              <Command className="w-3.5 h-3.5 text-zinc-300" />
              <span>Type <code className="text-white bg-black px-1.5 py-0.5 rounded border border-white/10">/</code> in chat to switch persona or run commands</span>
            </div>

            {/* Suggested Starter Prompts */}
            <div className="w-full max-w-lg">
              <span className="text-[10px] font-mono uppercase text-zinc-500 tracking-widest block mb-3">
                Suggested Prompts
              </span>
              <div className="flex flex-col gap-2">
                {activePersona.samplePrompts.map((prompt, pIdx) => (
                  <button
                    key={pIdx}
                    onClick={() => onSendMessage(prompt)}
                    className="p-3 text-left rounded-xl bg-zinc-950 hover:bg-zinc-900 border border-white/10 text-xs text-zinc-300 hover:text-white transition-all cursor-pointer font-sans"
                  >
                    "{prompt}"
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          messages.map((msg, index) => {
            const isUser = msg.role === 'user';

            return (
              <motion.div
                key={msg.id || index}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
                className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
              >
                {/* Header for Assistant Message */}
                {!isUser && (
                  <div className="flex items-center gap-2 mb-1.5 px-1">
                    <div
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: activePersona.accentColor }}
                    />
                    <span className="text-xs font-mono text-zinc-300 font-medium">
                      {activePersona.name}
                    </span>
                    <span className="text-[10px] font-mono text-zinc-600">
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                )}

                {/* Message Bubble Container */}
                <div
                  className={`relative rounded-2xl p-4 sm:p-5 text-sm leading-relaxed max-w-[90%] sm:max-w-[85%] font-sans ${
                    isUser
                      ? 'bg-zinc-800 text-white rounded-br-xs border border-white/10 shadow-md'
                      : 'bg-zinc-950 rounded-bl-xs border border-white/10 text-zinc-200 shadow-lg'
                  }`}
                >
                  <p className="whitespace-pre-wrap font-sans text-sm sm:text-[15px] font-normal leading-relaxed text-zinc-100">
                    {msg.content}
                  </p>

                  {/* Assistant Actions Footer */}
                  {!isUser && (
                    <div className="mt-3 pt-2.5 border-t border-white/5 flex items-center justify-end text-xs text-zinc-500 font-mono">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => copyToClipboard(msg.content, msg.id)}
                          className="p-1 rounded hover:bg-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                          title="Copy text"
                        >
                          {copiedMsgId === msg.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>

                        {index === messages.length - 1 && (
                          <button
                            onClick={onRegenerate}
                            className="p-1 rounded hover:bg-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                            title="Regenerate turn"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })
        )}

        {/* Streaming Active Output State */}
        {isStreaming && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-start"
          >
            <div className="flex items-center gap-2 mb-1.5 px-1">
              <div
                className="w-1.5 h-1.5 rounded-full animate-ping"
                style={{ backgroundColor: activePersona.accentColor }}
              />
              <span className="text-xs font-mono text-zinc-300 font-medium">
                {activePersona.name}
              </span>
            </div>

            <div className="bg-zinc-950 rounded-2xl rounded-bl-xs p-4 sm:p-5 border border-white/10 text-zinc-100 max-w-[90%] sm:max-w-[85%] w-full">
              {streamingContent ? (
                <p className="whitespace-pre-wrap font-sans text-sm sm:text-[15px] leading-relaxed">
                  {streamingContent}
                  <span className="inline-block w-2 h-4 ml-1 bg-white animate-pulse" />
                </p>
              ) : (
                <div className="flex items-center gap-3 py-1 font-mono text-xs text-zinc-400">
                  <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                  <span>{activePersona.thinkingPhrases[thinkingIndex]}</span>
                </div>
              )}
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Floating Input Area & Slash Command Menu */}
      <div className="mt-2 sticky bottom-0 z-20">
        {/* Inline Slash Command Menu Overlay */}
        <AnimatePresence>
          {showCommandMenu && filteredCommands.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.98 }}
              className="mb-2 bg-zinc-950 rounded-2xl border border-white/20 p-2 shadow-2xl backdrop-blur-xl max-h-64 overflow-y-auto"
            >
              <div className="px-3 py-1.5 text-[10px] font-mono uppercase text-zinc-500 border-b border-white/10 mb-1 flex items-center justify-between">
                <span>Slash Commands</span>
                <span>Press Enter or Tab to select</span>
              </div>
              <div className="space-y-1">
                {filteredCommands.map((item, idx) => {
                  const isSelected = idx === selectedCmdIndex;
                  return (
                    <button
                      key={item.cmd}
                      onClick={() => {
                        const parts = inputText.split(' ');
                        const argsStr = parts.slice(1).join(' ');
                        executeCommand(item, argsStr);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-xl flex items-center justify-between transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-white text-black font-medium'
                          : 'hover:bg-zinc-900 text-zinc-300'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 overflow-hidden">
                        <span
                          className={`font-mono text-xs font-semibold ${
                            isSelected ? 'text-black' : 'text-white'
                          }`}
                        >
                          {item.cmd}
                        </span>
                        <span
                          className={`text-xs truncate font-sans ${
                            isSelected ? 'text-zinc-800' : 'text-zinc-400'
                          }`}
                        >
                          — {item.label}
                        </span>
                      </div>
                      <span
                        className={`text-[10px] font-mono shrink-0 ml-2 ${
                          isSelected ? 'text-zinc-700' : 'text-zinc-500'
                        }`}
                      >
                        {item.desc}
                      </span>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Text Input Glass Bar */}
        <div className="bg-zinc-950 rounded-2xl border border-white/15 p-2.5 sm:p-3 shadow-2xl transition-all">
          <div className="flex items-end gap-2">
            {/* Command Menu Trigger Button */}
            <button
              onClick={() => {
                if (!inputText.startsWith('/')) {
                  setInputText('/');
                } else {
                  setInputText('');
                }
              }}
              className="p-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-white/10 transition-colors cursor-pointer shrink-0 font-mono text-xs font-semibold"
              title="Toggle Slash Commands"
            >
              /
            </button>

            <textarea
              ref={textareaRef}
              rows={1}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDownInput}
              placeholder={`Message ${activePersona.name}... (type / for commands)`}
              className="flex-1 bg-transparent border-0 text-white placeholder:text-zinc-600 text-sm focus:outline-none resize-none px-2 py-1 font-sans max-h-44"
            />

            {/* Action Send / Stop Button */}
            {isStreaming ? (
              <button
                onClick={onStopStreaming}
                className="p-3 rounded-xl bg-rose-950 hover:bg-rose-900 border border-rose-800 text-rose-300 transition-colors cursor-pointer shrink-0"
                title="Halt stream"
              >
                <Square className="w-4 h-4 fill-current" />
              </button>
            ) : (
              <button
                onClick={handleSend}
                disabled={!inputText.trim()}
                className={`p-3 rounded-xl font-medium transition-all cursor-pointer flex items-center justify-center shrink-0 ${
                  inputText.trim()
                    ? 'bg-white text-black hover:bg-zinc-200 shadow-lg'
                    : 'bg-white/10 text-zinc-600 cursor-not-allowed'
                }`}
                title="Send Message"
              >
                <Send className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Footer Navigation Bar */}
          <div className="mt-2 pt-2 border-t border-white/5 flex items-center justify-between text-[10px] font-mono text-zinc-500 px-1">
            <div className="flex items-center gap-3">
              <span>Type <code className="text-zinc-300">/</code> for persona commands</span>
              <span>•</span>
              <span>Enter to send</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
              <span>{activePersona.name}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

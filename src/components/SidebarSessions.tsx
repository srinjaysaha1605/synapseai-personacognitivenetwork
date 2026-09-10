import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ConversationSession, Persona } from '../types';
import { PersonaIcon } from './PersonaIcon';
import {
  X,
  Plus,
  MessageSquare,
  Trash2,
  Download,
  Search,
  Clock
} from 'lucide-react';

interface SidebarSessionsProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: ConversationSession[];
  activeSessionId: string;
  onSelectSession: (id: string) => void;
  onNewSession: () => void;
  onDeleteSession: (id: string) => void;
  getPersona: (personaId: string) => Persona;
}

export const SidebarSessions: React.FC<SidebarSessionsProps> = ({
  isOpen,
  onClose,
  sessions,
  activeSessionId,
  onSelectSession,
  onNewSession,
  onDeleteSession,
  getPersona,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  if (!isOpen) return null;

  const filteredSessions = sessions.filter(s =>
    s.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const exportSessionMarkdown = (session: ConversationSession) => {
    const persona = getPersona(session.activePersonaId);
    let md = `# ${session.title}\n`;
    md += `**Persona:** ${persona.name} (${persona.tagline})\n`;
    md += `**Date:** ${new Date(session.createdAt).toLocaleString()}\n\n---\n\n`;

    session.messages.forEach(msg => {
      const sender = msg.role === 'user' ? 'User' : persona.name;
      md += `### ${sender} (${new Date(msg.timestamp).toLocaleTimeString()})\n\n${msg.content}\n\n`;
    });

    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${session.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_export.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportSessionJson = (session: ConversationSession) => {
    const persona = getPersona(session.activePersonaId);
    const exportData = {
      id: session.id,
      title: session.title,
      persona: {
        id: persona.id,
        name: persona.name,
        tagline: persona.tagline,
      },
      createdAt: new Date(session.createdAt).toISOString(),
      updatedAt: new Date(session.updatedAt).toISOString(),
      messages: session.messages.map(m => ({
        id: m.id,
        role: m.role,
        content: m.content,
        timestamp: new Date(m.timestamp).toISOString(),
        personaId: m.personaId,
      })),
    };

    const jsonStr = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${session.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_export.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-hidden">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        />

        {/* Drawer Panel */}
        <motion.div
          initial={{ x: '-100%' }}
          animate={{ x: 0 }}
          exit={{ x: '-100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="absolute inset-y-0 left-0 w-[86vw] max-w-sm bg-zinc-950 border-r border-white/15 p-4 sm:p-6 flex flex-col justify-between shadow-2xl"
        >
          <div className="flex-1 overflow-hidden flex flex-col">
            {/* Drawer Header */}
            <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-white/10 mb-3 sm:mb-5">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-white" />
                <h2 className="font-syne font-bold text-base sm:text-lg text-white">Saved Conversations</h2>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* New Session Button */}
            <button
              onClick={() => {
                onNewSession();
                onClose();
              }}
              className="w-full py-2.5 px-4 rounded-xl bg-white text-black font-mono font-medium text-xs hover:bg-zinc-200 transition-colors cursor-pointer flex items-center justify-center gap-2 mb-3"
            >
              <Plus className="w-4 h-4" />
              <span>New Conversation</span>
            </button>

            {/* Search Input */}
            <div className="relative mb-3">
              <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search history..."
                className="w-full bg-black border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-white/20 font-sans"
              />
            </div>

            {/* Session List */}
            <div className="space-y-1.5 sm:space-y-2 flex-1 overflow-y-auto pr-0.5 overscroll-contain">
              {filteredSessions.length === 0 ? (
                <div className="text-center py-8 text-xs text-zinc-500 font-mono">
                  No saved conversations.
                </div>
              ) : (
                filteredSessions.map((session) => {
                  const persona = getPersona(session.activePersonaId);
                  const isActive = session.id === activeSessionId;

                  return (
                    <div
                      key={session.id}
                      onClick={() => {
                        onSelectSession(session.id);
                        onClose();
                      }}
                      className={`group relative p-2.5 sm:p-3.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between gap-2 ${
                        isActive
                          ? 'bg-white/10 border-white/25 text-white'
                          : 'bg-black border-white/10 text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 sm:gap-3 overflow-hidden min-w-0 flex-1">
                        <div
                          className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border border-white/10 bg-zinc-900 text-white"
                        >
                          <PersonaIcon name={persona.iconName} size={14} />
                        </div>
                        <div className="overflow-hidden min-w-0 flex-1">
                          <h3 className="font-sans font-medium text-xs text-white truncate">
                            {session.title || 'Untitled Conversation'}
                          </h3>
                          <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] text-zinc-400 font-sans mt-0.5">
                            <Clock className="w-3 h-3 shrink-0" />
                            <span>{new Date(session.updatedAt).toLocaleDateString()}</span>
                            <span>•</span>
                            <span>{session.messages.length} {session.messages.length === 1 ? 'msg' : 'msgs'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            exportSessionMarkdown(session);
                          }}
                          className="px-1.5 py-1 rounded bg-white/5 hover:bg-white/15 text-zinc-400 hover:text-white font-mono text-[9px] uppercase transition-colors cursor-pointer hidden sm:inline"
                          title="Export as Markdown (.md)"
                        >
                          .MD
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            exportSessionJson(session);
                          }}
                          className="px-1.5 py-1 rounded bg-white/5 hover:bg-white/15 text-zinc-400 hover:text-white font-mono text-[9px] uppercase transition-colors cursor-pointer"
                          title="Export as JSON (.json)"
                        >
                          <Download className="w-3 h-3 sm:hidden" />
                          <span className="hidden sm:inline">.JSON</span>
                        </button>

                        {confirmDeleteId === session.id ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteSession(session.id);
                              setConfirmDeleteId(null);
                            }}
                            className="px-2 py-0.5 rounded bg-rose-600 hover:bg-rose-500 text-white font-mono text-[9px] uppercase font-bold transition-colors cursor-pointer"
                            title="Confirm deletion"
                          >
                            Del?
                          </button>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setConfirmDeleteId(session.id);
                            }}
                            className="p-1 rounded hover:bg-rose-950/50 text-zinc-400 hover:text-rose-400 transition-colors cursor-pointer"
                            title="Delete Session"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="pt-3 sm:pt-4 border-t border-white/10 text-[10px] sm:text-[11px] font-mono text-zinc-500 text-center uppercase tracking-wider shrink-0">
            Synapse AI Workspace
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

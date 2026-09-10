import React, { useState, useEffect, useRef } from 'react';
import {
  Persona,
  PersonaID,
  ChatMessage,
  ConversationSession,
  AppSettings,
} from './types';
import { DEFAULT_PERSONAS, getPersonaById } from './data/personas';
import { LandingHero } from './components/LandingHero';
import { ChatInterface } from './components/ChatInterface';
import { PersonaInspectorModal } from './components/PersonaInspectorModal';
import { PersonaCustomizerModal } from './components/PersonaCustomizerModal';
import { SettingsModal } from './components/SettingsModal';
import { SidebarSessions } from './components/SidebarSessions';

const STORAGE_KEYS = {
  SESSIONS: 'synapse_ai_sessions_v1',
  ACTIVE_SESSION: 'synapse_ai_active_session_id_v1',
  ACTIVE_PERSONA: 'synapse_ai_active_persona_id_v1',
  CUSTOM_PERSONAS: 'synapse_ai_custom_personas_v1',
  SETTINGS: 'synapse_ai_settings_v1',
};

const DEFAULT_SETTINGS: AppSettings = {
  model: 'gemini-3.8-flash',
  temperature: 0.7,
  autoScroll: true,
  soundEffects: true,
  userDisplayName: 'Architect',
};

export default function App() {
  // 1. Settings State
  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  // Save settings
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  }, [settings]);

  // 2. Custom Personas State
  const [customPersonas, setCustomPersonas] = useState<Persona[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CUSTOM_PERSONAS);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const allPersonas = [...DEFAULT_PERSONAS, ...customPersonas];

  const handleSaveCustomPersona = (newPersona: Persona) => {
    const updated = [newPersona, ...customPersonas];
    setCustomPersonas(updated);
    localStorage.setItem(STORAGE_KEYS.CUSTOM_PERSONAS, JSON.stringify(updated));
    setActivePersonaId(newPersona.id);
  };

  // 3. Active Persona State
  const [activePersonaId, setActivePersonaId] = useState<PersonaID>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ACTIVE_PERSONA);
      return saved || DEFAULT_PERSONAS[0].id;
    } catch {
      return DEFAULT_PERSONAS[0].id;
    }
  });

  const activePersona = getPersonaById(activePersonaId, customPersonas);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_PERSONA, activePersonaId);
  }, [activePersonaId]);

  // 4. View Mode: 'landing' vs 'chat'
  const [viewMode, setViewMode] = useState<'landing' | 'chat'>('landing');

  // 5. Conversation Sessions State
  const [sessions, setSessions] = useState<ConversationSession[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SESSIONS);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [activeSessionId, setActiveSessionId] = useState<string>(() => {
    try {
      return localStorage.getItem(STORAGE_KEYS.ACTIVE_SESSION) || '';
    } catch {
      return '';
    }
  });

  // Sync session state to local storage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessions));
  }, [sessions]);

  useEffect(() => {
    if (activeSessionId) {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_SESSION, activeSessionId);
    } else {
      localStorage.removeItem(STORAGE_KEYS.ACTIVE_SESSION);
    }
  }, [activeSessionId]);

  // Get active session messages
  const currentSession = sessions.find((s) => s.id === activeSessionId);
  const messages = currentSession ? currentSession.messages : [];

  // Helper to create a new session
  const createNewSession = (personaId: PersonaID, initialPrompt?: string): string => {
    const persona = getPersonaById(personaId, customPersonas);
    const newId = `session_${Date.now()}`;
    const newSession: ConversationSession = {
      id: newId,
      title: initialPrompt ? `${persona.name}: ${initialPrompt.slice(0, 30)}...` : `${persona.name} Session`,
      activePersonaId: personaId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages: [],
    };

    setSessions((prev) => [newSession, ...prev]);
    setActiveSessionId(newId);
    setActivePersonaId(personaId);
    return newId;
  };

  // 6. Streaming State
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const abortControllerRef = useRef<AbortController | null>(null);

  // Modals state
  const [isInspectorOpen, setIsInspectorOpen] = useState(false);
  const [isCustomizerOpen, setIsCustomizerOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Enter chat from landing hero
  const handleEnterChatFromLanding = () => {
    if (!activeSessionId || !currentSession) {
      createNewSession(activePersonaId);
    }
    setViewMode('chat');
  };

  // Main Send Message Handler (SSE Stream)
  const handleSendMessage = async (
    text: string,
    targetSessionId?: string,
    forcedPersonaId?: PersonaID
  ) => {
    const pId = forcedPersonaId || activePersonaId;
    const persona = getPersonaById(pId, customPersonas);
    let sId = targetSessionId || activeSessionId;

    if (!sId) {
      sId = createNewSession(pId, text);
    }

    const userMessage: ChatMessage = {
      id: `msg_user_${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: Date.now(),
      personaId: pId,
    };

    // Construct updated messages history synchronously
    const existingSession = sessions.find((s) => s.id === sId);
    const existingMessages = existingSession ? existingSession.messages : [];
    const updatedHistory = [...existingMessages, userMessage];

    // Append user message to state
    setSessions((prev) => {
      const exists = prev.some((s) => s.id === sId);
      if (exists) {
        return prev.map((s) => {
          if (s.id === sId) {
            return {
              ...s,
              title: s.messages.length === 0 ? `${text.slice(0, 35)}...` : s.title,
              updatedAt: Date.now(),
              messages: updatedHistory,
            };
          }
          return s;
        });
      } else {
        const personaObj = getPersonaById(pId, customPersonas);
        const newSession: ConversationSession = {
          id: sId!,
          title: `${personaObj.name}: ${text.slice(0, 30)}...`,
          activePersonaId: pId,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          messages: updatedHistory,
        };
        return [newSession, ...prev];
      }
    });

    // Prepare streaming
    setIsStreaming(true);
    setStreamingContent('');

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    const startTime = Date.now();
    let accumulatedText = '';
    let modelUsed = settings.model;

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: abortController.signal,
        body: JSON.stringify({
          messages: updatedHistory,
          persona,
          model: settings.model,
          temperature: settings.temperature,
        }),
      });

      if (!response.ok || !response.body) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunkText = decoder.decode(value, { stream: true });
        const lines = chunkText.split('\n');

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith('data: ')) {
            const dataStr = trimmed.slice(6);
            if (dataStr === '[DONE]') {
              break;
            }
            try {
              const data = JSON.parse(dataStr);
              if (data.type === 'meta') {
                modelUsed = data.modelUsed || settings.model;
              } else if (data.chunk) {
                accumulatedText += data.chunk;
                setStreamingContent((prev) => prev + data.chunk);
              } else if (data.error) {
                const fallbackMsg = persona.fallbackQuote || 'Signal temporarily disrupted. Stand by while memory channels synchronize.';
                accumulatedText += (accumulatedText ? '\n\n' : '') + fallbackMsg;
                setStreamingContent((prev) => prev + (prev ? '\n\n' : '') + fallbackMsg);
              }
            } catch {
              // Ignore partial JSON buffer chunks
            }
          }
        }
      }

      // Stream completed - Append assistant message
      const elapsedMs = Date.now() - startTime;
      const assistantMessage: ChatMessage = {
        id: `msg_assistant_${Date.now()}`,
        role: 'assistant',
        content: accumulatedText || persona.fallbackQuote || 'Signal temporarily disrupted. Stand by while memory channels synchronize.',
        timestamp: Date.now(),
        personaId: pId,
        meta: {
          thinkingTimeMs: elapsedMs,
          modelUsed,
        },
      };

      setSessions((prev) =>
        prev.map((s) => {
          if (s.id === sId) {
            return {
              ...s,
              updatedAt: Date.now(),
              messages: [...s.messages, assistantMessage],
            };
          }
          return s;
        })
      );
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        console.error('Streaming error:', error);
        const fallbackMsg = persona.fallbackQuote || 'Signal temporarily disrupted. Stand by while memory channels synchronize.';
        const errorMessage: ChatMessage = {
          id: `msg_err_${Date.now()}`,
          role: 'assistant',
          content: fallbackMsg,
          timestamp: Date.now(),
          personaId: pId,
        };
        setSessions((prev) =>
          prev.map((s) => (s.id === sId ? { ...s, messages: [...s.messages, errorMessage] } : s))
        );
      }
    } finally {
      setIsStreaming(false);
      setStreamingContent('');
      abortControllerRef.current = null;
    }
  };

  const handleStopStreaming = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsStreaming(false);
    }
  };

  const handleClearThread = () => {
    if (!activeSessionId) return;
    setSessions((prev) =>
      prev.map((s) => (s.id === activeSessionId ? { ...s, messages: [] } : s))
    );
  };

  const handleRegenerate = () => {
    if (!currentSession || currentSession.messages.length === 0 || isStreaming) return;

    // Remove last assistant message and re-send last user input
    const history = [...currentSession.messages];
    const lastMsg = history[history.length - 1];

    if (lastMsg.role === 'assistant') {
      history.pop();
    }

    const lastUserMsg = history[history.length - 1];
    if (lastUserMsg && lastUserMsg.role === 'user') {
      const promptToResend = lastUserMsg.content;
      history.pop();

      setSessions((prev) =>
        prev.map((s) => (s.id === activeSessionId ? { ...s, messages: history } : s))
      );

      setTimeout(() => {
        handleSendMessage(promptToResend);
      }, 50);
    }
  };

  const handleClearAllSessions = () => {
    setSessions([]);
    setActiveSessionId('');
    setViewMode('landing');
  };

  return (
    <div className="relative min-h-screen bg-black text-zinc-100 font-sans selection:bg-white selection:text-black">
      {/* Main Content Router */}
      {viewMode === 'landing' ? (
        <LandingHero onEnterChat={handleEnterChatFromLanding} />
      ) : (
        <ChatInterface
          activePersona={activePersona}
          allPersonas={allPersonas}
          messages={messages}
          isStreaming={isStreaming}
          streamingContent={streamingContent}
          onSendMessage={handleSendMessage}
          onStopStreaming={handleStopStreaming}
          onSelectPersona={(id) => setActivePersonaId(id)}
          onClearThread={handleClearThread}
          onRegenerate={handleRegenerate}
          onOpenInspector={() => setIsInspectorOpen(true)}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenSidebar={() => setIsSidebarOpen(true)}
          onBackToLanding={() => setViewMode('landing')}
          onOpenCustomizer={() => setIsCustomizerOpen(true)}
          settings={settings}
        />
      )}

      {/* Modals & Slide-Overs */}
      <PersonaInspectorModal
        persona={activePersona}
        isOpen={isInspectorOpen}
        onClose={() => setIsInspectorOpen(false)}
      />

      <PersonaCustomizerModal
        isOpen={isCustomizerOpen}
        onClose={() => setIsCustomizerOpen(false)}
        onSavePersona={handleSaveCustomPersona}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={(newSettings) => setSettings((prev) => ({ ...prev, ...newSettings }))}
        onClearAllSessions={handleClearAllSessions}
      />

      <SidebarSessions
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSelectSession={(id) => {
          setActiveSessionId(id);
          setViewMode('chat');
        }}
        onNewSession={() => {
          createNewSession(activePersonaId);
          setViewMode('chat');
        }}
        onDeleteSession={(id) => {
          setSessions((prev) => prev.filter((s) => s.id !== id));
          if (activeSessionId === id) {
            setActiveSessionId('');
            setViewMode('landing');
          }
        }}
        getPersona={(id) => getPersonaById(id, customPersonas)}
      />
    </div>
  );
}

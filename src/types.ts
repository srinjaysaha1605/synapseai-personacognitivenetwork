export type PersonaID =
  | 'devils_advocate'
  | 'socratic'
  | 'skeptic'
  | 'strategist'
  | 'philosopher'
  | 'cybernetic'
  | string;

export type PreferredLength = 'concise' | 'balanced' | 'rigorous';

export interface Persona {
  id: PersonaID;
  name: string;
  tagline: string;
  description: string;
  accentColor: string; // e.g., '#ef4444'
  accentRgb: string; // e.g., '239, 68, 68'
  iconName: string;
  communicationStyle: string;
  reasoningBehavior: string;
  responseStructure: string;
  interactionRules: string[];
  constraints: string[];
  forbiddenBehaviors: string[];
  preferredLength: PreferredLength;
  systemInstruction: string;
  thinkingPhrases: string[];
  samplePrompts: string[];
  geometryType: 'icosahedron' | 'torus' | 'octahedron' | 'dodecahedron' | 'tetrahedron' | 'sphere';
  fallbackQuote?: string;
  isCustom?: boolean;
}

export interface ChatMessageMeta {
  thinkingTimeMs?: number;
  reasoningStance?: string;
  confidenceScore?: number;
  modelUsed?: string;
  tokensUsedEstimate?: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  personaId: PersonaID;
  meta?: ChatMessageMeta;
}

export interface ConversationSession {
  id: string;
  title: string;
  activePersonaId: PersonaID;
  createdAt: number;
  updatedAt: number;
  messages: ChatMessage[];
}

export interface AppSettings {
  model: string; // e.g. 'gemini-3.8-flash' or 'gemini-3.1-pro-preview'
  temperature: number;
  autoScroll: boolean;
  soundEffects: boolean;
  userDisplayName: string;
}

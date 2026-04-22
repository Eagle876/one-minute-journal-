export interface Journal {
  id: string;
  userId: string;
  content: string;
  mood: string;
  emoji: string;
  sentiment_score: number;
  insight: string;
  audio_url?: string;
  created_at: any;
}

export interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  message: string;
  createdAt: any;
}

export type Theme = 'light' | 'dark' | 'nature' | 'calm';

export interface AppState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

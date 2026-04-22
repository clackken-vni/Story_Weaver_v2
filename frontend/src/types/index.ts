export type WizardStep = 'settings' | 'characters' | 'world' | 'outline' | 'chapters';

export interface SettingsData {
  genre?: string;
  tone?: string;
  targetAudience?: string;
}

export interface Character {
  id: string;
  name: string;
  personality: string;
  background: string;
  motivation: string;
}

export interface CharactersData {
  characters?: Character[];
}

export interface Location {
  id: string;
  name: string;
  description: string;
}

export interface WorldData {
  locations?: Location[];
}

export interface ChapterOutline {
  id: string;
  title: string;
  summary: string;
}

export interface OutlineData {
  chapters?: ChapterOutline[];
}

export interface Chapter {
  id: string;
  number: number;
  title: string;
  content: string;
}

export interface ChaptersData {
  chapters?: Chapter[];
}

export interface StepData {
  settings?: SettingsData;
  characters?: CharactersData;
  world?: WorldData;
  outline?: OutlineData;
  chapters?: ChaptersData;
}

export interface Project {
  id: string;
  userId: string;
  title: string;
  currentStep: WizardStep;
  stepData: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  meta?: {
    total: number;
    page: number;
    limit: number;
  };
}

export interface User {
  id: string;
  email: string;
}

export interface AuthResponse {
  user: User;
  access_token: string;
  refresh_token: string;
}
export interface User {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin' | 'superadmin';
  organizationId?: string | null;
  workspaceRole: 'owner' | 'manager' | 'staff';
  plan: 'free' | 'premium';
  aiUsageCount: number;
  aiUsageLimit: number;
  onboardingCompleted: boolean;
  preferredLanguage: string;
  defaultNoteScope: 'private' | 'workspace';
  createdAt: string;
  updatedAt: string;
}

export interface Note {
  id: string;
  owner: string;
  organizationId?: string | null;
  visibility: 'private' | 'workspace';
  title: string;
  body: string;
  tags: string[];
  category: string;
  noteType: 'standard' | 'meeting';
  pinned: boolean;
  starred: boolean;
  dueDate?: string | null;
  dueTime?: string;
  reminderAt?: string | null;
  actionStatus?: 'open' | 'in_progress' | 'done';
  priority?: '' | 'low' | 'medium' | 'high';
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  details?: Array<{ field: string; message: string }>;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

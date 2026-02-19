import type { UserRole } from '../models/Roles';
import type { Project } from '../models/Project';

export interface AppUser {
  uid: string;
  id: string;
  email: string;
  fio: string;
  role: UserRole;
}

export interface AuthPayload {
  token: string;
  user: AppUser;
}

export interface DocumentRecord {
  id: string;
  projectId: string;
  clientUserId?: string;
  projectAddress?: string;
  name: string;
  type: string;
  mimeType?: string;
  size?: number;
  version?: number;
  storagePath: string;
  uploadedAt: string;
  uploadedBy?: string;
}

export type ProjectPayload = Project;

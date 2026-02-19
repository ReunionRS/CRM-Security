import { apiRequest, downloadUrl } from './http';
import type { AppUser, AuthPayload, DocumentRecord, ProjectPayload } from './types';
import type { UserRole } from '../models/Roles';
import type { Project } from '../models/Project';

export const authApi = {
  login: (email: string, password: string) =>
    apiRequest<AuthPayload>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }, false),
  me: () => apiRequest<{ user: AppUser }>('/auth/me'),
};

export const usersApi = {
  list: () => apiRequest<AppUser[]>('/users'),
  create: (input: { fio: string; email: string; password: string; role: UserRole }) =>
    apiRequest<AppUser>('/users', {
      method: 'POST',
      body: JSON.stringify(input),
    }),
  remove: (id: string) =>
    apiRequest<{ ok: boolean }>(`/users/${id}`, {
      method: 'DELETE',
    }),
};

export const projectsApi = {
  list: () => apiRequest<Project[]>('/projects'),
  get: (id: string) => apiRequest<Project>(`/projects/${id}`),
  create: (input: ProjectPayload) =>
    apiRequest<Project>('/projects', {
      method: 'POST',
      body: JSON.stringify(input),
    }),
  update: (id: string, patch: Partial<Project>) =>
    apiRequest<Project>(`/projects/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    }),
  remove: (id: string) =>
    apiRequest<{ ok: boolean }>(`/projects/${id}`, {
      method: 'DELETE',
    }),
  uploadStagePhotos: async (projectId: string, stageIndex: number, files: File[]) => {
    const fd = new FormData();
    files.forEach((file) => fd.append('files', file));
    return apiRequest<Project>(`/projects/${projectId}/stages/${stageIndex}/photos`, {
      method: 'POST',
      body: fd,
    });
  },
  deleteStagePhoto: (projectId: string, stageIndex: number, photoUrl: string) =>
    apiRequest<Project>(`/projects/${projectId}/stages/${stageIndex}/photos`, {
      method: 'DELETE',
      body: JSON.stringify({ photoUrl }),
    }),
};

export const documentsApi = {
  list: (filter?: { projectId?: string; clientUserId?: string }) => {
    const params = new URLSearchParams();
    if (filter?.projectId) params.set('projectId', filter.projectId);
    if (filter?.clientUserId) params.set('clientUserId', filter.clientUserId);
    const query = params.toString();
    return apiRequest<DocumentRecord[]>(`/documents${query ? `?${query}` : ''}`);
  },
  upload: async (input: { projectId?: string; clientUserId?: string; docType: string; file: File }) => {
    const fd = new FormData();
    if (input.projectId) fd.append('projectId', input.projectId);
    if (input.clientUserId) fd.append('clientUserId', input.clientUserId);
    fd.append('docType', input.docType);
    fd.append('file', input.file);
    return apiRequest<DocumentRecord>('/documents', {
      method: 'POST',
      body: fd,
    });
  },
  remove: (id: string) =>
    apiRequest<{ ok: boolean }>(`/documents/${id}`, {
      method: 'DELETE',
    }),
  download: (id: string) => downloadUrl(`/documents/${id}/download`),
};

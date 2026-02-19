import { documentsApi } from '../api/services';
import { apiRequest } from '../api/http';

export interface LocalDocumentRecord {
  id: string;
  projectId?: string;
  clientUserId?: string;
  docType: string;
  fileName: string;
  mimeType: string;
  size: number;
  uploadedAt: string;
  version: number;
}

export async function saveLocalDocument(args: {
  projectId?: string;
  clientUserId?: string;
  docType: string;
  file: File;
}): Promise<LocalDocumentRecord> {
  const rec = await documentsApi.upload(args);
  return {
    id: rec.id,
    projectId: rec.projectId,
    clientUserId: rec.clientUserId,
    docType: rec.type,
    fileName: rec.name,
    mimeType: rec.mimeType || 'application/octet-stream',
    size: rec.size || args.file.size,
    uploadedAt: rec.uploadedAt,
    version: rec.version || 1,
  };
}

export async function listLocalDocuments(filter?: {
  projectId?: string;
  clientUserId?: string;
}): Promise<LocalDocumentRecord[]> {
  const list = await documentsApi.list({
    projectId: filter?.projectId,
    clientUserId: filter?.clientUserId,
  });
  return list
    .map((rec) => ({
      id: rec.id,
      projectId: rec.projectId,
      clientUserId: rec.clientUserId,
      docType: rec.type,
      fileName: rec.name,
      mimeType: rec.mimeType || 'application/octet-stream',
      size: rec.size || 0,
      uploadedAt: rec.uploadedAt,
      version: rec.version || 1,
    }))
    .sort((a, b) => (a.uploadedAt < b.uploadedAt ? 1 : -1));
}

export async function getLocalDocumentBlob(id: string): Promise<Blob | null> {
  try {
    return await apiRequest<Blob>(`/documents/${id}/download`, {
      method: 'GET',
    });
  } catch {
    return null;
  }
}

export async function deleteLocalDocument(id: string): Promise<void> {
  await documentsApi.remove(id);
}

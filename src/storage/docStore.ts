export interface LocalDocumentRecord {
  id: string;
  projectId?: string;
  docType: string;
  fileName: string;
  mimeType: string;
  size: number;
  uploadedAt: string;
  version: number;
}

interface LocalDocumentDbRecord extends LocalDocumentRecord {
  blob: Blob;
}

const DB_NAME = 'crm-stroy';
const DB_VERSION = 1;
const STORE = 'documents';

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onerror = () => reject(req.error);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: 'id' });
        store.createIndex('projectId', 'projectId', { unique: false });
        store.createIndex('uploadedAt', 'uploadedAt', { unique: false });
      }
    };
    req.onsuccess = () => resolve(req.result);
  });
}

function tx<T>(
  db: IDBDatabase,
  mode: IDBTransactionMode,
  fn: (store: IDBObjectStore) => IDBRequest<T>
): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = db.transaction(STORE, mode);
    const store = t.objectStore(STORE);
    const req = fn(store);
    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve(req.result);
  });
}

export async function saveLocalDocument(args: {
  projectId?: string;
  docType: string;
  file: File;
}): Promise<LocalDocumentRecord> {
  const db = await openDb();

  const now = new Date().toISOString();
  const baseId =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `doc_${Date.now()}_${Math.random().toString(16).slice(2)}`;

  const existing = await listLocalDocuments({ projectId: args.projectId });
  const same = existing.filter(
    (d) =>
      (d.projectId || '') === (args.projectId || '') &&
      d.docType === args.docType &&
      d.fileName === args.file.name
  );
  const version = same.length ? Math.max(...same.map((d) => d.version)) + 1 : 1;

  const record: LocalDocumentDbRecord = {
    id: baseId,
    projectId: args.projectId,
    docType: args.docType,
    fileName: args.file.name,
    mimeType: args.file.type || 'application/octet-stream',
    size: args.file.size,
    uploadedAt: now,
    version,
    blob: args.file,
  };

  await tx(db, 'readwrite', (store) => store.put(record));
  db.close();

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { blob, ...meta } = record;
  return meta;
}

export async function listLocalDocuments(filter?: {
  projectId?: string;
}): Promise<LocalDocumentRecord[]> {
  const db = await openDb();
  const records = await tx<LocalDocumentDbRecord[]>(db, 'readonly', (store) => store.getAll());
  db.close();

  const meta = records.map(({ blob: _blob, ...rest }) => rest);
  const filtered =
    filter?.projectId != null
      ? meta.filter((d) => (d.projectId || '') === filter.projectId)
      : meta;

  return filtered.sort((a, b) => (a.uploadedAt < b.uploadedAt ? 1 : -1));
}

export async function getLocalDocumentBlob(id: string): Promise<Blob | null> {
  const db = await openDb();
  const rec = await tx<LocalDocumentDbRecord | undefined>(db, 'readonly', (store) => store.get(id));
  db.close();
  return rec?.blob ?? null;
}

export async function deleteLocalDocument(id: string): Promise<void> {
  const db = await openDb();
  await tx(db, 'readwrite', (store) => store.delete(id));
  db.close();
}


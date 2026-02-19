CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  fio TEXT NOT NULL,
  role TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  client_fio TEXT NOT NULL,
  client_contacts TEXT,
  client_phone TEXT,
  client_email TEXT,
  client_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  construction_address TEXT NOT NULL,
  project_type TEXT NOT NULL,
  area_sqm DOUBLE PRECISION NOT NULL DEFAULT 0,
  estimated_cost DOUBLE PRECISION NOT NULL DEFAULT 0,
  contract_amount DOUBLE PRECISION,
  paid_amount DOUBLE PRECISION,
  next_payment_date TEXT,
  last_payment_date TEXT,
  status TEXT NOT NULL,
  start_date TEXT,
  planned_end_date TEXT,
  actual_end_date TEXT,
  camera_url TEXT,
  stages JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS documents (
  id TEXT PRIMARY KEY,
  project_id TEXT REFERENCES projects(id) ON DELETE CASCADE,
  client_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  project_address TEXT,
  name TEXT NOT NULL,
  mime_type TEXT,
  size_bytes BIGINT,
  version INTEGER NOT NULL DEFAULT 1,
  type TEXT,
  storage_path TEXT NOT NULL,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  uploaded_by TEXT REFERENCES users(id) ON DELETE SET NULL
);

ALTER TABLE documents ADD COLUMN IF NOT EXISTS mime_type TEXT;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS size_bytes BIGINT;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS version INTEGER NOT NULL DEFAULT 1;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS client_user_id TEXT REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS client_phone TEXT;

CREATE INDEX IF NOT EXISTS idx_projects_client_user_id ON projects(client_user_id);
CREATE INDEX IF NOT EXISTS idx_documents_project_id ON documents(project_id);

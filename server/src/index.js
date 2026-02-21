import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import fsp from 'fs/promises';
import { randomUUID } from 'crypto';
import { fileURLToPath } from 'url';
import { Pool } from 'pg';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const UPLOADS_DIR = path.join(ROOT_DIR, 'uploads');
const DOCS_DIR = path.join(UPLOADS_DIR, 'documents');
const STAGE_PHOTOS_DIR = path.join(UPLOADS_DIR, 'stage-photos');

const {
  PORT = '4000',
  DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/crm_security',
  JWT_SECRET = 'dev_secret',
  CORS_ORIGIN = 'http://localhost:5173',
  ADMIN_EMAIL = 'admin@admin.ru',
  ADMIN_PASSWORD = 'admin123',
  ADMIN_FIO = 'Администратор',
} = process.env;

const pool = new Pool({ connectionString: DATABASE_URL });

const app = express();
app.use(cors({ origin: CORS_ORIGIN, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use('/uploads', express.static(UPLOADS_DIR));

const docStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, DOCS_DIR),
  filename: (_req, file, cb) => cb(null, `${Date.now()}-${randomUUID()}${path.extname(file.originalname)}`),
});
const stagePhotoStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, STAGE_PHOTOS_DIR),
  filename: (_req, file, cb) => cb(null, `${Date.now()}-${randomUUID()}${path.extname(file.originalname)}`),
});
const uploadDocument = multer({ storage: docStorage });
const uploadStagePhoto = multer({ storage: stagePhotoStorage });

const safeNum = (v, fallback = 0) => {
  const num = Number(v);
  return Number.isFinite(num) ? num : fallback;
};

const normalizeFilename = (value) => {
  const src = String(value || '');
  if (!src) return src;
  // Fix mojibake for UTF-8 names interpreted as latin1 by multipart parsers.
  if (/[ÐÑÃ]/.test(src)) {
    try {
      return Buffer.from(src, 'latin1').toString('utf8');
    } catch {
      return src;
    }
  }
  return src;
};

const toProject = (row) => ({
  id: row.id,
  clientFio: row.client_fio,
  clientContacts: row.client_contacts || '',
  clientPhone: row.client_phone || '',
  clientEmail: row.client_email || '',
  clientUserId: row.client_user_id || undefined,
  constructionAddress: row.construction_address,
  projectType: row.project_type,
  areaSqm: safeNum(row.area_sqm),
  estimatedCost: safeNum(row.estimated_cost),
  contractAmount: row.contract_amount == null ? undefined : safeNum(row.contract_amount),
  paidAmount: row.paid_amount == null ? undefined : safeNum(row.paid_amount),
  nextPaymentDate: row.next_payment_date || '',
  lastPaymentDate: row.last_payment_date || '',
  status: row.status,
  startDate: row.start_date || '',
  plannedEndDate: row.planned_end_date || '',
  actualEndDate: row.actual_end_date || '',
  cameraUrl: row.camera_url || '',
  stages: Array.isArray(row.stages) ? row.stages : [],
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const toUser = (row) => ({
  uid: row.id,
  id: row.id,
  email: row.email,
  fio: row.fio,
  role: row.role,
});

const toSupportMessage = (row) => ({
  id: row.id,
  clientUserId: row.client_user_id,
  messageText: row.message_text,
  createdAt: row.created_at,
  senderId: row.sender_user_id,
  senderFio: row.sender_fio,
  senderRole: row.sender_role,
  clientFio: row.client_fio,
});

const signToken = (user) =>
  jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

const authRequired = async (req, res, next) => {
  try {
    const auth = req.headers.authorization || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
    if (!token) return res.status(401).json({ error: 'Unauthorized' });

    const payload = jwt.verify(token, JWT_SECRET);
    const { rows } = await pool.query('SELECT * FROM users WHERE id = $1', [payload.id]);
    if (!rows.length) return res.status(401).json({ error: 'Unauthorized' });

    req.user = toUser(rows[0]);
    next();
  } catch {
    return res.status(401).json({ error: 'Unauthorized' });
  }
};

const roleRequired = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  next();
};

const canAccessProject = (user, project) => user.role !== 'client' || project.clientUserId === user.id;

const bootstrap = async () => {
  await fsp.mkdir(DOCS_DIR, { recursive: true });
  await fsp.mkdir(STAGE_PHOTOS_DIR, { recursive: true });

  const schemaSql = await fsp.readFile(path.join(__dirname, 'schema.sql'), 'utf8');
  await pool.query(schemaSql);

  const { rows } = await pool.query('SELECT id FROM users WHERE email = $1 LIMIT 1', [ADMIN_EMAIL.toLowerCase()]);
  if (!rows.length) {
    const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);
    await pool.query(
      'INSERT INTO users (id, email, password_hash, fio, role) VALUES ($1, $2, $3, $4, $5)',
      [randomUUID(), ADMIN_EMAIL.toLowerCase(), passwordHash, ADMIN_FIO, 'admin']
    );
    console.log(`Admin user created: ${ADMIN_EMAIL}`);
  }
};

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const email = String(req.body.email || '').toLowerCase().trim();
    const password = String(req.body.password || '');
    if (!email || !password) return res.status(400).json({ error: 'Email и пароль обязательны' });

    const { rows } = await pool.query('SELECT * FROM users WHERE email = $1 LIMIT 1', [email]);
    if (!rows.length) return res.status(401).json({ error: 'Неверный email или пароль' });

    const userRow = rows[0];
    const valid = await bcrypt.compare(password, userRow.password_hash);
    if (!valid) return res.status(401).json({ error: 'Неверный email или пароль' });

    const user = toUser(userRow);
    const token = signToken(user);
    res.json({ token, user });
  } catch (error) {
    res.status(500).json({ error: 'Ошибка входа' });
  }
});

app.get('/api/auth/me', authRequired, (req, res) => {
  res.json({ user: req.user });
});

app.get('/api/users', authRequired, async (req, res) => {
  const { rows } = await pool.query('SELECT id, email, fio, role FROM users ORDER BY created_at DESC');
  res.json(rows.map(toUser));
});

app.post('/api/users', authRequired, roleRequired('admin', 'director'), async (req, res) => {
  try {
    const email = String(req.body.email || '').toLowerCase().trim();
    const password = String(req.body.password || '');
    const fio = String(req.body.fio || '').trim();
    const role = String(req.body.role || 'manager');

    if (!email || !password || !fio) {
      return res.status(400).json({ error: 'fio, email, password обязательны' });
    }

    const exists = await pool.query('SELECT id FROM users WHERE email = $1 LIMIT 1', [email]);
    if (exists.rows.length) {
      return res.status(409).json({ error: 'Пользователь с таким email уже существует' });
    }

    const id = randomUUID();
    const passwordHash = await bcrypt.hash(password, 10);
    const { rows } = await pool.query(
      'INSERT INTO users (id, email, password_hash, fio, role) VALUES ($1, $2, $3, $4, $5) RETURNING id, email, fio, role',
      [id, email, passwordHash, fio, role]
    );

    res.status(201).json(toUser(rows[0]));
  } catch {
    res.status(500).json({ error: 'Ошибка создания пользователя' });
  }
});

app.delete('/api/users/:id', authRequired, roleRequired('admin', 'director'), async (req, res) => {
  const id = req.params.id;
  if (id === req.user.id) {
    return res.status(400).json({ error: 'Нельзя удалить текущего пользователя' });
  }
  await pool.query('DELETE FROM users WHERE id = $1', [id]);
  res.json({ ok: true });
});

app.get('/api/projects', authRequired, async (req, res) => {
  const isClient = req.user.role === 'client';
  const query = isClient
    ? 'SELECT * FROM projects WHERE client_user_id = $1 ORDER BY created_at DESC'
    : 'SELECT * FROM projects ORDER BY created_at DESC';
  const args = isClient ? [req.user.id] : [];
  const { rows } = await pool.query(query, args);
  res.json(rows.map(toProject));
});

app.get('/api/projects/:id', authRequired, async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM projects WHERE id = $1 LIMIT 1', [req.params.id]);
  if (!rows.length) return res.status(404).json({ error: 'Объект не найден' });
  const project = toProject(rows[0]);
  if (!canAccessProject(req.user, project)) return res.status(403).json({ error: 'Forbidden' });
  res.json(project);
});

app.post('/api/projects', authRequired, roleRequired('admin', 'director', 'manager', 'foreman'), async (req, res) => {
  try {
    const payload = req.body;
    const id = randomUUID();
    const now = new Date().toISOString();

    const { rows } = await pool.query(
      `INSERT INTO projects (
        id, client_fio, client_contacts, client_phone, client_email, client_user_id, construction_address,
        project_type, area_sqm, estimated_cost, contract_amount, paid_amount, next_payment_date,
        last_payment_date, status, start_date, planned_end_date, actual_end_date, camera_url,
        stages, created_at, updated_at
      ) VALUES (
        $1,$2,$3,$4,$5,$6,$7,
        $8,$9,$10,$11,$12,$13,
        $14,$15,$16,$17,$18,$19,
        $20,$21,$22
      ) RETURNING *`,
      [
        id,
        String(payload.clientFio || ''),
        String(payload.clientContacts || payload.clientPhone || ''),
        String(payload.clientPhone || ''),
        String(payload.clientEmail || ''),
        payload.clientUserId || null,
        String(payload.constructionAddress || ''),
        String(payload.projectType || 'typical'),
        safeNum(payload.areaSqm),
        safeNum(payload.estimatedCost),
        payload.contractAmount == null ? null : safeNum(payload.contractAmount),
        payload.paidAmount == null ? null : safeNum(payload.paidAmount),
        payload.nextPaymentDate || null,
        payload.lastPaymentDate || null,
        String(payload.status || 'in_progress'),
        payload.startDate || null,
        payload.plannedEndDate || null,
        payload.actualEndDate || null,
        payload.cameraUrl || null,
        JSON.stringify(Array.isArray(payload.stages) ? payload.stages : []),
        now,
        now,
      ]
    );

    res.status(201).json(toProject(rows[0]));
  } catch {
    res.status(500).json({ error: 'Ошибка создания объекта' });
  }
});

app.patch('/api/projects/:id', authRequired, async (req, res) => {
  const existing = await pool.query('SELECT * FROM projects WHERE id = $1 LIMIT 1', [req.params.id]);
  if (!existing.rows.length) return res.status(404).json({ error: 'Объект не найден' });

  const current = toProject(existing.rows[0]);
  if (!canAccessProject(req.user, current)) return res.status(403).json({ error: 'Forbidden' });
  if (req.user.role === 'client') return res.status(403).json({ error: 'Недостаточно прав для редактирования' });

  const patch = req.body || {};
  const merged = {
    ...current,
    ...patch,
    clientUserId: patch.clientUserId ?? current.clientUserId,
    updatedAt: new Date().toISOString(),
  };

  const { rows } = await pool.query(
    `UPDATE projects SET
      client_fio=$2,
      client_contacts=$3,
      client_phone=$4,
      client_email=$5,
      client_user_id=$6,
      construction_address=$7,
      project_type=$8,
      area_sqm=$9,
      estimated_cost=$10,
      contract_amount=$11,
      paid_amount=$12,
      next_payment_date=$13,
      last_payment_date=$14,
      status=$15,
      start_date=$16,
      planned_end_date=$17,
      actual_end_date=$18,
      camera_url=$19,
      stages=$20::jsonb,
      updated_at=$21
     WHERE id=$1
     RETURNING *`,
    [
      req.params.id,
      merged.clientFio,
      merged.clientContacts || merged.clientPhone || null,
      merged.clientPhone || null,
      merged.clientEmail || null,
      merged.clientUserId || null,
      merged.constructionAddress,
      merged.projectType,
      safeNum(merged.areaSqm),
      safeNum(merged.estimatedCost),
      merged.contractAmount == null ? null : safeNum(merged.contractAmount),
      merged.paidAmount == null ? null : safeNum(merged.paidAmount),
      merged.nextPaymentDate || null,
      merged.lastPaymentDate || null,
      merged.status,
      merged.startDate || null,
      merged.plannedEndDate || null,
      merged.actualEndDate || null,
      merged.cameraUrl || null,
      JSON.stringify(Array.isArray(merged.stages) ? merged.stages : []),
      merged.updatedAt,
    ]
  );

  res.json(toProject(rows[0]));
});

app.delete('/api/projects/:id', authRequired, roleRequired('admin', 'director', 'manager'), async (req, res) => {
  await pool.query('DELETE FROM projects WHERE id = $1', [req.params.id]);
  res.json({ ok: true });
});

app.get('/api/documents', authRequired, async (req, res) => {
  const projectId = req.query.projectId ? String(req.query.projectId) : null;
  const clientUserId = req.query.clientUserId ? String(req.query.clientUserId) : null;
  const isClient = req.user.role === 'client';

  let sql = `
    SELECT d.* FROM documents d
    LEFT JOIN projects p ON p.id = d.project_id
  `;
  const where = [];
  const params = [];

  if (projectId) {
    params.push(projectId);
    where.push(`d.project_id = $${params.length}`);
  }
  if (clientUserId) {
    params.push(clientUserId);
    where.push(`(d.client_user_id = $${params.length} OR p.client_user_id = $${params.length})`);
  }
  if (isClient) {
    params.push(req.user.id);
    where.push(`(d.client_user_id = $${params.length} OR p.client_user_id = $${params.length})`);
  }

  if (where.length) sql += ` WHERE ${where.join(' AND ')}`;
  sql += ' ORDER BY d.uploaded_at DESC';

  const { rows } = await pool.query(sql, params);
  res.json(
    rows.map((r) => ({
      id: r.id,
      projectId: r.project_id,
      clientUserId: r.client_user_id,
      projectAddress: r.project_address,
      name: normalizeFilename(r.name),
      type: r.type,
      mimeType: r.mime_type || 'application/octet-stream',
      size: Number(r.size_bytes || 0),
      version: Number(r.version || 1),
      storagePath: r.storage_path,
      uploadedAt: r.uploaded_at,
      uploadedBy: r.uploaded_by,
    }))
  );
});

app.post('/api/documents', authRequired, uploadDocument.single('file'), async (req, res) => {
  if (req.user.role === 'client') {
    return res.status(403).json({ error: 'Клиент не может загружать документы' });
  }
  if (!req.file) return res.status(400).json({ error: 'Файл обязателен' });

  const id = randomUUID();
  const projectId = req.body.projectId ? String(req.body.projectId) : null;
  const clientUserId = req.body.clientUserId ? String(req.body.clientUserId) : null;
  const docType = String(req.body.docType || 'Файл');

  let projectAddress = '';
  if (projectId) {
    const { rows } = await pool.query('SELECT * FROM projects WHERE id = $1 LIMIT 1', [projectId]);
    if (!rows.length) return res.status(404).json({ error: 'Объект не найден' });
    const project = toProject(rows[0]);
    if (!canAccessProject(req.user, project) && req.user.role === 'client') {
      return res.status(403).json({ error: 'Forbidden' });
    }
    projectAddress = project.constructionAddress;
  }

  const originalName = normalizeFilename(req.file.originalname);

  let finalClientUserId = clientUserId;
  if (projectId && !finalClientUserId) {
    const projectData = await pool.query('SELECT client_user_id FROM projects WHERE id = $1 LIMIT 1', [projectId]);
    finalClientUserId = projectData.rows[0]?.client_user_id || null;
  }

  if (finalClientUserId) {
    const existsClient = await pool.query('SELECT id FROM users WHERE id = $1 LIMIT 1', [finalClientUserId]);
    if (!existsClient.rows.length) return res.status(400).json({ error: 'Клиент не найден' });
  }

  const storagePath = `/uploads/documents/${req.file.filename}`;
  const versionQuery = await pool.query(
    `SELECT COALESCE(MAX(version), 0) AS max_version
     FROM documents
     WHERE project_id IS NOT DISTINCT FROM $1
       AND client_user_id IS NOT DISTINCT FROM $2
       AND type = $3
       AND name = $4`,
    [projectId, finalClientUserId, docType, originalName]
  );
  const version = Number(versionQuery.rows[0]?.max_version || 0) + 1;

  const { rows } = await pool.query(
    `INSERT INTO documents (
      id, project_id, client_user_id, project_address, name, mime_type, size_bytes, version, type, storage_path, uploaded_by
    )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
     RETURNING *`,
    [
      id,
      projectId,
      finalClientUserId,
      projectAddress,
      originalName,
      req.file.mimetype || 'application/octet-stream',
      req.file.size || 0,
      version,
      docType,
      storagePath,
      req.user.id,
    ]
  );

  const doc = rows[0];
  res.status(201).json({
    id: doc.id,
    projectId: doc.project_id,
    clientUserId: doc.client_user_id,
    projectAddress: doc.project_address,
    name: normalizeFilename(doc.name),
    type: doc.type,
    mimeType: doc.mime_type || 'application/octet-stream',
    size: Number(doc.size_bytes || 0),
    version: Number(doc.version || 1),
    storagePath: doc.storage_path,
    uploadedAt: doc.uploaded_at,
    uploadedBy: doc.uploaded_by,
  });
});

app.get('/api/documents/:id/download', authRequired, async (req, res) => {
  const { rows } = await pool.query(
    `SELECT d.*, p.client_user_id AS project_client_user_id
     FROM documents d
     LEFT JOIN projects p ON p.id = d.project_id
     WHERE d.id = $1 LIMIT 1`,
    [req.params.id]
  );
  if (!rows.length) return res.status(404).json({ error: 'Документ не найден' });
  const rec = rows[0];
  const ownerClientId = rec.client_user_id || rec.project_client_user_id;
  if (req.user.role === 'client' && ownerClientId !== req.user.id) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const absolutePath = path.join(ROOT_DIR, rec.storage_path.replace(/^\//, ''));
  if (!fs.existsSync(absolutePath)) return res.status(404).json({ error: 'Файл не найден' });
  return res.download(absolutePath, normalizeFilename(rec.name));
});

app.delete('/api/documents/:id', authRequired, async (req, res) => {
  const { rows } = await pool.query(
    `SELECT d.*, p.client_user_id AS project_client_user_id
     FROM documents d
     LEFT JOIN projects p ON p.id = d.project_id
     WHERE d.id = $1 LIMIT 1`,
    [req.params.id]
  );
  if (!rows.length) return res.status(404).json({ error: 'Документ не найден' });

  const rec = rows[0];
  if (req.user.role === 'client') return res.status(403).json({ error: 'Недостаточно прав' });

  const absolutePath = path.join(ROOT_DIR, rec.storage_path.replace(/^\//, ''));
  if (fs.existsSync(absolutePath)) {
    await fsp.unlink(absolutePath).catch(() => {});
  }

  await pool.query('DELETE FROM documents WHERE id = $1', [req.params.id]);
  res.json({ ok: true });
});

app.get('/api/support/messages', authRequired, async (req, res) => {
  try {
    const isClient = req.user.role === 'client';
    const clientUserId = req.query.clientUserId ? String(req.query.clientUserId) : null;

    const params = [];
    const where = [];

    if (isClient) {
      params.push(req.user.id);
      where.push(`m.client_user_id = $${params.length}`);
    } else if (clientUserId) {
      params.push(clientUserId);
      where.push(`m.client_user_id = $${params.length}`);
    }

    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const { rows } = await pool.query(
      `
      SELECT
        m.*,
        sender.fio AS sender_fio,
        sender.role AS sender_role,
        client.fio AS client_fio
      FROM support_messages m
      INNER JOIN users sender ON sender.id = m.sender_user_id
      INNER JOIN users client ON client.id = m.client_user_id
      ${whereSql}
      ORDER BY m.created_at ASC
      `,
      params
    );

    res.json(rows.map(toSupportMessage));
  } catch {
    res.status(500).json({ error: 'Ошибка загрузки чата поддержки' });
  }
});

app.post('/api/support/messages', authRequired, async (req, res) => {
  try {
    const messageText = String(req.body.messageText || '').trim();
    if (!messageText) return res.status(400).json({ error: 'Сообщение не может быть пустым' });

    const isClient = req.user.role === 'client';
    let clientUserId = isClient ? req.user.id : String(req.body.clientUserId || '').trim();

    if (!clientUserId) {
      return res.status(400).json({ error: 'Выберите клиента для переписки' });
    }

    const clientUser = await pool.query('SELECT id, role FROM users WHERE id = $1 LIMIT 1', [clientUserId]);
    if (!clientUser.rows.length || clientUser.rows[0].role !== 'client') {
      return res.status(400).json({ error: 'Клиент не найден' });
    }

    const id = randomUUID();
    const { rows } = await pool.query(
      `
      INSERT INTO support_messages (id, client_user_id, sender_user_id, message_text)
      VALUES ($1, $2, $3, $4)
      RETURNING id
      `,
      [id, clientUserId, req.user.id, messageText]
    );

    const { rows: messageRows } = await pool.query(
      `
      SELECT
        m.*,
        sender.fio AS sender_fio,
        sender.role AS sender_role,
        client.fio AS client_fio
      FROM support_messages m
      INNER JOIN users sender ON sender.id = m.sender_user_id
      INNER JOIN users client ON client.id = m.client_user_id
      WHERE m.id = $1
      LIMIT 1
      `,
      [rows[0].id]
    );

    res.status(201).json(toSupportMessage(messageRows[0]));
  } catch {
    res.status(500).json({ error: 'Ошибка отправки сообщения' });
  }
});

app.post(
  '/api/projects/:id/stages/:stageIndex/photos',
  authRequired,
  uploadStagePhoto.fields([
    { name: 'files', maxCount: 20 },
    { name: 'file', maxCount: 20 },
  ]),
  async (req, res) => {
  const uploadedByFilesField = Array.isArray(req.files?.files) ? req.files.files : [];
  const uploadedByFileField = Array.isArray(req.files?.file) ? req.files.file : [];
  const files = [...uploadedByFilesField, ...uploadedByFileField];
  if (!files.length) return res.status(400).json({ error: 'Файл обязателен' });
  if (req.user.role === 'client') return res.status(403).json({ error: 'Недостаточно прав' });

  const stageIndex = Number(req.params.stageIndex);
  const { rows } = await pool.query('SELECT * FROM projects WHERE id = $1 LIMIT 1', [req.params.id]);
  if (!rows.length) return res.status(404).json({ error: 'Объект не найден' });

  const project = toProject(rows[0]);
  const nextStages = Array.isArray(project.stages) ? [...project.stages] : [];
  if (!nextStages[stageIndex]) {
    return res.status(400).json({ error: 'Этап не найден' });
  }

  const photoUrls = Array.isArray(nextStages[stageIndex].photoUrls) ? [...nextStages[stageIndex].photoUrls] : [];
  for (const file of files) {
    photoUrls.push(`/uploads/stage-photos/${file.filename}`);
  }
  nextStages[stageIndex] = { ...nextStages[stageIndex], photoUrls };

  const { rows: updatedRows } = await pool.query(
    'UPDATE projects SET stages = $2::jsonb, updated_at = $3 WHERE id = $1 RETURNING *',
    [req.params.id, JSON.stringify(nextStages), new Date().toISOString()]
  );

  res.json(toProject(updatedRows[0]));
});

app.delete('/api/projects/:id/stages/:stageIndex/photos', authRequired, async (req, res) => {
  if (req.user.role === 'client') return res.status(403).json({ error: 'Недостаточно прав' });

  const stageIndex = Number(req.params.stageIndex);
  const photoUrl = String(req.body.photoUrl || '');

  const { rows } = await pool.query('SELECT * FROM projects WHERE id = $1 LIMIT 1', [req.params.id]);
  if (!rows.length) return res.status(404).json({ error: 'Объект не найден' });

  const project = toProject(rows[0]);
  const nextStages = Array.isArray(project.stages) ? [...project.stages] : [];
  if (!nextStages[stageIndex]) {
    return res.status(400).json({ error: 'Этап не найден' });
  }

  const photoUrls = Array.isArray(nextStages[stageIndex].photoUrls)
    ? nextStages[stageIndex].photoUrls.filter((x) => x !== photoUrl)
    : [];
  nextStages[stageIndex] = { ...nextStages[stageIndex], photoUrls };

  const absolutePath = path.join(ROOT_DIR, photoUrl.replace(/^\//, ''));
  if (photoUrl && fs.existsSync(absolutePath)) {
    await fsp.unlink(absolutePath).catch(() => {});
  }

  const { rows: updatedRows } = await pool.query(
    'UPDATE projects SET stages = $2::jsonb, updated_at = $3 WHERE id = $1 RETURNING *',
    [req.params.id, JSON.stringify(nextStages), new Date().toISOString()]
  );

  res.json(toProject(updatedRows[0]));
});

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Внутренняя ошибка сервера' });
});

bootstrap()
  .then(() => {
    app.listen(Number(PORT), () => {
      console.log(`API started on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Failed to start server', err);
    process.exit(1);
  });

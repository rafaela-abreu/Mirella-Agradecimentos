import express from 'express';
import cookieParser from 'cookie-parser';
import multer from 'multer';
import jwt from 'jsonwebtoken';
import mysql from 'mysql2/promise';
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = Number(process.env.PORT || 3000);
const publicDir = path.join(__dirname, 'public');
const galleryFile = path.join(__dirname, 'public', 'gallery.json');
const uploadDir = path.join(publicDir, 'uploads');
const upload = multer({ storage: multer.memoryStorage(), limits: { files: 80, fileSize: 15 * 1024 * 1024 }, fileFilter: (_req, file, cb) => cb(null, /^image\/(jpeg|png|webp|gif)$/i.test(file.mimetype)) });
let pool;

async function db() {
  if (!process.env.DATABASE_URL) return null;
  if (!pool) pool = mysql.createPool(process.env.DATABASE_URL);
  return pool;
}
async function initDatabase() {
  const p = await db();
  if (!p) return;
  await p.query(`CREATE TABLE IF NOT EXISTS gallery_photos (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL DEFAULT 'Foto da festa',
    file_url VARCHAR(1024) NOT NULL,
    storage_key VARCHAR(512) NULL,
    original_name VARCHAR(255) NULL,
    is_published TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_gallery_published_created (is_published, created_at)
  )`);
  const [rows] = await p.query('SELECT COUNT(*) AS total FROM gallery_photos');
  if (Number(rows[0].total) === 0) {
    const seed = ['foto-0.jpg','foto-1.jpg','foto-2.jpg','foto-3.jpg','foto-4.jpg','foto-5.jpg','foto-6.jpg'];
    for (const file of seed) await p.query('INSERT INTO gallery_photos (title,file_url,original_name) VALUES (?,?,?)', ['Foto da festa', `/uploads/${file}`, file]);
  }
}
async function seedLocal() {
  try { await fs.access(galleryFile); } catch { await fs.writeFile(galleryFile, JSON.stringify([], null, 2)); }
}
async function listPhotos() {
  const p = await db();
  if (p) { try { const [rows] = await p.query('SELECT id,title,file_url AS url,original_name AS originalName,created_at AS createdAt FROM gallery_photos WHERE is_published=1 ORDER BY created_at ASC'); return rows; } catch { /* fallback below keeps Preview usable before migration */ } }
  return JSON.parse(await fs.readFile(galleryFile, 'utf8'));
}
async function addPhotos(items) {
  const p = await db();
  if (p) { for (const item of items) await p.query('INSERT INTO gallery_photos (title,file_url,storage_key,original_name) VALUES (?,?,?,?)', [item.title, item.url, item.storageKey || null, item.originalName]); return; }
  const current = JSON.parse(await fs.readFile(galleryFile, 'utf8'));
  current.push(...items.map((item, i) => ({ ...item, id: `${Date.now()}-${i}` })));
  await fs.writeFile(galleryFile, JSON.stringify(current, null, 2));
}
async function isSignedIn(req) {
  const token = req.cookies.webdev_app_session;
  if (!token || !process.env.MANUS_JWT_SECRET || !process.env.MANUS_PROJECT_ID) return null;
  try { return jwt.verify(token, process.env.MANUS_JWT_SECRET, { algorithms: ['HS256'] }); } catch { return null; }
}
async function requireUser(req, res, next) { const user = await isSignedIn(req); if (!user) return res.status(401).json({ error: 'login_required' }); req.user = user; next(); }
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());
app.get('/api/gallery', async (_req, res) => { try { res.json({ photos: await listPhotos() }); } catch (e) { res.status(500).json({ error: 'gallery_unavailable' }); } });
app.get('/api/me', async (req, res) => { const user = await isSignedIn(req); res.json({ authenticated: Boolean(user), user: user ? { openId: user.openId, name: user.name, email: user.email } : null }); });
app.get('/auth/login', (req, res) => { const origin = `${req.protocol}://${req.get('host')}`; const redirectUri = `${origin}/auth/callback`; const nonce = crypto.randomBytes(18).toString('hex'); const state = Buffer.from(JSON.stringify({ redirectUri, nonce })).toString('base64url'); res.cookie('__Host-oauth_state', nonce, { httpOnly: true, sameSite: 'lax', secure: true, maxAge: 5 * 60 * 1000 }); const url = new URL(`${process.env.MANUS_OAUTH_PORTAL_URL}/app-auth`); url.searchParams.set('appId', process.env.MANUS_PROJECT_ID || ''); url.searchParams.set('redirectUri', redirectUri); url.searchParams.set('state', state); url.searchParams.set('responseType', 'code'); res.redirect(url.toString()); });
app.get('/auth/callback', async (req, res) => { try { const state = JSON.parse(Buffer.from(String(req.query.state || ''), 'base64url').toString()); if (!state.nonce || state.nonce !== req.cookies['__Host-oauth_state']) throw new Error('invalid_state'); const exchange = await fetch(`${process.env.MANUS_OAUTH_API_URL}/webdev.v1.WebDevAuthPublicService/ExchangeToken`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ clientId: process.env.MANUS_PROJECT_ID, grantType: 'authorization_code', code: req.query.code, redirectUri: state.redirectUri }) }); const data = await exchange.json(); if (!data.accessToken) throw new Error('exchange_failed'); const info = await fetch(`${process.env.MANUS_OAUTH_API_URL}/webdev.v1.WebDevAuthPublicService/GetUserInfo`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ accessToken: data.accessToken }) }).then(r => r.json()); const session = jwt.sign({ ...info, appId: process.env.MANUS_PROJECT_ID }, process.env.MANUS_JWT_SECRET, { algorithm: 'HS256', expiresIn: '30d' }); res.cookie('webdev_app_session', session, { httpOnly: true, sameSite: 'none', secure: true, maxAge: 30 * 24 * 60 * 60 * 1000 }); res.redirect('/familia'); } catch { res.status(401).send('Não foi possível concluir o login. Volte e tente novamente.'); } });
app.post('/auth/logout', (_req, res) => { res.clearCookie('webdev_app_session'); res.redirect('/'); });
app.post('/api/gallery/upload', requireUser, upload.array('photos', 80), async (req, res) => { try { await fs.mkdir(uploadDir, { recursive: true }); const items = []; for (const file of req.files || []) { const ext = path.extname(file.originalname).toLowerCase() || '.jpg'; const name = `${Date.now()}-${crypto.randomBytes(4).toString('hex')}${ext}`; await fs.writeFile(path.join(uploadDir, name), file.buffer); items.push({ title: 'Foto da festa', url: `/uploads/${name}`, originalName: file.originalname }); } await addPhotos(items); res.json({ ok: true, added: items.length, photos: await listPhotos() }); } catch (e) { res.status(500).json({ error: 'upload_failed' }); } });
app.delete('/api/gallery/:id', requireUser, async (req, res) => { const p = await db(); if (p) await p.query('UPDATE gallery_photos SET is_published=0 WHERE id=?', [req.params.id]); else { const current = JSON.parse(await fs.readFile(galleryFile, 'utf8')); await fs.writeFile(galleryFile, JSON.stringify(current.filter(x => String(x.id) !== String(req.params.id)), null, 2)); } res.json({ ok: true }); });
app.get('/manus-routes.json', (_req, res) => res.sendFile(path.join(__dirname, 'manus-routes.json')));
app.use(express.static(publicDir, { extensions: ['html'] }));
app.get('/familia', (_req, res) => res.sendFile(path.join(publicDir, 'familia.html')));
app.get('*', (_req, res) => res.sendFile(path.join(publicDir, 'index.html')));
seedLocal().then(initDatabase).then(() => app.listen(PORT, '0.0.0.0', () => console.log(`Mirella Agradecimentos ouvindo na porta ${PORT}`))).catch(err => { console.error(err); process.exit(1); });

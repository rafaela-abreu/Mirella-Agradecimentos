import { readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const dir = path.resolve('public/uploads');
const allowed = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif']);
const files = (await readdir(dir, { withFileTypes: true }))
  .filter(entry => entry.isFile() && allowed.has(path.extname(entry.name).toLowerCase()))
  .map(entry => entry.name)
  .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));
const photos = files.map((file, index) => ({
  id: `foto-${index + 1}`,
  title: 'Foto da festa',
  url: `./uploads/${encodeURIComponent(file)}`,
  originalName: file
}));
await writeFile('public/gallery.json', `${JSON.stringify(photos, null, 2)}\n`);
console.log(`Galeria gerada com ${photos.length} foto(s).`);

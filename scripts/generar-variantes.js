// Genera variantes AVIF y WebP a varios anchos para todas las imágenes del dir.
// Ejecuta: node scripts/generar-variantes.js

import fs from 'fs/promises';
import path from 'path';
import sharp from 'sharp';

const DIR = 'assets/img/webp'; // carpeta con tus originales (webp/jpg/png)
const WIDTHS = [640, 1024, 1280, 1536, 1920, 2560];
const INPUT_EXTS = new Set(['.webp', '.jpg', '.jpeg', '.png']);

const files = await fs.readdir(DIR);

for (const file of files) {
  const ext = path.extname(file).toLowerCase();
  if (!INPUT_EXTS.has(ext)) continue;

  const name = path.basename(file, ext);
  const input = path.join(DIR, file);
  const buf = await fs.readFile(input);

  for (const w of WIDTHS) {
    // WebP
    await sharp(buf)
      .resize({ width: w, withoutEnlargement: true })
      .webp({ quality: 78 })
      .toFile(path.join(DIR, `${name}-${w}.webp`));
    // AVIF
    await sharp(buf)
      .resize({ width: w, withoutEnlargement: true })
      .avif({ quality: 55 })
      .toFile(path.join(DIR, `${name}-${w}.avif`));
  }
  console.log('✔ Variantes creadas para', file);
}
console.log('Listo.');

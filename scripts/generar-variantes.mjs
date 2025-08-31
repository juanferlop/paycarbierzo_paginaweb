// scripts/generar-variantes.mjs
// Genera variantes WebP/AVIF a varios anchos a partir de originales.
// - Recorre subcarpetas
// - Evita re-procesar variantes ya generadas (*-640.webp, etc.)
// - Corrige orientación EXIF
// - No escala por encima del original
// - Salta si el fichero destino ya existe

import sharp from 'sharp';
import { globby } from 'globby';
import { dirname, basename, extname, join } from 'node:path';
import { mkdir, stat } from 'node:fs/promises';

const IN_DIR = 'assets/img/originales'; // <-- pon aquí tus originales (jpg/png/webp)
const OUT_DIR = 'assets/img/webp'; // <-- aquí se escribirán las variantes
const WIDTHS = [640, 1024, 1280, 1536, 1920, 2560];

// Calidad equilibrada
const WEBP_QUALITY = 80;
const AVIF_QUALITY = 75;
const AVIF_EFFORT = 4;

// Busca JPG/PNG/WEBP de entrada (recursivo)
const files = await globby(`${IN_DIR}/**/*.{jpg,jpeg,png,webp}`, {
  dot: false,
});

if (!files.length) {
  console.log(`⚠️  No se encontraron originales en ${IN_DIR}`);
  process.exit(0);
}

// Regex para saltar variantes ya existentes (p.ej. nombre-640.webp)
const isVariant = /-\d{3,4}\.(webp|avif)$/i;

for (const file of files) {
  if (isVariant.test(file)) continue; // no reprocesar derivados

  const dirRel = dirname(file).replace(IN_DIR, '');
  const outDir = join(OUT_DIR, dirRel);
  await mkdir(outDir, { recursive: true });

  const name = basename(file, extname(file));
  // Carga + corrige orientación EXIF
  const src = sharp(file).rotate();
  const meta = await src.metadata();

  const widths = WIDTHS.filter((w) => !meta.width || w <= meta.width);

  for (const w of widths) {
    // Rutas destino
    const outWebp = join(outDir, `${name}-${w}.webp`);
    const outAvif = join(outDir, `${name}-${w}.avif`);

    // Si ya existen, saltar (idempotente)
    const exists = async (p) =>
      stat(p)
        .then(() => true)
        .catch(() => false);
    if (!(await exists(outWebp))) {
      await src
        .clone()
        .resize({ width: w })
        .webp({ quality: WEBP_QUALITY })
        .toFile(outWebp);
    }
    if (!(await exists(outAvif))) {
      await src
        .clone()
        .resize({ width: w })
        .avif({ quality: AVIF_QUALITY, effort: AVIF_EFFORT })
        .toFile(outAvif);
    }
  }

  console.log(
    `✅ ${file} → ${outDir}/${name}-{${widths.join(',')}}.(webp|avif)`
  );
}

console.log('\n🎉 Variantes listas.');

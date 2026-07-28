#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const ROOT = process.cwd();
const SOURCE_JSON = path.join(ROOT, 'data', 'proyectos.json');
const WEB_CONFIG = path.join(ROOT, 'js', 'proyectos-config.js');
const APP_CONFIG = path.join(ROOT, 'app-movil-paycar', 'src', 'config.js');

function parseArg(name) {
  return process.argv.includes(name);
}

function normalizeProyecto(raw) {
  return {
    pueblo: String(raw?.pueblo || '').trim(),
    tipo: String(raw?.tipo || '').trim(),
    fecha: String(raw?.fecha || '').trim(),
    imagenes: Array.isArray(raw?.imagenes)
      ? raw.imagenes.map((v) => String(v).trim()).filter(Boolean)
      : [],
  };
}

function keyOf(p) {
  return `${p.pueblo}|${p.tipo}|${p.fecha}|${JSON.stringify(p.imagenes)}`;
}

function extractFromConfig(content, fieldName) {
  const pattern = new RegExp(`${fieldName}\\s*:\\s*['\"]([^'\"]+)['\"]`, 'i');
  const match = content.match(pattern);
  return match?.[1]?.trim() || '';
}

async function resolveConfig() {
  let url = process.env.SUPABASE_URL || '';
  let key = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_PUBLISHABLE_KEY || '';
  let table = process.env.SUPABASE_TABLE || 'obras';

  if (!url || !key) {
    try {
      const webCfg = await readFile(WEB_CONFIG, 'utf8');
      if (!url) url = extractFromConfig(webCfg, 'url');
      if (!key) key = extractFromConfig(webCfg, 'anonKey');
      if (!table) table = extractFromConfig(webCfg, 'tableName') || 'obras';
    } catch {
      // Ignorado: se intentara con otras fuentes.
    }
  }

  if (!url || !key) {
    try {
      const appCfg = await readFile(APP_CONFIG, 'utf8');
      if (!url) {
        const m = appCfg.match(/SUPABASE_URL\s*=\s*['\"]([^'\"]+)['\"]/);
        url = m?.[1]?.trim() || '';
      }
      if (!key) {
        const m = appCfg.match(/SUPABASE_ANON_KEY\s*=\s*['\"]([^'\"]+)['\"]/);
        key = m?.[1]?.trim() || '';
      }
      const t = appCfg.match(/SUPABASE_TABLE\s*=\s*['\"]([^'\"]+)['\"]/);
      if (t?.[1]) table = t[1].trim();
    } catch {
      // Ignorado: si no existe, se valida despues.
    }
  }

  if (!url || !key) {
    throw new Error(
      'No se encontro configuracion de Supabase. Define SUPABASE_URL y SUPABASE_ANON_KEY como variables de entorno, o rellena js/proyectos-config.js.'
    );
  }

  return { url: url.replace(/\/$/, ''), key, table: table || 'obras' };
}

async function fetchExisting({ url, key, table }) {
  const endpoint = `${url}/rest/v1/${encodeURIComponent(table)}?select=pueblo,tipo,fecha,imagenes`;
  const res = await fetch(endpoint, {
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
    },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Error leyendo Supabase (${res.status}): ${body}`);
  }

  const json = await res.json();
  return Array.isArray(json) ? json.map(normalizeProyecto) : [];
}

async function insertBatch({ url, key, table, rows }) {
  const endpoint = `${url}/rest/v1/${encodeURIComponent(table)}`;
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify(rows),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Error insertando en Supabase (${res.status}): ${body}`);
  }
}

async function main() {
  const apply = parseArg('--apply');

  const rawFile = await readFile(SOURCE_JSON, 'utf8');
  const parsed = JSON.parse(rawFile);
  if (!Array.isArray(parsed)) {
    throw new Error('data/proyectos.json no contiene un array de proyectos.');
  }

  const source = parsed
    .map(normalizeProyecto)
    .filter((p) => p.pueblo && p.tipo && p.fecha && p.imagenes.length > 0);

  const cfg = await resolveConfig();
  const existing = await fetchExisting(cfg);

  const existingKeys = new Set(existing.map(keyOf));
  const missing = source.filter((p) => !existingKeys.has(keyOf(p)));

  console.log(`Obras en JSON local: ${source.length}`);
  console.log(`Obras ya en Supabase: ${existing.length}`);
  console.log(`Obras pendientes de importar: ${missing.length}`);

  if (!apply) {
    console.log('\nModo simulacion. Para importar ejecuta:');
    console.log('node scripts/migrar-proyectos-a-supabase.mjs --apply');
    return;
  }

  if (missing.length === 0) {
    console.log('No hay nada que importar.');
    return;
  }

  await insertBatch({ ...cfg, rows: missing });
  console.log(`Importacion completada. Insertadas ${missing.length} obras.`);
}

main().catch((err) => {
  console.error('Fallo la migracion:', err.message);
  process.exit(1);
});

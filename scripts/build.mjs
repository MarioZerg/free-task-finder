/**
 * Сборка проекта: карта сайта → vite → статические страницы.
 *
 * Зачем отдельный скрипт, а не цепочка через `&&` в package.json:
 * платформа публикации вызывает сборку как
 *   npm run build -- --outDir /builds/<хеш>/
 * а npm дописывает такие аргументы в КОНЕЦ всей строки. В цепочке
 * «vite build && node prerender.mjs» они доставались последней команде,
 * поэтому vite складывал сайт в dist, платформа искала его в своей папке
 * и падала с «output directory not found or empty».
 *
 * Здесь аргументы разбираются один раз и передаются каждому этапу явно.
 */

import { spawnSync } from 'node:child_process';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync, readdirSync } from 'node:fs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const argv = process.argv.slice(2);

/** Каталог сборки: из аргументов или dist по умолчанию */
const readOutDir = () => {
  const i = argv.findIndex((a) => a === '--outDir' || a === '--out-dir');
  if (i !== -1 && argv[i + 1]) return argv[i + 1];
  const inline = argv.find((a) => a.startsWith('--outDir=') || a.startsWith('--out-dir='));
  if (inline) return inline.split('=').slice(1).join('=');
  return 'dist';
};

const outDir = readOutDir();

/** Остальные аргументы (--mode и прочие) пробрасываем в vite как есть */
const passThrough = () => {
  const out = [];
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === '--outDir' || a === '--out-dir') {
      i += 1;
      continue;
    }
    if (a.startsWith('--outDir=') || a.startsWith('--out-dir=')) continue;
    out.push(a);
  }
  return out;
};

const run = (cmd, args, { optional = false } = {}) => {
  const r = spawnSync(cmd, args, { stdio: 'inherit', cwd: root, shell: false });
  if (r.status === 0) return true;
  if (optional) {
    console.warn(`build: шаг «${args[0]}» пропущен (код ${r.status})`);
    return false;
  }
  process.exit(r.status ?? 1);
};

// 1. Карта сайта. Не критична для публикации — сайт без неё работает.
run(process.execPath, ['scripts/generate-sitemap.mjs'], { optional: true });

// 2. Сборка. Единственный обязательный шаг.
run('npx', ['vite', 'build', '--outDir', outDir, ...passThrough()]);

// 3. Статические страницы для поисковых роботов — надстройка над готовой
//    сборкой. Если не удастся, сайт всё равно должен опубликоваться.
run(process.execPath, ['scripts/prerender.mjs', '--outDir', outDir], { optional: true });

// Проверяем, что каталог действительно не пустой: именно это условие
// проверяет платформа перед публикацией.
const full = resolve(root, outDir);
if (!existsSync(full) || readdirSync(full).length === 0) {
  console.error(`build: каталог сборки пуст — ${full}`);
  process.exit(1);
}

console.log(`build: готово — ${outDir}`);

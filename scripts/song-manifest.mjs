import { readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const directory = path.join(process.cwd(), 'public', 'canciones');
const files = (await readdir(directory))
  .filter((file) => /\.(mp3|m4a|wav|ogg|oga|flac)$/i.test(file))
  .sort((left, right) => left.localeCompare(right, 'es'));

let preferred = [];
try {
  const raw = JSON.parse(await readFile(path.join(directory, 'order.json'), 'utf8'));
  if (Array.isArray(raw.order)) {
    preferred = raw.order.filter((name) => typeof name === 'string');
  }
} catch {
  preferred = [];
}

const ordered = [
  ...preferred.filter((name) => files.includes(name)),
  ...files.filter((name) => !preferred.includes(name)),
];

await writeFile(
  path.join(directory, 'manifest.json'),
  `${JSON.stringify({ songs: ordered }, null, 2)}\n`,
  'utf8',
);

console.log(`manifest.json: ${files.length} canciones`);

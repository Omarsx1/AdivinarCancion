import { readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const directory = path.join(process.cwd(), 'public', 'canciones');
const files = (await readdir(directory))
  .filter((file) => /\.(mp3|m4a|wav|ogg|oga|flac)$/i.test(file))
  .sort((left, right) => left.localeCompare(right, 'es'));

await writeFile(
  path.join(directory, 'manifest.json'),
  `${JSON.stringify({ songs: files }, null, 2)}\n`,
  'utf8',
);

console.log(`manifest.json: ${files.length} canciones`);

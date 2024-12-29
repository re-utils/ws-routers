/// <reference types='bun-types' />
import { existsSync, rmSync } from 'node:fs';
import { resolve } from 'node:path/posix';

import { transpileDeclaration } from 'typescript';
import tsconfig from '../tsconfig.json';
import pkg from '../package.json';

// Constants
const ROOTDIR = resolve(import.meta.dir, '..');
const SOURCEDIR = `${ROOTDIR}/src`;
const OUTDIR = `${ROOTDIR}/lib`;

const exclude = ['deno.ts'];

// Remove old content
if (existsSync(OUTDIR)) rmSync(OUTDIR, { recursive: true });

// Transpile files concurrently
for (const path of new Bun.Glob('**/*.ts').scanSync(SOURCEDIR)) {
  if (exclude.includes(path)) continue;

  const nameNoExt = path.substring(0, path.lastIndexOf('.') >>> 0);
  const outPathNoExt = `${OUTDIR}/${nameNoExt}`;

  Bun.file(`${SOURCEDIR}/${path}`)
    .text()
    .then((buf) => {
      Bun.write(`${outPathNoExt}.d.ts`, transpileDeclaration(buf, tsconfig as any).outputText);
    });
}

const entries = Array.from(new Bun.Glob('*.ts').scanSync(SOURCEDIR))
  .filter((name) => !exclude.includes(name));

Bun.build({
  // Deno is published separately
  entrypoints: entries.map((path) => `${SOURCEDIR}/${path}`),
  target: 'node',
  outdir: 'lib'
});

// @ts-expect-error package.json may not have this yet
Object.assign(pkg.exports ??= {}, Object.fromEntries(entries
  // Get the name only
  .map((name) => name.substring(0, name.lastIndexOf('.') >>> 0))
  // Package info will be moved to lib
  .map((name) => [name, `./${name}.js`])));

// Add new exports field
Bun.write(`${ROOTDIR}/package.json`, JSON.stringify(pkg, null, 2));

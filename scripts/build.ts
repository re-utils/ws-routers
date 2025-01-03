/// <reference types='bun-types' />
import { existsSync, rmSync } from 'node:fs';
import { resolve } from 'node:path/posix';

import { transpileDeclaration } from 'typescript';
import tsconfig from '../tsconfig.json';
import jsrPkg from '../jsr.json';

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

const allEntries = Array.from(new Bun.Glob('*.ts').scanSync(SOURCEDIR));
const npmEntries = allEntries.filter((name) => !exclude.includes(name));

Bun.build({
  // Deno is published separately
  entrypoints: npmEntries.map((path) => `${SOURCEDIR}/${path}`),
  target: 'node',
  outdir: 'lib'
});

// @ts-expect-error jsr.json may not have this yet
jsrPkg.exports = Object.fromEntries(allEntries
  // Package info will be moved to lib
  .map((name) => [`./${name.substring(0, name.lastIndexOf('.') >>> 0)}`, `./src/${name}`]));

// Add exports field
Bun.write(`${ROOTDIR}/jsr.json`, JSON.stringify(jsrPkg, null, 2));

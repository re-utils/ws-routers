import { cpToLib, exec } from './utils';

// JSR
await exec`bun x jsr publish`;

// NPM
await Promise.all(['./README.md', './package.json'].map(cpToLib));
await exec`cd lib && bun publish --access=public`;

import { minify } from 'uglify-js';

const OUTDIR = `${import.meta.dir}/../lib/`;

for (const path of new Bun.Glob('**/*.js').scanSync(OUTDIR)) {
  Bun.file(OUTDIR + path)
    .text()
    .then(minify)
    .then((res) => {
      if (res.error) throw res.error;
      const bytes = Uint8Array.from(res.code).byteLength;
      console.log(`"${path}":`, `${(bytes / 1e3).toFixed(2)}kB`);
    });
}

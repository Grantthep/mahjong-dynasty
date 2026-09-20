import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/server.ts'],
  format: ['esm'],
  target: 'node20',
  outDir: 'dist',
  clean: true,
  sourcemap: true,
  // @mahjong/shared is shipped as TypeScript source, so bundle it into the server.
  noExternal: ['@mahjong/shared'],
});

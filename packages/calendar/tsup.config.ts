import { defineConfig } from 'tsup';

export default defineConfig([
  {
    entry: {
      index: 'src/index.ts',
      'theme/index': 'src/theme/index.ts',
      'compat/index': 'src/compat/index.ts',
    },
    format: ['esm', 'cjs'],
    dts: true,
    sourcemap: true,
    clean: true,
    external: ['react', 'react-dom', 'zustand', 'date-fns', 'rrule', 'sonner'],
    treeshake: true,
    splitting: true,
    minify: false,
  },
]);

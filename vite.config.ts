import type { Plugin } from 'vite';
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';

// Tahtadaki eski/bilinmeyen tarayıcılar için: inline module script'i klasik
// script'e çevirip body sonuna taşır (file:// üzerinde de sorunsuz çalışır).
function classicScript(): Plugin {
  return {
    name: 'classic-inline-script',
    enforce: 'post',
    apply: 'build',
    // singlefile inlining'i generateBundle'da yapar; bu eklenti ondan sonra listelenmeli.
    generateBundle(_, bundle) {
      const page = bundle['index.html'];
      if (!page || page.type !== 'asset') return;
      const html = String(page.source);
      const open = '<script type="module" crossorigin>';
      const start = html.indexOf(open);
      if (start < 0) throw new Error('classic-inline-script: inline module script bulunamadı');
      const end = html.indexOf('</script>', start);
      const code = html.slice(start + open.length, end);
      const rest = html.slice(0, start) + html.slice(end + '</script>'.length);
      const bodyEnd = rest.lastIndexOf('</body>');
      page.source = rest.slice(0, bodyEnd) + `<script>${code}</script>\n` + rest.slice(bodyEnd);
    },
  };
}

export default defineConfig({
  plugins: [react(), viteSingleFile(), classicScript()],
  build: {
    target: 'es2017',
    assetsInlineLimit: 100_000_000,
    cssCodeSplit: false,
    rollupOptions: { output: { format: 'iife' } },
  },
  test: { environment: 'node' },
});

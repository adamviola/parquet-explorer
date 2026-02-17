require('esbuild').build({
  entryPoints: ['src/webview/webview.ts'],
  bundle: true,
  format: 'iife',
  platform: 'browser',
  outfile: 'out/webview.js',
  sourcemap: true,
  minify: true,
}).catch(() => process.exit(1));

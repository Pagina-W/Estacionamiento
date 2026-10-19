// Convierte el código de src/ (React) en js/app.js, que es lo que abre index.html
import { build } from 'esbuild'

await build({
  entryPoints: ['src/main.jsx'],
  bundle: true,
  minify: true,
  format: 'iife',
  target: 'es2019',
  jsx: 'transform',
  jsxFactory: 'React.createElement',
  jsxFragment: 'React.Fragment',
  inject: ['src/shims/inject.js'],
  loader: { '.js': 'jsx' },
  define: { 'process.env.NODE_ENV': '"production"' },
  alias: { 'react-router-dom': './src/shims/router.jsx', 'qrcode.react': './src/shims/qr.jsx' },
  outfile: 'js/app.js',
})
console.log('Listo: js/app.js actualizado')

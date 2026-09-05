import { defineConfig } from 'vite';

// A development preview of the existing static atlas. GitHub Pages still serves
// index.html directly; no production bundler or deployment migration is required.
export default defineConfig({
  server: { host:'0.0.0.0', allowedHosts:['terminal.local'] },
  optimizeDeps: { noDiscovery:true },
});

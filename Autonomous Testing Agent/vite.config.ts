import path from "path"
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Suppressed error codes — these happen when backend restarts or is momentarily down.
// They are noise, not real bugs. Never log them.
const IGNORED_PROXY_ERRORS = new Set([
  'ECONNABORTED', 'ECONNRESET', 'ECONNREFUSED',
  'EPIPE', 'ERR_STREAM_PREMATURE_CLOSE', 'ETIMEDOUT'
]);

function silenceSocketErrors(socket: any) {
  if (!socket || socket.__errSilenced) return;
  socket.__errSilenced = true;
  socket.on('error', (err: any) => {
    if (IGNORED_PROXY_ERRORS.has(err?.code)) return;
    console.error('[proxy socket error]', err.message);
  });
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 5173,
    strictPort: false,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        ws: true,
        configure: (proxy) => {
          // Wait for next tick so both our code and Vite's internal code have registered their default handlers.
          // Then we clear all 'error' listeners and register only our custom silent handler.
          setTimeout(() => {
            proxy.removeAllListeners('error');

            proxy.on('error', (err: any, _req, res) => {
              if (IGNORED_PROXY_ERRORS.has(err?.code)) {
                // Swallow silently — backend is restarting or WebSocket disconnected
                try {
                  if (res && typeof (res as any).writeHead === 'function') {
                    (res as any).writeHead(502);
                    (res as any).end();
                  }
                } catch (_) { /* ignore */ }
                return;
              }
              console.error('[proxy error]', err.message);
            });
          }, 0);

          // Silence WebSocket-level socket errors
          proxy.on('proxyReqWs', (_proxyReq, _req, socket, _opts, _head) => {
            silenceSocketErrors(socket);
          });

          // Also suppress on upgrade (raw WS handshake)
          proxy.on('open', (proxySocket: any) => {
            silenceSocketErrors(proxySocket);
          });
        },
      }
    }
  }
})
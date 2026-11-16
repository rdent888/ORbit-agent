import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { exec } from 'child_process';
import fs from 'fs';

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'native-local-bridge',
      configureServer(server) {
        // Real local terminal command execution (Turbo Mode native access)
        server.middlewares.use('/api/terminal/exec', (req, res) => {
          if (req.method !== 'POST') return res.end();
          let body = '';
          req.on('data', (chunk) => (body += chunk));
          req.on('end', () => {
            try {
              const { command, cwd } = JSON.parse(body);
              const workingDir = cwd || process.cwd();
              exec(
                command,
                { cwd: workingDir, shell: 'powershell.exe' },
                (error, stdout, stderr) => {
                  res.setHeader('Content-Type', 'application/json');
                  res.end(
                    JSON.stringify({
                      stdout: stdout || '',
                      stderr: stderr || (error ? error.message : ''),
                      exitCode: error ? error.code || 1 : 0,
                    })
                  );
                }
              );
            } catch (err: any) {
              res.statusCode = 500;
              res.end(JSON.stringify({ error: err.message }));
            }
          });
        });

        // Real local file system reader
        server.middlewares.use('/api/fs/list', (req, res) => {
          try {
            const currentDir = process.cwd();
            const entries = fs.readdirSync(currentDir, { withFileTypes: true });
            const files = entries
              .filter((e) => !e.name.startsWith('.') && e.name !== 'node_modules' && e.name !== 'dist')
              .map((e) => ({
                name: e.name,
                isDirectory: e.isDirectory(),
                path: path.join(currentDir, e.name),
              }));
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ cwd: currentDir, files }));
          } catch (err: any) {
            res.statusCode = 500;
            res.end(JSON.stringify({ error: err.message }));
          }
        });
      },
    },
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    open: false,
  },
});

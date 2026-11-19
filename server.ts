import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { serverConfig } from './server/config/env';
import { createApiRouter } from './server/routes/index';
import { globalErrorHandler } from './server/middleware/errorHandler';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function bootstrap(): Promise<void> {
  const app = express();

  app.use(express.json({ limit: serverConfig.jsonBodyLimit }));
  app.use('/api', createApiRouter());

  if (!serverConfig.isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.use(globalErrorHandler);

  app.listen(serverConfig.port, '0.0.0.0', () => {
    console.log(
      `PaisaFlow (${serverConfig.nodeEnv}) listening on http://0.0.0.0:${serverConfig.port}`
    );
  });
}

bootstrap().catch((err) => {
  console.error('Failed to start PaisaFlow server:', err);
  process.exit(1);
});

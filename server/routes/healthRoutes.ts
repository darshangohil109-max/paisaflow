import { Router } from 'express';
import { serverConfig } from '../config/env';

export const healthRouter = Router();

healthRouter.get('/', (_req, res) => {
  res.json({
    ok: true,
    apiVersion: serverConfig.apiVersion,
    environment: serverConfig.nodeEnv,
    aiConfigured: Boolean(serverConfig.geminiApiKey),
  });
});

import { Router } from 'express';
import { healthRouter } from './healthRoutes';
import { aiRouter } from './aiRoutes';
import { apiNotFoundHandler } from '../middleware/errorHandler';

function createApiSubRouter(): Router {
  const router = Router();
  router.use('/health', healthRouter);
  router.use('/ai', aiRouter);
  return router;
}

export function createApiRouter(): Router {
  const rootApiRouter = Router();
  const v1Router = createApiSubRouter();

  // Primary versioned API namespace (/api/v1/*)
  rootApiRouter.use('/v1', v1Router);
  // Backwards-compatible unversioned alias (/api/*)
  rootApiRouter.use('/', v1Router);

  rootApiRouter.use(apiNotFoundHandler);
  return rootApiRouter;
}

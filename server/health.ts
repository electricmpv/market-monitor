/**
 * Health check endpoint for Docker healthcheck
 */

import { Router } from 'express';
import { getDb } from './db';

const healthRouter = Router();

healthRouter.get('/api/health', async (req, res) => {
  try {
    // Check database connection
    const db = await getDb();
    const dbStatus = db ? 'connected' : 'disconnected';
    
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: '3.0.0',
      database: dbStatus,
      uptime: process.uptime(),
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export { healthRouter };

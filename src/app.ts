import express from 'express';
import { sequelize } from './config/database';
import { vkRouter } from './routes/vk.routes';
import { chatwootRouter } from './routes/chatwoot.routes';
import { logger } from './config/logger';
import cors from 'cors';
import helmet from 'helmet';

async function bootstrap() {
  await sequelize.sync();
  const app = express();

  app.use(cors());
  app.use(helmet());
  app.use(express.json());

  app.use('/api/v1/vk', vkRouter);
  app.use('/api/v1/chatwoot', chatwootRouter);

  app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date() });
  });

  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    logger.info(`Server started on port ${PORT}`);
  });
}

bootstrap().catch((error) => {
  logger.error('Failed to start server:', error);
  process.exit(1);
});
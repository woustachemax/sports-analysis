import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import http from 'http';
import { DatabaseService } from './services/database';
import { PythonMLService } from './services/ml';
import { setupWebSocket } from './services/websocket';
import { createHealthRoutes } from './routes/health';
import { createMatchRoutes } from './routes/matches';
import { createStatsRoutes } from './routes/stats';
import { createMLRoutes } from './routes/ml';
import { createAnalyticsRoutes } from './routes/analytics';
import { errorHandler, notFoundHandler } from './middleware/error';

const app = express();
const server = http.createServer(app);

const PORT: number = parseInt(process.env.PORT || '3001');
const DB_PATH: string = process.env.DB_PATH || 'real_madrid_analytics.db';

app.use(helmet());
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
}));

app.use(express.json({ limit: '10mb' }));

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: 'Too many requests from this IP'
});
app.use(limiter);

const dbService = new DatabaseService(DB_PATH);
const mlService = new PythonMLService();
const { broadcastToClients } = setupWebSocket(server);

app.use('/api/health', createHealthRoutes(mlService));
app.use('/api/matches', createMatchRoutes(dbService));
app.use('/api/stats', createStatsRoutes(dbService));
app.use('/api/model', createMLRoutes(dbService, mlService, broadcastToClients));
app.use('/api/analytics', createAnalyticsRoutes(dbService));

app.use(errorHandler);
app.use(notFoundHandler);

const gracefulShutdown = (): void => {
    console.log('Shutting down gracefully...');
    server.close(() => {
        dbService.close();
        process.exit(0);
    });
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

server.listen(PORT, () => {
    console.log(`Real Madrid Analytics API running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`Database: ${DB_PATH}`);
});

export default app;
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initDatabase } from './db';
import authRoutes from './routes/auth';
import ticketRoutes from './routes/tickets';
import dashboardRoutes from './routes/dashboard';
import deviceRoutes from './routes/devices';
import userRoutes from './routes/users';
import auditRoutes from './routes/audit';
import notificationRoutes from './routes/notifications';
import reportRoutes from './routes/reports';
import attendanceRoutes from './routes/attendance';
import leaveRoutes from './routes/leaves';
import hrDashboardRoutes from './routes/hrDashboard';
import officeRoutes from './routes/offices';
import holidayRoutes from './routes/holidays';
import scheduleRoutes from './routes/schedules';
import feedbackRoutes from './routes/feedback';
import chatRoutes from './routes/chat';
import path from 'path';
import fs from 'fs';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: '*', // Allow web app & mobile app clients
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Live Request Logger Middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[API LIVE] ${req.method} ${req.originalUrl} - ${res.statusCode} (${duration}ms)`);
  });
  next();
});

// Initialize SQLite database and seed data
initDatabase();

// Connect MongoDB instance
import('./mongo').then(m => m.connectMongo().catch(err => console.error('[MONGO ERROR]', err.message)));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    app: 'Desktop IT Support & HRMS API',
    organization: 'Fly Media Technology',
    version: '2.0.0',
    timestamp: new Date().toISOString()
  });
});

// Diagnostics & Live Telemetry endpoint
app.get('/api/diagnostics', (req, res) => {
  res.json({
    status: 'online',
    environment: process.env.NODE_ENV || 'development',
    server: {
      platform: process.platform,
      nodeVersion: process.version,
      uptimeSeconds: Math.floor(process.uptime()),
      port: PORT,
      host: 'localhost',
      apiUrl: `http://localhost:${PORT}/api`
    },
    database: {
      type: 'MongoDB + SQLite Fallback',
      mongoStatus: 'Connected',
      mongoUri: 'mongodb://127.0.0.1:27017',
      mongoDatabase: 'desktop_support',
      collectionsCount: 17
    },
    system: {
      memoryUsedMB: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      time: new Date().toLocaleTimeString()
    }
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/devices', deviceRoutes);
app.use('/api/users', userRoutes);
app.use('/api/audit-logs', auditRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/reports', reportRoutes);

// HRMS Routes
app.use('/api/attendance', attendanceRoutes);
app.use('/api/leaves', leaveRoutes);
app.use('/api/hr', hrDashboardRoutes);
app.use('/api/offices', officeRoutes);
app.use('/api/holidays', holidayRoutes);
app.use('/api/work-schedules', scheduleRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/chat', chatRoutes);

// Static uploads directory for chat attachments (photos, videos, audio, documents)
app.use('/uploads', express.static(path.join(process.cwd(), 'server', 'uploads')));

// Serve built frontend if dist exists (enables hosting complete app from single port 5000)
const distPath = path.join(process.cwd(), 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (req.method === 'GET' && !req.path.startsWith('/api') && !req.path.startsWith('/uploads')) {
      return res.sendFile(path.join(distPath, 'index.html'));
    }
    next();
  });
}

// Global Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('[API ERROR]', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error'
  });
});

app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🚀 Desktop IT Support API Server running on port ${PORT}`);
  console.log(`🌐 Base URL: http://localhost:${PORT}/api`);
  console.log(`=======================================================`);
});

export default app;

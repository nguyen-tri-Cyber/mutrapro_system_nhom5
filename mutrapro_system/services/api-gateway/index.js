const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Service URLs
const SERVICES = {
  auth: process.env.AUTH_SERVICE_URL || 'http://auth-service:3001',
  order: process.env.ORDER_SERVICE_URL || 'http://order-service:3002',
  task: process.env.TASK_SERVICE_URL || 'http://task-service:3003',
  file: process.env.FILE_SERVICE_URL || 'http://file-service:3004',
  studio: process.env.STUDIO_SERVICE_URL || 'http://studio-service:3005',
  notification: process.env.NOTIFICATION_SERVICE_URL || 'http://notification-service:3006'
};

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    service: 'API Gateway',
    timestamp: new Date().toISOString()
  });
});

// API Routes - Auth Service
app.use('/api/auth', createProxyMiddleware({
  target: SERVICES.auth,
  changeOrigin: true,
  pathRewrite: {
    '^/api/auth': ''
  },
  onError: (err, req, res) => {
    console.error('Auth Service Error:', err.message);
    res.status(503).json({ error: 'Auth service is unavailable' });
  }
}));

// API Routes - Order Service
app.use('/api/orders', createProxyMiddleware({
  target: SERVICES.order,
  changeOrigin: true,
  pathRewrite: {
    '^/api/orders': '/orders'
  },
  onError: (err, req, res) => {
    console.error('Order Service Error:', err.message);
    res.status(503).json({ error: 'Order service is unavailable' });
  }
}));

// API Routes - Task Service
app.use('/api/tasks', createProxyMiddleware({
  target: SERVICES.task,
  changeOrigin: true,
  pathRewrite: {
    '^/api/tasks': '/tasks'
  },
  onError: (err, req, res) => {
    console.error('Task Service Error:', err.message);
    res.status(503).json({ error: 'Task service is unavailable' });
  }
}));

// API Routes - File Service
app.use('/api/files', createProxyMiddleware({
  target: SERVICES.file,
  changeOrigin: true,
  pathRewrite: {
    '^/api/files': ''
  },
  onError: (err, req, res) => {
    console.error('File Service Error:', err.message);
    res.status(503).json({ error: 'File service is unavailable' });
  }
}));

// API Routes - Studio Service
app.use('/api/studios', createProxyMiddleware({
  target: SERVICES.studio,
  changeOrigin: true,
  pathRewrite: {
    '^/api/studios': ''
  },
  onError: (err, req, res) => {
    console.error('Studio Service Error:', err.message);
    res.status(503).json({ error: 'Studio service is unavailable' });
  }
}));

// Start server
app.listen(PORT, () => {
  console.log(`  API Gateway is running on port ${PORT}`);
  console.log(`  Proxying requests to:`);
  console.log(`   - Auth Service: ${SERVICES.auth}`);
  console.log(`   - Order Service: ${SERVICES.order}`);
  console.log(`   - Task Service: ${SERVICES.task}`);
  console.log(`   - File Service: ${SERVICES.file}`);
  console.log(`   - Studio Service: ${SERVICES.studio}`);
  console.log(`   - Notification Service: ${SERVICES.notification}`);
});

// Export for testing
module.exports = app;



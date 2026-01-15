import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app: Express = express();

// CORS Middleware - must be before routes
app.use((req, res, next) => {
  const origin = req.headers.origin;
  const allowedOrigins = [process.env.CLIENT_URL || 'http://localhost:5173'];

  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }

  next();
});

// Serve static files for uploads
app.use('/uploads', express.static('uploads'));

// Raw body parser for webhooks (must be before json parser)
app.use('/api/webhooks/facebook', express.raw({ type: 'application/json' }));
app.use('/api/chatwoot/webhooks/chatwoot', express.raw({ type: 'application/json' }));

// Increase body parser limit to handle large base64 images (10MB)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({ success: true, message: 'Server is running' });
});

// Public Routes (Privacy Policy, Terms of Service)
import publicRoutes from './routes/public.routes.js';
app.use('/', publicRoutes);

// API Routes
import authRoutes from './routes/auth.routes.js';
import socialRoutes from './routes/social.routes.js';
import integrationRoutes from './routes/integration.routes.js';
import utilsRoutes from './routes/utils.routes.js';
import chatwootRoutes from './routes/chatwoot.routes.js';
import companyRoutes from './routes/company.routes.js';
import employeeRoutes from './routes/employee.routes.js';
import taskRoutes from './routes/task.routes.js';
import financeRoutes from './routes/finance.routes.js';
import leadRoutes from './routes/lead.routes.js';
import meetingRoutes from './routes/meeting.routes.js';
import callRoutes from './routes/call.routes.js';
import leadCategoryRoutes from './routes/leadCategory.routes.js';
import leadInterestRoutes from './routes/leadInterest.routes.js';
import userRoutes from './routes/user.routes.js';
import systemSettingRoutes from './routes/systemSetting.routes.js';
import themeRoutes from './routes/theme.routes.js';
import roleRoutes from './routes/role.routes.js';
import campaignRoutes from './routes/campaign.routes.js';
import employeeGroupRoutes from './routes/employeeGroup.routes.js';
import productRoutes from './routes/product.routes.js';
import productCategoryRoutes from './routes/productCategory.routes.js';
import projectRoutes from './routes/project.routes.js';
import serviceRoutes from './routes/service.routes.js';
import adminRoutes from './routes/admin.routes.js';
import reviewRoutes from './routes/review.routes.js';
import blogRoutes from './routes/blog.routes.js';
import paymentGatewayRoutes from './routes/paymentGateway.routes.js';
import paymentRoutes from './routes/payment.routes.js';
app.use('/api/auth', authRoutes);
app.use('/api', socialRoutes);
app.use('/api/integrations', integrationRoutes);
app.use('/api/utils', utilsRoutes);
app.use('/api/chatwoot', chatwootRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/employee-groups', employeeGroupRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/finance', financeRoutes);
app.use('/api/meetings', meetingRoutes);
app.use('/api/calls', callRoutes);
app.use('/api/leads', leadRoutes);
app.use('/api/lead-categories', leadCategoryRoutes);
app.use('/api/lead-interests', leadInterestRoutes);
app.use('/api/users', userRoutes);
app.use('/api/system-settings', systemSettingRoutes);
app.use('/api/theme', themeRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/campaigns', campaignRoutes);
app.use('/api/products', productRoutes);
app.use('/api/product-categories', productCategoryRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/blog', blogRoutes);
app.use('/api/payment-gateways', paymentGatewayRoutes);
app.use('/api/payments', paymentRoutes);
// app.use('/api/users', userRoutes);

// Global error handling middleware
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Global error handler:', {
    message: err.message,
    code: err.code,
    statusCode: err.statusCode,
    status: err.status,
    name: err.name,
  });

  // Use statusCode from error if available, otherwise default to 500
  const statusCode = err.statusCode || err.status || 500;

  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal server error',
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

export default app;


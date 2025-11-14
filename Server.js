const express = require('express');
const cors = require('cors');
require('dotenv').config();
const connectdb = require('./Config/DB');
const UserRouter = require('./Routers/UserRouter');
const AdminRouter = require('./Routers/AdminRouter');
const ProductRouter = require('./Routers/ProductRouter');
const { seedInitialProducts } = require('./Controllers/ProductController');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const Helmet = require('helmet');
const rateLimit = require('express-rate-limit');
connectdb();

// Seed initial products (runs only if no products exist yet)
seedInitialProducts().catch((err) => console.error('Product seeding error:', err.message));

const app = express();

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'PRODUCTION' ? 100 : 1000,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false
});
app.use('/api/', limiter);
app.use(Helmet());
app.use(session({
  name: 'sessionId',
  secret: process.env.SESSION_SECRET || 'fallback-secret-change-in-PRODUCTION',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URL,
    collectionName: 'sessions',
    ttl: 7 * 24 * 60 * 60 // 7 days
  }),
  cookie: {
    secure: process.env.NODE_ENV === 'PRODUCTION',
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    sameSite: process.env.NODE_ENV === 'PRODUCTION' ? 'none' : 'lax'
  }
}));
app.use(express.json({ limit: '30mb' }));
app.use(express.urlencoded({ extended: true, limit: '30mb' }));



// CORS (handle preflight too)
const corsOptions = {
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  // Allow custom header sent by frontend axios client
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Website-Name'],
  origin: ['https://my-level.vercel.app','http://localhost:5173'], // reflect request origin
  credentials: true,
};
app.use(cors(corsOptions));
// Manual preflight handler (Express 5-compatible)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Vary', 'Origin');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, X-Website-Name');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});


// Routes
app.use('/api/auth', UserRouter);
app.use('/api/admin', AdminRouter);
app.use('/api/products', ProductRouter);

app.get('/', (request, response) => {
  response.send("Hello Level we are here");
});

const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`Server running on http://localhost:${port}`));

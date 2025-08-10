import cors from 'cors';
import 'dotenv/config';
import express from 'express';
import routes from './routes/routes.js';

const app = express();
const port = process.env.PORT ?? 3000;

app.use(cors());

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.ip} ${req.method} ${req.originalUrl}`);
  next();
});

// Allow the app to work under "/api" prefix when deployed on Vercel
app.use((req, _res, next) => {
  if (req.url === '/api') {
    req.url = '/';
  } else if (req.url.startsWith('/api/')) {
    req.url = req.url.replace(/^\/api/, '');
  }
  next();
});

app.use(routes);

// Only listen when running locally (not on Vercel)
if (!process.env.VERCEL) {
  app.listen(port, () => {
    console.log(`App is listening on port ${port}, http://localhost:${port}`);
  });
}

// Export for Vercel Serverless Function
export default app;

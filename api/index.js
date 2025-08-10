import axios from 'axios';
import cors from 'cors';
import 'dotenv/config';
import express from 'express';
import routes from './routes/routes.js';
import { getCurrentBase } from './src/lib/mirrorClient.js';

// Set axios defaults for all scrapers
axios.defaults.timeout = 15000;
axios.defaults.headers.common['User-Agent'] = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
axios.defaults.headers.common['Accept'] = 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8';
axios.defaults.headers.common['Accept-Language'] = 'en-US,en;q=0.8,id-ID,id;q=0.7';

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

app.get('/v1/upstream', (_req, res) => {
  try {
    res.json({ status: 'Ok', base: getCurrentBase() });
  } catch (e) {
    res.status(500).json({ status: 'Error', message: 'Cannot get current base' });
  }
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

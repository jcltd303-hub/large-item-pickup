import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  // API Health Check
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'Denver Large Item Pickup Service',
      time: new Date().toISOString(),
    });
  });

  // Proxy geocoding endpoint for Denver addresses
  app.get('/api/geocode', async (req, res) => {
    const query = req.query.q as string;
    if (!query) {
      return res.status(400).json({ error: 'Missing query parameter q' });
    }

    try {
      const q = query.toLowerCase().includes('denver')
        ? query
        : `${query}, Denver, CO`;
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
        q
      )}&format=json&limit=5&addressdetails=1`;

      const response = await fetch(url, {
        headers: {
          'User-Agent': 'DenverLargeItemPickupApp/1.0',
        },
      });

      if (!response.ok) {
        return res.status(response.status).json({ error: 'Geocoding failed' });
      }

      const data = await response.json();
      res.json(data);
    } catch (err: unknown) {
      res.status(500).json({
        error: 'Geocoding request failed',
        message: err instanceof Error ? err.message : String(err),
      });
    }
  });

  // Proxy Carto tile endpoint with server-side CARTO_API_KEY injection
  app.get('/api/carto-tile/:style/:z/:x/:y', async (req, res) => {
    const { style, z, x, y } = req.params;
    const apiKey = process.env.CARTO_API_KEY || process.env.VITE_CARTO_API_KEY || '';
    const stylePath = style === 'light' ? 'light_all' : 'dark_all';
    const subdomains = ['a', 'b', 'c', 'd'];
    const s = subdomains[Math.abs(parseInt(x, 10) + parseInt(y, 10)) % subdomains.length];
    
    const keyParam = apiKey ? `?api_key=${encodeURIComponent(apiKey)}` : '';
    const tileUrl = `https://${s}.basemaps.cartocdn.com/${stylePath}/${z}/${x}/${y}.png${keyParam}`;

    try {
      const tileRes = await fetch(tileUrl, {
        headers: {
          'User-Agent': 'DenverLargeItemPickupApp/1.0',
        },
      });

      if (!tileRes.ok) {
        // Fallback: proxy OpenStreetMap standard tile if Carto requires a key and none is provided
        const osmUrl = `https://tile.openstreetmap.org/${z}/${x}/${y}.png`;
        const osmRes = await fetch(osmUrl, {
          headers: {
            'User-Agent': 'DenverLargeItemPickupApp/1.0',
          },
        });
        if (osmRes.ok) {
          res.setHeader('Content-Type', 'image/png');
          res.setHeader('Cache-Control', 'public, max-age=86400');
          const buffer = await osmRes.arrayBuffer();
          return res.send(Buffer.from(buffer));
        }
        return res.status(tileRes.status).send('Tile fetch failed');
      }

      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Cache-Control', 'public, max-age=86400');
      const buffer = await tileRes.arrayBuffer();
      res.send(Buffer.from(buffer));
    } catch (err) {
      res.status(500).send('Tile proxy error');
    }
  });

  // Vite middleware for development vs static serve for production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Denver Large Item Pickup Server running on http://localhost:${PORT}`);
  });
}

startServer();

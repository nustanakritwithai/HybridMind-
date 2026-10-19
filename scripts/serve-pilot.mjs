import { createServer } from 'node:http';
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { extname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { projectPublicCatalog } from './public-projection.mjs';
import { validateContentBundle } from '../knowledge-textbook/content-renderer.mjs';

const root = resolve(fileURLToPath(new URL('../', import.meta.url)));
const offlinePath = resolve(root, 'offline/pilot-catalog-full.json');
const catalogPath = existsSync(offlinePath) ? offlinePath : resolve(root, 'data/pilot-catalog.json');
const clientCatalog = projectPublicCatalog(JSON.parse(await readFile(catalogPath, 'utf8')));
const clientCatalogBytes = Buffer.from(`${JSON.stringify(clientCatalog)}\n`, 'utf8');
const contentPath = [resolve(root, 'offline/pilot-content-bundle.json'), resolve(root, 'data/pilot-content-bundle.json')].find(existsSync);
const clientContentBundle = contentPath
  ? validateContentBundle(JSON.parse(await readFile(contentPath, 'utf8')), { catalog: clientCatalog })
  : null;
const clientContentBytes = clientContentBundle ? Buffer.from(`${JSON.stringify(clientContentBundle)}\n`, 'utf8') : null;
const port = Number(process.env.HM_PILOT_PORT || 8000);
const mimeTypes = new Map([
  ['.html', 'text/html; charset=utf-8'], ['.css', 'text/css; charset=utf-8'],
  ['.js', 'text/javascript; charset=utf-8'], ['.mjs', 'text/javascript; charset=utf-8'],
]);
const staticRoutes = new Map([
  ['/knowledge-textbook/', 'knowledge-textbook/index.html'],
  ['/knowledge-textbook/index.html', 'knowledge-textbook/index.html'],
  ['/knowledge-textbook/app.js', 'knowledge-textbook/app.js'],
  ['/knowledge-textbook/content-renderer.mjs', 'knowledge-textbook/content-renderer.mjs'],
  ['/knowledge-textbook/styles.css', 'knowledge-textbook/styles.css'],
  ['/search/local-search.mjs', 'search/local-search.mjs'],
  ['/search/safe-url.mjs', 'search/safe-url.mjs'],
]);

const server = createServer(async (req, res) => {
  if (!['GET', 'HEAD'].includes(req.method || '')) {
    res.writeHead(405, { Allow: 'GET, HEAD' }).end();
    return;
  }

  let pathname;
  try { pathname = decodeURIComponent(new URL(req.url || '/', 'http://127.0.0.1').pathname); }
  catch { res.writeHead(400).end('Bad request'); return; }

  try {
    let body, contentType;
    if (pathname === '/data/pilot-catalog.json') {
      body = clientCatalogBytes; contentType = 'application/json; charset=utf-8';
    } else if (pathname === '/data/pilot-content-bundle.json') {
      if (!clientContentBytes) { res.writeHead(404, { 'X-Content-Type-Options': 'nosniff' }).end('Not found'); return; }
      body = clientContentBytes; contentType = 'application/json; charset=utf-8';
    } else {
      const relative = staticRoutes.get(pathname);
      if (!relative) { res.writeHead(404, { 'X-Content-Type-Options': 'nosniff' }).end('Not found'); return; }
      body = await readFile(resolve(root, relative));
      contentType = mimeTypes.get(extname(relative).toLowerCase()) || 'application/octet-stream';
    }
    res.writeHead(200, {
      'Content-Type': contentType, 'Content-Length': body.length,
      'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff',
      'Content-Security-Policy': "default-src 'self'; img-src 'self' https://hybridmind.online; style-src 'self'; script-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'",
    });
    if (req.method === 'HEAD') res.end(); else res.end(body);
  } catch (error) {
    res.writeHead(error?.code === 'ENOENT' ? 404 : 500).end(error?.code === 'ENOENT' ? 'Not found' : 'Server error');
  }
});

server.listen(port, '127.0.0.1', () => {
  const actualPort = server.address()?.port ?? port;
  process.stdout.write(`Knowledge textbook pilot: http://127.0.0.1:${actualPort}/knowledge-textbook/\n`);
});

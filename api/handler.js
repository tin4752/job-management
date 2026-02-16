import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default function handler(req, res) {
  // API health check
  if (req.url === '/api/health') {
    return res.status(200).json({ status: 'ok', timestamp: new Date() });
  }

  // Serve dist files
  const distPath = path.join(__dirname, '../dist/index.html');
  
  if (fs.existsSync(distPath)) {
    const content = fs.readFileSync(distPath, 'utf8');
    res.setHeader('Content-Type', 'text/html');
    return res.status(200).send(content);
  }

  return res.status(404).json({ error: 'Not found' });
}

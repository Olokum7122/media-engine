const fs = require('fs');

const backup = '/opt/media-engine/src/index.js.bak';
const target = '/opt/media-engine/src/index.js';

let content = fs.readFileSync(backup, 'utf8');

const corsBlock = `// CORS — echo origin for Capacitor (capacitor:// scheme)
app.use((req, res, next) => {
  const origin = req.headers.origin || '*';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-App-Version,X-App-Env,X-Device-Platform');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

`;

// Insert after `const app = express();`
const marker = 'const app = express();';
const idx = content.indexOf(marker);
if (idx >= 0) {
  const insertPos = idx + marker.length;
  content = content.slice(0, insertPos) + '\n' + corsBlock + content.slice(insertPos);
  fs.writeFileSync(target, content);
  console.log('OK - CORS middleware added to Media Engine index.js');
} else {
  console.log('ERROR: marker not found');
  process.exit(1);
}
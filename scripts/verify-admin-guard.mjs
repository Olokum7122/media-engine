/**
 * Prueba del guard administrativo SIN arrancar el engine.
 *
 * Arrancar `src/index.js` levantaría el worker contra la cola de producción, que
 * este cambio no debe tocar. Aquí se monta únicamente el router en un servidor
 * efímero y se ejercita el guard. `/api/admin/services` no consulta la BD.
 */
import { createRequire } from 'node:module';
import http from 'node:http';

const require = createRequire(import.meta.url);
const express = require('express');

const TOKEN = process.env.__TEST_TOKEN;

function startServer() {
  const adminRoutes = require('../src/routes/adminRoutes.js');
  const app = express();
  app.use(adminRoutes);

  return new Promise((resolve) => {
    const server = http.createServer(app);
    server.listen(0, '127.0.0.1', () => resolve(server));
  });
}

function request(port, path, headers = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request({ host: '127.0.0.1', port, path, method: 'GET', headers }, (res) => {
      let body = '';
      res.on('data', (c) => { body += c; });
      res.on('end', () => resolve({ status: res.statusCode, body }));
    });
    req.on('error', reject);
    req.end();
  });
}

const server = await startServer();
const { port } = server.address();
const out = [];

const cases = [
  ['sin cabecera', {}],
  ['token incorrecto', { 'x-admin-token': 'no-es-el-token' }],
  ['token vacío explícito', { 'x-admin-token': '' }],
];

if (TOKEN) {
  cases.push(['token correcto', { 'x-admin-token': TOKEN }]);
}

for (const [label, headers] of cases) {
  const res = await request(port, '/api/admin/services', headers);
  out.push({ caso: label, status: res.status, body: res.body.slice(0, 120) });
}

// El contrato de cola bajo guard, sin token: debe cortar ANTES de tocar la BD.
const queueNoToken = await request(port, '/api/admin/queue', {});
out.push({ caso: 'queue sin token', status: queueNoToken.status, body: queueNoToken.body.slice(0, 120) });

console.log(JSON.stringify(out, null, 2));
server.close();

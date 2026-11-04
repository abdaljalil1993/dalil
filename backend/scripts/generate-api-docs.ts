/** Generates docs/API.md and api.http from the live route registry: npm run docs */
import 'reflect-metadata';
import fs from 'fs';
import path from 'path';
import '../src/routes';
import { routeDocs } from '../src/docs/registry';

const ACCESS: Record<string, string> = { public: '🌐 Public', optional: '🌐 Public (+token)', user: '🔐 User', owner: '🏪 Owner/Admin', admin: '🛡️ Admin' };
const tags = Array.from(new Set(routeDocs.map((r) => r.tag)));

let md = `# Dalilak API Reference (v2)\n\n> Auto-generated from the backend route registry (\`npm run docs\`). Interactive docs: \`/api/v1/docs\` (Swagger) · OpenAPI JSON: \`/api/v1/docs.json\`\n\n`;
md += `**Base URL:** \`{HOST}/api/v1\`\n\n**Auth:** \`Authorization: Bearer <accessToken>\` · access token 15 min · refresh with \`POST /auth/refresh\` (rotation: always store the NEW refreshToken).\n\n`;
md += `**Response envelope:**\n\n\`\`\`json\n{ "success": true, "message": "…", "data": {}, "meta": { "total": 120, "page": 1, "limit": 20, "totalPages": 6, "hasNext": true } }\n\`\`\`\n\n`;
md += `**Errors:** \`{ "success": false, "message": "first error", "errors": [{ "field": "email", "message": "Invalid email address" }] }\` — 401 (token missing/expired → refresh), 403 (role), 404, 409 (duplicate), 422 (validation), 429 (rate limit).\n\n`;
md += `**Uploads:** \`multipart/form-data\`, field \`image\` (single) or \`images\` (multiple, max 10), jpg/png/webp ≤ 5MB.\n\n**Days:** \`dayOfWeek\` 0=Sunday … 6=Saturday, times \`HH:MM\` (24h, app timezone Asia/Damascus). Overnight hours (18:00→02:00) are supported.\n\n`;
md += `## Endpoints overview\n\n| Method | Path | Access | Description |\n|---|---|---|---|\n`;
for (const r of routeDocs) md += `| \`${r.method.toUpperCase()}\` | \`${r.path}\` | ${ACCESS[r.access]} | ${r.summary} |\n`;
md += `\n## Details\n`;
for (const tag of tags) {
  md += `\n### ${tag}\n`;
  for (const r of routeDocs.filter((x) => x.tag === tag)) {
    md += `\n#### \`${r.method.toUpperCase()} ${r.path}\`\n${r.summary} — ${ACCESS[r.access]}\n`;
    if (r.notes) md += `\n> ${r.notes}\n`;
    if (r.query) md += `\nQuery: ${Object.entries(r.query).map(([k, v]) => `\`${k}\`${v ? ` (${v})` : ''}`).join(', ')}\n`;
    if (r.body) md += `\n\`\`\`json\n${JSON.stringify(r.body, null, 2)}\n\`\`\`\n`;
    if (r.multipart) md += `\nmultipart: ${Object.entries(r.multipart).map(([k, v]) => `\`${k}\` — ${v}`).join(', ')}\n`;
  }
}

let http = `# Dalilak API - REST Client file (VS Code "REST Client" extension)\n@base = http://localhost:5003/api/v1\n@token = paste_access_token_here\n\n`;
for (const r of routeDocs) {
  const p = r.path.replace(/:([A-Za-z]+)/g, '{{$1}}');
  http += `### ${r.summary}\n${r.method.toUpperCase()} {{base}}${p}\n`;
  if (r.access !== 'public') http += `Authorization: Bearer {{token}}\n`;
  if (r.body) http += `Content-Type: application/json\n\n${JSON.stringify(r.body, null, 2)}\n`;
  http += `\n`;
}

fs.mkdirSync(path.join(__dirname, '../docs'), { recursive: true });
fs.writeFileSync(path.join(__dirname, '../docs/API.md'), md);
fs.writeFileSync(path.join(__dirname, '../api.http'), http);
console.log(`✔ docs/API.md + api.http (${routeDocs.length} endpoints)`);

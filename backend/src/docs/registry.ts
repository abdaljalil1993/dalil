import { RequestHandler, Router } from 'express';

export type Access = 'public' | 'optional' | 'user' | 'owner' | 'admin';
type Method = 'get' | 'post' | 'put' | 'patch' | 'delete';

export interface RouteDoc {
  method: Method;
  path: string; // full path under /api/v1, express style (:id)
  tag: string;
  summary: string;
  access: Access;
  query?: Record<string, string>;
  body?: Record<string, unknown>;
  multipart?: Record<string, string>;
  notes?: string;
}

export const routeDocs: RouteDoc[] = [];

/** Registers an express route AND its documentation in one place. */
export const createDocumentedRouter = (base: string, tag: string) => {
  const router = Router();
  const add =
    (method: Method) =>
    (path: string, doc: Omit<RouteDoc, 'method' | 'path' | 'tag'>, ...handlers: (RequestHandler | RequestHandler[])[]) => {
      routeDocs.push({ method, path: `${base}${path === '/' ? '' : path}` || '/', tag, ...doc });
      router[method](path, ...(handlers.flat() as RequestHandler[]));
    };
  return { router, get: add('get'), post: add('post'), put: add('put'), patch: add('patch'), delete: add('delete') };
};

const ACCESS_TEXT: Record<Access, string> = {
  public: 'Public',
  optional: 'Public (token optional - adds personal data)',
  user: 'Signed-in user',
  owner: 'Business owner of the record (or admin)',
  admin: 'Admin only',
};

/** Builds OpenAPI "paths" from the registry. */
export const buildOpenApiPaths = () => {
  const paths: Record<string, Record<string, unknown>> = {};
  for (const r of routeDocs) {
    const oaPath = r.path.replace(/:([A-Za-z]+)/g, '{$1}');
    const params = [
      ...Array.from(r.path.matchAll(/:([A-Za-z]+)/g)).map((m) => ({ in: 'path', name: m[1], required: true, schema: { type: 'string' } })),
      ...Object.entries(r.query || {}).map(([name, description]) => ({ in: 'query', name, required: false, description, schema: { type: 'string' } })),
    ];
    const op: Record<string, unknown> = {
      tags: [r.tag],
      summary: r.summary,
      description: `**Access:** ${ACCESS_TEXT[r.access]}${r.notes ? `\n\n${r.notes}` : ''}`,
      parameters: params,
      security: r.access === 'public' ? [] : r.access === 'optional' ? [{}, { BearerAuth: [] }] : [{ BearerAuth: [] }],
      responses: {
        200: { description: 'Success', content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } } } },
        ...(r.access !== 'public' && r.access !== 'optional' && { 401: { description: 'Unauthorized' } }),
        422: { description: 'Validation error', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
      },
    };
    if (r.body) op.requestBody = { required: true, content: { 'application/json': { schema: { type: 'object' }, example: r.body } } };
    if (r.multipart) {
      op.requestBody = {
        required: true,
        content: {
          'multipart/form-data': {
            schema: {
              type: 'object',
              properties: Object.fromEntries(Object.entries(r.multipart).map(([k, v]) => [k, v.includes('file') ? { type: 'string', format: 'binary', description: v } : { type: 'string', description: v }])),
            },
          },
        },
      };
    }
    paths[oaPath] = { ...(paths[oaPath] || {}), [r.method]: op };
  }
  return paths;
};

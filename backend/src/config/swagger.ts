import { env } from './env';
import { buildOpenApiPaths } from '../docs/registry';

/** OpenAPI 3 spec generated from the documented route registry (always in sync with real routes). */
export const buildSwaggerSpec = () => ({
  openapi: '3.0.3',
  info: {
    title: 'Dalilak API',
    version: '2.0.0',
    description:
      'Local business directory API (doctors, restaurants, hotels, lawyers, craftsmen...).\n\n' +
      'Every response: `{ success, message, data, meta? }` - lists include `meta: { total, page, limit, totalPages, hasNext }`.\n\n' +
      'Guests can browse (home, categories, business details, reviews). Search, reviews, favorites, reports and submissions need `Authorization: Bearer <accessToken>`.',
  },
  servers: [{ url: `${env.publicUrl}/api/v1` }],
  components: {
    securitySchemes: { BearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' } },
    schemas: {
      ApiResponse: { type: 'object', properties: { success: { type: 'boolean' }, message: { type: 'string' }, data: {}, meta: { type: 'object' } } },
      ErrorResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          message: { type: 'string' },
          errors: { type: 'array', items: { type: 'object', properties: { field: { type: 'string' }, message: { type: 'string' } } } },
        },
      },
    },
  },
  paths: buildOpenApiPaths(),
});

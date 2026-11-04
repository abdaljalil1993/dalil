import * as C from '../controllers/UserController';
import * as D from '../dtos/user.dto';
import { uuidParam, paginationQuery } from '../dtos/common';
import { validate } from '../middleware/validate';
import { authenticate } from '../middleware/authenticate';
import { isAdmin } from '../middleware/authorize';
import { uploadSingle } from '../middleware/upload';
import { uploadRateLimiter } from '../middleware/rateLimiter';
import { audit } from '../middleware/auditLogger';
import { createDocumentedRouter } from '../docs/registry';

const r = createDocumentedRouter('/users', 'Users');

r.get('/me', { summary: 'My profile + counters', access: 'user' }, authenticate, C.getProfile);
r.put('/me', { summary: 'Update my profile', access: 'user', body: { firstName: 'Fadi', lastName: 'Ali', phone: '+963...', bio: '...', cityId: 1 } }, authenticate, D.updateProfileDto, validate, C.updateProfile);
r.post('/me/avatar', { summary: 'Upload avatar', access: 'user', multipart: { image: 'Image file (jpg/png/webp, max 5MB)' } }, authenticate, uploadRateLimiter, uploadSingle, C.uploadAvatar);

r.get('/', { summary: 'List users', access: 'admin', query: { search: 'name/email/phone', role: 'user|business_owner|admin', status: 'active|inactive|suspended', page: '', limit: '' } }, authenticate, isAdmin, D.userListQuery, paginationQuery, validate, C.list);
r.get('/:id', { summary: 'User details', access: 'admin' }, authenticate, isAdmin, uuidParam(), validate, C.getById);
r.patch('/:id/status', { summary: 'Activate / suspend user', access: 'admin', body: { status: 'suspended' } }, authenticate, isAdmin, uuidParam(), D.updateStatusDto, validate, audit('user.status', 'user'), C.updateStatus);
r.patch('/:id/role', { summary: 'Change user role', access: 'admin', body: { role: 'business_owner' } }, authenticate, isAdmin, uuidParam(), D.updateRoleDto, validate, audit('user.role', 'user'), C.updateRole);

export default r.router;

import * as C from '../controllers/AuthController';
import * as D from '../dtos/auth.dto';
import { validate } from '../middleware/validate';
import { authenticate } from '../middleware/authenticate';
import { authRateLimiter } from '../middleware/rateLimiter';
import { createDocumentedRouter } from '../docs/registry';
import { requireFeature as RF, LISTING_FEATURE } from '../services/FeatureService';

const r = createDocumentedRouter('/auth', 'Auth');

r.post('/register', { summary: 'Create account (role = user)', access: 'public', body: { firstName: 'Fadi', lastName: 'Ali', email: 'fadi@example.com', password: 'Secret123', phone: '+963991234567', cityId: 1 } }, authRateLimiter, D.registerDto, validate, RF('register', 'body'), C.register);
r.post('/login', { summary: 'Sign in - returns accessToken, refreshToken, user', access: 'public', body: { email: 'fadi@example.com', password: 'Secret123' } }, authRateLimiter, D.loginDto, validate, C.login);
r.post('/refresh', { summary: 'Rotate tokens (old refresh token is revoked)', access: 'public', body: { refreshToken: '...' } }, D.refreshDto, validate, C.refresh);
r.post('/logout', { summary: 'Revoke a refresh token', access: 'public', body: { refreshToken: '...' } }, D.logoutDto, validate, C.logout);
r.post('/logout-all', { summary: 'Revoke all sessions of the current user', access: 'user' }, authenticate, C.logoutAll);
r.post('/change-password', { summary: 'Change password (revokes other sessions)', access: 'user', body: { currentPassword: 'Secret123', newPassword: 'NewSecret456' } }, authenticate, D.changePasswordDto, validate, C.changePassword);
r.post('/forgot-password', { summary: 'Send reset link by email', access: 'public', body: { email: 'fadi@example.com' }, notes: 'In development without SMTP the response contains `devResetToken`.' }, authRateLimiter, D.forgotPasswordDto, validate, C.forgotPassword);
r.post('/reset-password', { summary: 'Set a new password using the emailed token', access: 'public', body: { token: '...', newPassword: 'NewSecret456' } }, authRateLimiter, D.resetPasswordDto, validate, C.resetPassword);
r.get('/me', { summary: 'Current user', access: 'user' }, authenticate, C.me);

export default r.router;

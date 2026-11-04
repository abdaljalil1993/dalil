import { asyncHandler } from '../utils/asyncHandler';
import { sendCreated, sendSuccess } from '../utils/response';
import { body } from '../middleware/validate';
import { AuthService, RegisterInput } from '../services/AuthService';
import { clientIp, userAgent } from '../utils/request';

const auth = new AuthService();

export const register = asyncHandler(async (req, res) => {
  const result = await auth.register(body<RegisterInput>(req), { ip: clientIp(req), userAgent: userAgent(req) });
  sendCreated(res, result, 'Registration successful');
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = body<{ email: string; password: string }>(req);
  sendSuccess(res, await auth.login(email, password, { ip: clientIp(req), userAgent: userAgent(req) }), 'Login successful');
});

export const refresh = asyncHandler(async (req, res) => {
  sendSuccess(res, await auth.refresh(body<{ refreshToken: string }>(req).refreshToken, { ip: clientIp(req), userAgent: userAgent(req) }), 'Token refreshed');
});

export const logout = asyncHandler(async (req, res) => {
  await auth.logout(body<{ refreshToken?: string }>(req).refreshToken);
  sendSuccess(res, null, 'Logged out');
});

export const logoutAll = asyncHandler(async (req, res) => {
  await auth.logoutAll(req.userId!);
  sendSuccess(res, null, 'Logged out from all devices');
});

export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = body<{ currentPassword: string; newPassword: string }>(req);
  await auth.changePassword(req.userId!, currentPassword, newPassword);
  sendSuccess(res, null, 'Password changed. Please sign in again on other devices.');
});

export const forgotPassword = asyncHandler(async (req, res) => {
  const result = await auth.forgotPassword(body<{ email: string }>(req).email);
  sendSuccess(res, result, 'If this email is registered, a reset link has been sent');
});

export const resetPassword = asyncHandler(async (req, res) => {
  const { token, newPassword } = body<{ token: string; newPassword: string }>(req);
  await auth.resetPassword(token, newPassword);
  sendSuccess(res, null, 'Password has been reset. You can now sign in.');
});

export const me = asyncHandler(async (req, res) => {
  sendSuccess(res, await auth.me(req.userId!));
});

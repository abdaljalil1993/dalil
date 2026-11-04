import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/response';
import { body, queryData } from '../middleware/validate';
import { parsePagination } from '../utils/pagination';
import { UserService, ProfileInput } from '../services/UserService';
import { UserRole, UserStatus } from '../entities/enums';
import { AppError } from '../utils/AppError';

const users = new UserService();

export const getProfile = asyncHandler(async (req, res) => sendSuccess(res, await users.getProfile(req.userId!)));

export const updateProfile = asyncHandler(async (req, res) =>
  sendSuccess(res, await users.updateProfile(req.userId!, body<ProfileInput>(req)), 'Profile updated'));

export const uploadAvatar = asyncHandler(async (req, res) => {
  if (!req.file) throw AppError.badRequest('No image uploaded (use form field "image")');
  sendSuccess(res, await users.updateAvatar(req.userId!, req.file), 'Avatar updated');
});

export const list = asyncHandler(async (req, res) => {
  const { page, limit } = parsePagination(req);
  const result = await users.list(page, limit, queryData(req));
  sendSuccess(res, result.items, 'Users', 200, result.meta);
});

export const getById = asyncHandler(async (req, res) => sendSuccess(res, await users.getById(req.params.id)));

export const updateStatus = asyncHandler(async (req, res) =>
  sendSuccess(res, await users.updateStatus(req.userId!, req.params.id, body<{ status: UserStatus }>(req).status), 'Status updated'));

export const updateRole = asyncHandler(async (req, res) =>
  sendSuccess(res, await users.updateRole(req.userId!, req.params.id, body<{ role: UserRole }>(req).role), 'Role updated'));

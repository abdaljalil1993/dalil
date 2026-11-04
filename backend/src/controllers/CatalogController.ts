import { asyncHandler } from '../utils/asyncHandler';
import { sendCreated, sendSuccess } from '../utils/response';
import { body } from '../middleware/validate';
import { CategoryService, CategoryInput, SubCategoryInput } from '../services/CategoryService';
import { CityService, CityInput } from '../services/CityService';
import { HomeService } from '../services/HomeService';
import { StorageService } from '../services/StorageService';
import { UserRole } from '../entities/enums';
import { AppError } from '../utils/AppError';
import { toInt } from '../utils/pagination';

const categories = new CategoryService();
const cities = new CityService();
const home = new HomeService();

export const homeFeed = asyncHandler(async (req, res) => sendSuccess(res, await home.get(toInt(req.query.cityId))));

// Categories
export const listCategories = asyncHandler(async (req, res) => {
  const includeInactive = req.query.includeInactive === 'true' && req.user?.role === UserRole.ADMIN;
  sendSuccess(res, await categories.list(includeInactive));
});
export const getCategory = asyncHandler(async (req, res) => sendSuccess(res, await categories.getBySlugOrId(req.params.slug)));
export const createCategory = asyncHandler(async (req, res) => sendCreated(res, await categories.create(body<CategoryInput>(req)), 'Category created'));
export const updateCategory = asyncHandler(async (req, res) => sendSuccess(res, await categories.update(Number(req.params.id), body<CategoryInput>(req)), 'Category updated'));
export const deleteCategory = asyncHandler(async (req, res) => {
  await categories.remove(Number(req.params.id));
  sendSuccess(res, null, 'Category deleted');
});
export const uploadCategoryImage = asyncHandler(async (req, res) => {
  if (!req.file) throw AppError.badRequest('No image uploaded (use form field "image")');
  const stored = await StorageService.upload(req.file, 'categories');
  sendSuccess(res, await categories.setImage(Number(req.params.id), stored.url), 'Image updated');
});
export const createSubCategory = asyncHandler(async (req, res) => sendCreated(res, await categories.createSub(body<SubCategoryInput>(req)), 'Sub-category created'));
export const updateSubCategory = asyncHandler(async (req, res) => sendSuccess(res, await categories.updateSub(Number(req.params.id), body<SubCategoryInput>(req)), 'Sub-category updated'));
export const deleteSubCategory = asyncHandler(async (req, res) => {
  await categories.removeSub(Number(req.params.id));
  sendSuccess(res, null, 'Sub-category deleted');
});

// Cities
export const listCities = asyncHandler(async (req, res) => {
  const includeInactive = req.query.includeInactive === 'true' && req.user?.role === UserRole.ADMIN;
  sendSuccess(res, await cities.list(includeInactive));
});
export const getCity = asyncHandler(async (req, res) => sendSuccess(res, await cities.getBySlugOrId(req.params.id)));
export const createCity = asyncHandler(async (req, res) => sendCreated(res, await cities.create(body<CityInput>(req)), 'City created'));
export const updateCity = asyncHandler(async (req, res) => sendSuccess(res, await cities.update(Number(req.params.id), body<CityInput>(req)), 'City updated'));
export const deleteCity = asyncHandler(async (req, res) => {
  await cities.remove(Number(req.params.id));
  sendSuccess(res, null, 'City deleted');
});

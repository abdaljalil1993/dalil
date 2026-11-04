import * as C from '../controllers/CatalogController';
import * as D from '../dtos/catalog.dto';
import { intParam } from '../dtos/common';
import { validate } from '../middleware/validate';
import { authenticate, optionalAuth } from '../middleware/authenticate';
import { isAdmin } from '../middleware/authorize';
import { uploadSingle } from '../middleware/upload';
import { audit } from '../middleware/auditLogger';
import { createDocumentedRouter } from '../docs/registry';

const home = createDocumentedRouter('/home', 'Home');
home.get('/', { summary: 'Home feed: categories, cities, ads, featured, top rated, newest, stats', access: 'public', query: { cityId: 'Optional - personalize by city' } }, C.homeFeed);

const cat = createDocumentedRouter('/categories', 'Categories');
cat.get('/', { summary: 'All categories with sub-categories and business counts', access: 'optional', query: { includeInactive: 'admin only: true' } }, optionalAuth, C.listCategories);
cat.get('/:slug', { summary: 'Category by slug or id', access: 'public' }, C.getCategory);
cat.post('/', { summary: 'Create category', access: 'admin', body: { name: 'أطباء', nameEn: 'Doctors', icon: 'LocalHospital', color: '#EF4444', keywords: 'طبيب,دكتور,عيادة', sortOrder: 1 } }, authenticate, isAdmin, D.createCategoryDto, validate, audit('category.create', 'category'), C.createCategory);
cat.put('/:id', { summary: 'Update category', access: 'admin' }, authenticate, isAdmin, intParam(), D.updateCategoryDto, validate, audit('category.update', 'category'), C.updateCategory);
cat.delete('/:id', { summary: 'Delete category (only if empty)', access: 'admin' }, authenticate, isAdmin, intParam(), validate, audit('category.delete', 'category'), C.deleteCategory);
cat.post('/:id/image', { summary: 'Upload category image', access: 'admin', multipart: { image: 'Image file' } }, authenticate, isAdmin, intParam(), validate, uploadSingle, C.uploadCategoryImage);
cat.post('/sub', { summary: 'Create sub-category', access: 'admin', body: { categoryId: 1, name: 'طب العيون', nameEn: 'Ophthalmology', keywords: 'عيون,طبيب عيون,نظارات' } }, authenticate, isAdmin, D.createSubCategoryDto, validate, audit('subcategory.create', 'subcategory'), C.createSubCategory);
cat.put('/sub/:id', { summary: 'Update sub-category', access: 'admin' }, authenticate, isAdmin, intParam(), D.updateSubCategoryDto, validate, audit('subcategory.update', 'subcategory'), C.updateSubCategory);
cat.delete('/sub/:id', { summary: 'Delete sub-category', access: 'admin' }, authenticate, isAdmin, intParam(), validate, audit('subcategory.delete', 'subcategory'), C.deleteSubCategory);

const city = createDocumentedRouter('/cities', 'Cities');
city.get('/', { summary: 'All cities with business counts', access: 'optional', query: { includeInactive: 'admin only: true' } }, optionalAuth, C.listCities);
city.get('/:id', { summary: 'City by id or slug', access: 'public' }, C.getCity);
city.post('/', { summary: 'Create city', access: 'admin', body: { name: 'اللاذقية', nameEn: 'Latakia', state: 'اللاذقية', country: 'سوريا', latitude: 35.5317, longitude: 35.7915 } }, authenticate, isAdmin, D.createCityDto, validate, audit('city.create', 'city'), C.createCity);
city.put('/:id', { summary: 'Update city', access: 'admin' }, authenticate, isAdmin, intParam(), D.updateCityDto, validate, audit('city.update', 'city'), C.updateCity);
city.delete('/:id', { summary: 'Delete city (only if empty)', access: 'admin' }, authenticate, isAdmin, intParam(), validate, audit('city.delete', 'city'), C.deleteCity);

export const homeRouter = home.router;
export const categoryRouter = cat.router;
export const cityRouter = city.router;

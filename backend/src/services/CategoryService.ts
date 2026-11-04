import { repos } from '../repositories';
import { Category, SubCategory } from '../entities';
import { BusinessStatus } from '../entities/enums';
import { AppError } from '../utils/AppError';
import { slugify } from '../utils/text';
import { CacheService } from './CacheService';
import { SearchIndexService } from './SearchIndexService';

export type CategoryInput = Partial<Pick<Category, 'name' | 'nameEn' | 'description' | 'icon' | 'color' | 'image' | 'keywords' | 'isActive' | 'sortOrder'>>;
export type SubCategoryInput = Partial<Pick<SubCategory, 'name' | 'nameEn' | 'description' | 'icon' | 'keywords' | 'isActive' | 'sortOrder' | 'categoryId'>>;

export class CategoryService {
  /** Categories with sub-categories and the number of approved businesses (cached). */
  async list(includeInactive = false) {
    return CacheService.remember(`categories:list:${includeInactive}`, 600, async () => {
      const qb = repos.categories()
        .createQueryBuilder('c')
        .leftJoinAndSelect('c.subCategories', 's', includeInactive ? undefined : 's.isActive = true')
        .orderBy('c.sortOrder', 'ASC')
        .addOrderBy('c.name', 'ASC')
        .addOrderBy('s.sortOrder', 'ASC');
      if (!includeInactive) qb.where('c.isActive = true');
      const categories = await qb.getMany();

      const counts = await repos.businesses()
        .createQueryBuilder('b')
        .select('b.categoryId', 'categoryId')
        .addSelect('b.subCategoryId', 'subCategoryId')
        .addSelect('COUNT(*)', 'cnt')
        .where('b.status = :st AND b.isActive = true', { st: BusinessStatus.APPROVED })
        .groupBy('b.categoryId')
        .addGroupBy('b.subCategoryId')
        .getRawMany<{ categoryId: number; subCategoryId: number | null; cnt: string }>();

      return categories.map((c) => {
        const rows = counts.filter((r) => Number(r.categoryId) === c.id);
        return {
          ...c,
          businessCount: rows.reduce((s, r) => s + Number(r.cnt), 0),
          subCategories: (c.subCategories || []).map((s) => ({
            ...s,
            businessCount: rows.filter((r) => Number(r.subCategoryId) === s.id).reduce((t, r) => t + Number(r.cnt), 0),
          })),
        };
      });
    });
  }

  async getBySlugOrId(key: string) {
    const where = /^\d+$/.test(key) ? { id: Number(key) } : { slug: key };
    const category = await repos.categories().findOne({ where, relations: ['subCategories'] });
    if (!category) throw AppError.notFound('Category not found');
    category.subCategories = (category.subCategories || []).filter((s) => s.isActive).sort((a, b) => a.sortOrder - b.sortOrder);
    return category;
  }

  async create(data: CategoryInput) {
    const slug = await this.uniqueSlug(data.name!);
    const saved = await repos.categories().save(repos.categories().create({ ...data, slug }));
    await CacheService.invalidateCatalog();
    return saved;
  }

  async update(id: number, data: CategoryInput) {
    const category = await repos.categories().findOne({ where: { id } });
    if (!category) throw AppError.notFound('Category not found');
    if (data.name && data.name !== category.name) category.slug = await this.uniqueSlug(data.name, id);
    Object.assign(category, data);
    const saved = await repos.categories().save(category);
    if (data.name !== undefined || data.keywords !== undefined || data.nameEn !== undefined) {
      await SearchIndexService.reindexWhere({ categoryId: id });
    }
    await CacheService.invalidateCatalog();
    return saved;
  }

  async remove(id: number) {
    const inUse = await repos.businesses().count({ where: { categoryId: id } });
    if (inUse > 0) throw AppError.conflict(`Category has ${inUse} businesses. Move them or deactivate the category instead.`);
    const res = await repos.categories().delete(id);
    if (!res.affected) throw AppError.notFound('Category not found');
    await CacheService.invalidateCatalog();
  }

  async setImage(id: number, url: string) {
    await repos.categories().update(id, { image: url });
    await CacheService.invalidateCatalog();
    return repos.categories().findOne({ where: { id } });
  }

  async createSub(data: SubCategoryInput) {
    const parent = await repos.categories().findOne({ where: { id: data.categoryId } });
    if (!parent) throw AppError.notFound('Parent category not found');
    const saved = await repos.subCategories().save(repos.subCategories().create({ ...data, slug: slugify(data.name!) }));
    await CacheService.invalidateCatalog();
    return saved;
  }

  async updateSub(id: number, data: SubCategoryInput) {
    const sub = await repos.subCategories().findOne({ where: { id } });
    if (!sub) throw AppError.notFound('Sub-category not found');
    if (data.name && data.name !== sub.name) sub.slug = slugify(data.name);
    Object.assign(sub, data);
    const saved = await repos.subCategories().save(sub);
    await SearchIndexService.reindexWhere({ subCategoryId: id });
    await CacheService.invalidateCatalog();
    return saved;
  }

  async removeSub(id: number) {
    const res = await repos.subCategories().delete(id);
    if (!res.affected) throw AppError.notFound('Sub-category not found');
    await CacheService.invalidateCatalog();
  }

  private async uniqueSlug(name: string, ignoreId?: number): Promise<string> {
    const base = slugify(name);
    let slug = base;
    for (let i = 1; ; i++) {
      const found = await repos.categories().findOne({ where: { slug } });
      if (!found || found.id === ignoreId) return slug;
      slug = `${base}-${i}`;
    }
  }
}

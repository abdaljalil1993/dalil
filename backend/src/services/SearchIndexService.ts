import { FindOptionsWhere, In } from 'typeorm';
import { repos } from '../repositories';
import { Business } from '../entities';
import { normalizeText } from '../utils/text';

/**
 * Builds `businesses.searchText`: a normalized blob of name, description, tags, district,
 * category/sub-category names + their keywords, city name and attribute values.
 * Searching this single column with LIKE works on MySQL and MariaDB, supports Arabic,
 * and lets admins add synonyms (e.g. "طبيب,دكتور,عيادة") on categories.
 */
export class SearchIndexService {
  static async buildText(b: Business): Promise<string> {
    const [category, sub, city] = await Promise.all([
      b.categoryId ? repos.categories().findOne({ where: { id: b.categoryId } }) : null,
      b.subCategoryId ? repos.subCategories().findOne({ where: { id: b.subCategoryId } }) : null,
      b.cityId ? repos.cities().findOne({ where: { id: b.cityId } }) : null,
    ]);
    const attrValues = Object.values(b.attributes || {}).flat().map(String);
    return normalizeText(
      [
        b.name, b.nameEn, b.shortDescription, b.description, b.tags, b.district, b.address,
        category?.name, category?.nameEn, category?.keywords,
        sub?.name, sub?.nameEn, sub?.keywords,
        city?.name, city?.nameEn,
        ...(b.amenities || []),
        ...attrValues,
      ]
        .filter(Boolean)
        .join(' ')
    ).slice(0, 60000);
  }

  static async reindex(businessId: string): Promise<void> {
    const b = await repos.businesses().findOne({ where: { id: businessId } });
    if (!b) return;
    await repos.businesses().update(b.id, { searchText: await this.buildText(b) });
  }

  static async reindexWhere(where: FindOptionsWhere<Business>): Promise<void> {
    const list = await repos.businesses().find({ where, select: ['id'] });
    for (const { id } of list) await this.reindex(id);
  }

  static async reindexAll(): Promise<number> {
    const list = await repos.businesses().find({ select: ['id'] });
    for (const { id } of list) await this.reindex(id);
    return list.length;
  }

  static async reindexMany(ids: string[]): Promise<void> {
    if (!ids.length) return;
    const list = await repos.businesses().find({ where: { id: In(ids) }, select: ['id'] });
    for (const { id } of list) await this.reindex(id);
  }
}

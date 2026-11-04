/**
 * Seeds base data (idempotent - safe to run many times):
 *   npm run seed            → cities, categories/sub-categories, admin account
 *   npm run seed -- --demo  → + demo users, businesses, hours, reviews, featured, ads
 *
 * Admin credentials come from ADMIN_EMAIL / ADMIN_PASSWORD (.env), defaults below.
 */
import 'reflect-metadata';
import bcrypt from 'bcryptjs';
import { IsNull } from 'typeorm';
import '../config/env';
import { AppDataSource } from '../config/database';
import { repos } from '../repositories';
import { CATEGORIES, CITIES, EMERGENCY, PLANS } from './data';
import { repos2 } from '../repositories';
import { ListingPurpose, ListingStatus, ListingType, EmergencyType } from '../entities/enums';
import { normalizeText, slugify } from '../utils/text';
import { AdPlacement, AdStatus, BusinessSource, BusinessStatus, PromotionStatus, UserRole } from '../entities/enums';
import { SearchIndexService } from '../services/SearchIndexService';
import { PromotionService } from '../services/PromotionService';

const DEMO = process.argv.includes('--demo');

const seedCities = async () => {
  for (const [i, c] of CITIES.entries()) {
    const exists = await repos.cities().findOne({ where: { name: c.name } });
    if (!exists) await repos.cities().save(repos.cities().create({ ...c, country: 'سوريا', slug: slugify(c.nameEn), sortOrder: i }));
  }
  console.log(`✔ cities: ${await repos.cities().count()}`);
};

const seedCategories = async () => {
  for (const [i, c] of CATEGORIES.entries()) {
    let cat = await repos.categories().findOne({ where: { name: c.name } });
    if (!cat) {
      cat = await repos.categories().save(
        repos.categories().create({ name: c.name, nameEn: c.nameEn, icon: c.icon, color: c.color, keywords: c.keywords, slug: slugify(c.nameEn), sortOrder: i })
      );
    }
    for (const [j, s] of c.subs.entries()) {
      const exists = await repos.subCategories().findOne({ where: { categoryId: cat.id, name: s.name } });
      if (!exists) {
        await repos.subCategories().save(repos.subCategories().create({ ...s, categoryId: cat.id, slug: slugify(s.nameEn), sortOrder: j }));
      }
    }
  }
  console.log(`✔ categories: ${await repos.categories().count()}, sub-categories: ${await repos.subCategories().count()}`);
};

const upsertUser = async (email: string, password: string, data: { firstName: string; lastName: string; role: UserRole; phone?: string }) => {
  const existing = await repos.users().findOne({ where: { email } });
  if (existing) return existing;
  return repos.users().save(repos.users().create({ ...data, email, password: await bcrypt.hash(password, 12), isEmailVerified: true }));
};

const seedPlansAndSettings = async () => {
  for (const p of PLANS) {
    if (!(await repos2.plans().exist({ where: { code: p.code } }))) await repos2.plans().save(repos2.plans().create(p));
  }
  if (!(await repos2.settings().exist({ where: { key: 'billingEnabled' } }))) await repos2.settings().save({ key: 'billingEnabled', value: false });
  for (const [i, e] of EMERGENCY.entries()) {
    if (!(await repos2.emergency().exist({ where: { phone: e.phone, cityId: IsNull() } }))) await repos2.emergency().save(repos2.emergency().create({ ...e, type: e.type as EmergencyType, cityId: null, sortOrder: i }));
  }
  console.log(`✔ plans: ${await repos2.plans().count()} (billing disabled — everything free), emergency numbers: ${await repos2.emergency().count()}`);
};

const seedAdmin = async () => {
  const email = (process.env.ADMIN_EMAIL || 'admin@dalilak.app').toLowerCase();
  const password = process.env.ADMIN_PASSWORD || 'Admin@12345';
  await upsertUser(email, password, { firstName: 'Dalilak', lastName: 'Admin', role: UserRole.ADMIN });
  console.log(`✔ admin: ${email}  (password from ADMIN_PASSWORD or default "Admin@12345" - change it!)`);
};

const WEEK = (open: string, close: string, fridayClosed = true) =>
  Array.from({ length: 7 }, (_, d) => (d === 5 && fridayClosed ? { dayOfWeek: d, isClosed: true } : { dayOfWeek: d, openTime: open, closeTime: close }));

const seedDemo = async () => {
  const owner = await upsertUser('owner@dalilak.app', 'Owner@12345', { firstName: 'أحمد', lastName: 'الخطيب', role: UserRole.BUSINESS_OWNER, phone: '+963991111111' });
  const reviewers = await Promise.all(
    [
      ['sara@dalilak.app', 'سارة', 'حداد'],
      ['omar@dalilak.app', 'عمر', 'يوسف'],
      ['lina@dalilak.app', 'لينا', 'منصور'],
      ['user@dalilak.app', 'مستخدم', 'تجريبي'],
    ].map(([email, f, l]) => upsertUser(email, 'User@12345', { firstName: f, lastName: l, role: UserRole.USER }))
  );

  const city = async (nameEn: string) => (await repos.cities().findOne({ where: { nameEn } }))!;
  const sub = async (nameEn: string) => (await repos.subCategories().findOne({ where: { nameEn } }))!;
  const LAT = await city('Latakia');
  const DAM = await city('Damascus');

  const list: Array<Record<string, unknown> & { sub: string; city: typeof LAT; hours?: unknown[]; rating: number[]; owned?: boolean; featured?: number }> = [
    { name: 'عيادة د. أحمد الخطيب لطب العيون', nameEn: 'Dr. Ahmad Al-Khatib Eye Clinic', sub: 'Ophthalmology', city: LAT, district: 'الزراعة', address: 'شارع بغداد - بناء الأطباء - ط2', phone: '041 245 678', whatsapp: '+963991111111', shortDescription: 'استشاري طب وجراحة العيون والليزك', description: 'عيادة متخصصة بفحص النظر، جراحة الساد (الماء الأبيض)، الليزك وتصحيح النظر، ومتابعة أمراض الشبكية لدى مرضى السكري.', attributes: { specialty: 'جراحة الشبكية والليزك', experienceYears: 18, languages: ['العربية', 'English'] }, amenities: ['parking', 'appointments', 'card_payment'], tags: 'ليزك,نظارات,شبكية', hours: WEEK('10:00', '18:00'), rating: [5, 5, 4], owned: true, featured: 10, lat: 35.5329, lng: 35.7856, verified: true },
    { name: 'مركز ابتسامة لطب الأسنان', nameEn: 'Ibtisama Dental Center', sub: 'Dentistry', city: LAT, district: 'المشروع العاشر', address: 'المشروع العاشر - مقابل الحديقة', phone: '041 255 100', whatsapp: '+963992222222', shortDescription: 'تقويم وزراعة وتجميل أسنان', description: 'مركز متكامل لطب الأسنان: تقويم شفاف، زراعة فورية، تبييض بالليزر وطب أسنان الأطفال.', attributes: { specialty: 'تقويم وزراعة', doctors: 3 }, amenities: ['appointments', 'kids_friendly'], hours: WEEK('09:00', '20:00'), rating: [5, 4, 4], lat: 35.5401, lng: 35.7769, verified: true },
    { name: 'د. ريم سليمان - طب الأطفال', nameEn: 'Dr. Reem Suleiman Pediatrics', sub: 'Pediatrics', city: LAT, district: 'الشيخ ضاهر', address: 'الشيخ ضاهر - جانب صيدلية الشفاء', phone: '041 266 300', shortDescription: 'أخصائية أطفال وحديثي الولادة', attributes: { specialty: 'حديثي الولادة', experienceYears: 12 }, hours: WEEK('16:00', '21:00'), rating: [5, 5], lat: 35.5222, lng: 35.7901 },
    { name: 'مشفى الأسد الجامعي', nameEn: 'University Hospital', sub: 'Hospitals', city: LAT, district: 'المشفى الجامعي', address: 'طريق المشفى الجامعي', phone: '041 470 000', shortDescription: 'إسعاف وطوارئ على مدار الساعة', hours: Array.from({ length: 7 }, (_, d) => ({ dayOfWeek: d, isOpen24Hours: true })), rating: [4, 3, 4], lat: 35.5136, lng: 35.7797, verified: true },
    { name: 'صيدلية الشفاء', nameEn: 'Al-Shifa Pharmacy', sub: 'Pharmacies', city: LAT, district: 'الشيخ ضاهر', address: 'ساحة الشيخ ضاهر', phone: '041 233 444', hours: WEEK('08:00', '23:00', false), rating: [5, 4], lat: 35.5231, lng: 35.7912 },
    { name: 'مطعم البحر الأزرق', nameEn: 'Blue Sea Restaurant', sub: 'Seafood', city: LAT, district: 'الكورنيش الجنوبي', address: 'الكورنيش الجنوبي', phone: '041 211 777', whatsapp: '+963993333333', shortDescription: 'أطيب مأكولات بحرية مع إطلالة على البحر', description: 'سمك طازج يومياً، قريدس، كاليماري وأطباق شرقية مع جلسات خارجية على البحر.', priceRange: 3, amenities: ['sea_view', 'outdoor_seating', 'family', 'parking'], hours: WEEK('12:00', '01:00', false), rating: [5, 5, 4, 5], featured: 8, lat: 35.5121, lng: 35.7716, verified: true },
    { name: 'شاورما أبو عبدو', nameEn: 'Abu Abdo Shawarma', sub: 'Shawarma & Falafel', city: LAT, district: 'الأمريكان', address: 'شارع الأمريكان', phone: '041 222 999', priceRange: 1, amenities: ['delivery', 'takeaway'], hours: WEEK('11:00', '02:00', false), rating: [5, 4, 5], lat: 35.5262, lng: 35.7889 },
    { name: 'مشاوي الضيعة', nameEn: 'Al-Dayaa Grills', sub: 'Grills', city: LAT, district: 'سقوبين', address: 'طريق سقوبين', phone: '041 288 111', priceRange: 2, amenities: ['family', 'outdoor_seating', 'parking'], hours: WEEK('13:00', '00:00', false), rating: [4, 4], lat: 35.5602, lng: 35.8104 },
    { name: 'كافيه ريترو', nameEn: 'Retro Cafe', sub: 'Coffee Shops', city: LAT, district: 'الزراعة', address: 'دوار الزراعة', phone: '041 299 555', priceRange: 2, amenities: ['wifi', 'outdoor_seating'], hours: WEEK('08:00', '00:00', false), rating: [4, 5], lat: 35.5341, lng: 35.7843 },
    { name: 'فندق لاميرا', nameEn: 'Lamira Hotel', sub: 'Hotels', city: LAT, district: 'الكورنيش', address: 'الكورنيش الغربي', phone: '041 450 450', website: 'https://example.com', priceRange: 4, amenities: ['wifi', 'parking', 'pool', 'restaurant', 'sea_view'], attributes: { stars: 4, rooms: 60 }, hours: Array.from({ length: 7 }, (_, d) => ({ dayOfWeek: d, isOpen24Hours: true })), rating: [5, 4, 4], featured: 6, lat: 35.5184, lng: 35.7685 },
    { name: 'شاليهات الشاطئ الأزرق', nameEn: 'Blue Beach Chalets', sub: 'Chalets', city: LAT, district: 'الشاطئ الأزرق', address: 'منطقة الشاطئ الأزرق', phone: '041 420 420', priceRange: 3, amenities: ['pool', 'sea_view', 'parking'], rating: [4], lat: 35.5895, lng: 35.7465 },
    { name: 'مكتب المحامي سامر عيسى', nameEn: 'Samer Issa Law Office', sub: 'Family Law', city: LAT, district: 'شارع 8 آذار', address: 'شارع 8 آذار - بناء المحامين', phone: '041 277 888', whatsapp: '+963994444444', shortDescription: 'أحوال شخصية وقضايا مدنية', attributes: { barNumber: '1234', experienceYears: 20 }, hours: WEEK('09:00', '15:00'), rating: [5, 4], lat: 35.5289, lng: 35.7934 },
    { name: 'المحامية هبة ديب', nameEn: 'Hiba Deeb Attorney', sub: 'Corporate Law', city: DAM, district: 'المزة', address: 'المزة - أوتوستراد', phone: '011 611 2233', shortDescription: 'تأسيس شركات وعقود تجارية', hours: WEEK('10:00', '16:00'), rating: [5], lat: 33.5001, lng: 36.2479 },
    { name: 'مدينة ألعاب فانتازيا', nameEn: 'Fantasia Fun Park', sub: 'Amusement Parks', city: LAT, district: 'الكورنيش الجنوبي', phone: '041 230 230', priceRange: 2, amenities: ['kids_friendly', 'parking', 'family'], hours: WEEK('15:00', '23:00', false), rating: [4, 4, 5], lat: 35.5099, lng: 35.7759 },
    { name: 'نادي الأبطال الرياضي', nameEn: 'Champions Gym', sub: 'Gyms & Clubs', city: LAT, district: 'المشروع السابع', phone: '0933 555 666', amenities: ['parking', 'showers'], hours: WEEK('07:00', '23:00', false), rating: [5, 4], lat: 35.5455, lng: 35.7956 },
    { name: 'أبو علي للتمديدات الكهربائية', nameEn: 'Abu Ali Electrician', sub: 'Electrician', city: LAT, district: 'الرمل الشمالي', phone: '0944 123 123', whatsapp: '+963944123123', shortDescription: 'تمديدات وصيانة كهرباء منازل - خدمة سريعة', attributes: { serviceArea: 'كل أحياء اللاذقية', emergency: true }, hours: WEEK('08:00', '20:00'), rating: [5, 5, 4], lat: 35.5512, lng: 35.7823 },
    { name: 'تبريد وتكييف الساحل', nameEn: 'Coast AC Services', sub: 'AC & Refrigeration', city: LAT, district: 'الصليبة', phone: '0955 321 321', whatsapp: '+963955321321', attributes: { brands: ['LG', 'Samsung', 'Gree'] }, hours: WEEK('09:00', '19:00'), rating: [4, 4], lat: 35.5195, lng: 35.7877 },
    { name: 'طاقة شمسية - الشمس الذهبية', nameEn: 'Golden Sun Solar', sub: 'Solar Energy', city: LAT, district: 'الزراعة', phone: '0966 777 888', shortDescription: 'تركيب ألواح وانفرترات وبطاريات ليثيوم', hours: WEEK('09:00', '18:00'), rating: [5], lat: 35.5367, lng: 35.7861 },
    { name: 'نقليات الأمانة لنقل العفش', nameEn: 'Al-Amana Movers', sub: 'Furniture Moving', city: LAT, district: 'الدعتور', phone: '0988 456 456', whatsapp: '+963988456456', shortDescription: 'نقل عفش مع فك وتركيب وتغليف', attributes: { trucks: 4, workers: 10 }, hours: WEEK('07:00', '19:00', false), rating: [5, 4, 4], lat: 35.5278, lng: 35.8011 },
    { name: 'سوبرماركت الريّان', nameEn: 'Al-Rayyan Supermarket', sub: 'Supermarkets', city: LAT, district: 'المشروع العاشر', phone: '041 260 260', amenities: ['delivery', 'card_payment', 'parking'], hours: WEEK('08:00', '00:00', false), rating: [4, 4], lat: 35.5413, lng: 35.7752 },
    { name: 'فرن الأمل', nameEn: 'Al-Amal Bakery', sub: 'Bakeries', city: LAT, district: 'قنينص', phone: '041 213 213', hours: WEEK('05:00', '14:00', false), rating: [4], lat: 35.5247, lng: 35.7958 },
    { name: 'صالون ستايل للحلاقة', nameEn: 'Style Barber', sub: 'Barbers', city: LAT, district: 'الزراعة', phone: '0999 888 777', hours: WEEK('10:00', '22:00'), rating: [5, 5], lat: 35.5338, lng: 35.7874 },
    { name: 'مطعم نارنج', nameEn: 'Naranj Restaurant', sub: 'Oriental', city: DAM, district: 'باب شرقي', address: 'دمشق القديمة - باب شرقي', phone: '011 541 3443', priceRange: 3, amenities: ['family', 'outdoor_seating'], hours: WEEK('12:00', '00:00', false), rating: [5, 5, 4], featured: 7, lat: 33.5106, lng: 36.3157, verified: true },
    { name: 'مخبر الحياة للتحاليل الطبية', nameEn: 'Al-Hayat Laboratory', sub: 'Laboratories', city: DAM, district: 'الشعلان', phone: '011 333 4455', hours: WEEK('07:30', '20:00'), rating: [4, 5], lat: 33.5168, lng: 36.2928 },
  ];

  let created = 0;
  for (const item of list) {
    const subCat = await sub(item.sub);
    const slug = slugify(String(item.nameEn));
    let b = await repos.businesses().findOne({ where: { slug } });
    if (!b) {
      const { sub: _s, city: c, hours, rating, owned, featured, lat, lng, verified, ...data } = item as Record<string, unknown> & { city: typeof LAT };
      b = await repos.businesses().save(
        repos.businesses().create({
          ...(data as object),
          slug,
          categoryId: subCat.categoryId,
          subCategoryId: subCat.id,
          cityId: c.id,
          latitude: lat as number,
          longitude: lng as number,
          isVerified: Boolean(verified),
          status: BusinessStatus.APPROVED,
          source: owned ? BusinessSource.OWNER : BusinessSource.ADMIN,
          ownerId: owned ? owner.id : null,
          approvedAt: new Date(),
          viewCount: Math.floor(Math.random() * 900) + 50,
        })
      );
      if (hours) await repos.hours().save((hours as object[]).map((h) => repos.hours().create({ ...(h as object), businessId: b!.id })));
      const texts = ['خدمة ممتازة وتعامل راقٍ، أنصح به بشدة', 'تجربة جيدة جداً والأسعار مناسبة', 'مكان نظيف ومرتب، سأعود مجدداً', 'سرعة في الخدمة واحترافية عالية'];
      for (const [i, r] of (item.rating as number[]).entries()) {
        await repos.reviews().save(repos.reviews().create({ businessId: b.id, userId: reviewers[i % reviewers.length].id, rating: r, content: texts[i % texts.length] }));
      }
      const raw = await repos.reviews().createQueryBuilder('r').select('AVG(r.rating)', 'avg').addSelect('COUNT(*)', 'cnt').where('r.businessId = :id', { id: b.id }).getRawOne();
      await repos.businesses().update(b.id, { averageRating: Number(Number(raw.avg).toFixed(2)), reviewCount: Number(raw.cnt) });
      if (item.featured) {
        await repos.featured().save(repos.featured().create({ businessId: b.id, startDate: new Date(Date.now() - 864e5), endDate: new Date(Date.now() + 60 * 864e5), priority: item.featured, status: PromotionStatus.ACTIVE }));
      }
      created++;
    }
  }

  if ((await repos.ads().count()) === 0) {
    const sea = await repos.businesses().findOne({ where: { slug: 'blue-sea-restaurant' } });
    const now = Date.now();
    await repos.ads().save([
      repos.ads().create({ title: 'عروض الصيف على المأكولات البحرية', description: 'خصم 20% على جميع الأطباق حتى نهاية الشهر', placement: AdPlacement.HOME_SLIDER, status: AdStatus.ACTIVE, startDate: new Date(now - 864e5), endDate: new Date(now + 30 * 864e5), priority: 10, businessId: sea?.id || null }),
      repos.ads().create({ title: 'أضف نشاطك التجاري مجاناً', description: 'وصل لآلاف العملاء في مدينتك عبر دليلك', placement: AdPlacement.HOME_SLIDER, status: AdStatus.ACTIVE, startDate: new Date(now - 864e5), endDate: new Date(now + 365 * 864e5), priority: 5, targetUrl: '/businesses/create' }),
      repos.ads().create({ title: 'باقات التمييز - اظهر أولاً في نتائج البحث', placement: AdPlacement.HOMEPAGE_BANNER, status: AdStatus.ACTIVE, startDate: new Date(now - 864e5), endDate: new Date(now + 365 * 864e5), priority: 1, targetUrl: '/owner/promote' }),
    ]);
  }

  // ── v2.1 demo: menu, offers, duty, bookings, listings, service request ──
  const bySlug = (slug: string) => repos.businesses().findOne({ where: { slug } });
  const sea = await bySlug('blue-sea-restaurant');
  if (sea && !(await repos2.items().exist({ where: { businessId: sea.id } }))) {
    await repos2.items().save([
      { section: 'مقبلات', name: 'حمص بالطحينة', price: '15000', isPopular: true },
      { section: 'مقبلات', name: 'متبل', price: '15000' },
      { section: 'مأكولات بحرية', name: 'سمك لقز مشوي', price: '120000', unit: 'للكيلو', isPopular: true },
      { section: 'مأكولات بحرية', name: 'قريدس بالثوم', price: '95000' },
      { section: 'مشروبات', name: 'ليمون بالنعنع', price: '12000' },
    ].map((x, i) => repos2.items().create({ ...x, businessId: sea.id, sortOrder: i })));
    await repos2.offers().save(repos2.offers().create({ businessId: sea.id, title: 'خصم 20% على الأطباق البحرية', description: 'كل يوم من الأحد للخميس', discountPercent: 20, startDate: new Date(Date.now() - 864e5), endDate: new Date(Date.now() + 20 * 864e5), couponCode: 'DALIL20' }));
  }
  const clinic = await bySlug('dr-ahmad-al-khatib-eye-clinic');
  if (clinic) await repos.businesses().update(clinic.id, { bookingEnabled: true, bookingMode: 'slot', slotMinutes: 20, slotCapacity: 1, bookingDaysAhead: 21 });
  const electrician = await bySlug('abu-ali-electrician');
  if (electrician) await repos.businesses().update(electrician.id, { acceptsQuotes: true });
  const solarBiz = await bySlug('golden-sun-solar');
  if (solarBiz) await repos.businesses().update(solarBiz.id, { acceptsQuotes: true });
  const pharmacy = await bySlug('al-shifa-pharmacy');
  if (pharmacy) {
    const d = (n: number) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Damascus' }).format(new Date(Date.now() + n * 864e5));
    for (const n of [0, 3, 7]) if (!(await repos2.duties().exist({ where: { businessId: pharmacy.id, date: d(n) } }))) await repos2.duties().save(repos2.duties().create({ businessId: pharmacy.id, date: d(n), startTime: '20:00', endTime: '08:00' }));
  }
  if ((await repos2.listings().count()) === 0) {
    const u = reviewers[0];
    const mk = (type: ListingType, purpose: ListingPurpose, title: string, price: number | null, attributes: Record<string, unknown>, extra: Record<string, unknown> = {}) =>
      repos2.listings().create({ type, purpose, title, price, attributes: attributes as never, cityId: LAT.id, district: 'الزراعة', userId: u.id, status: ListingStatus.ACTIVE, slug: slugify(`${title}-${Math.random().toString(36).slice(2, 6)}`), contactPhone: '0944000000', expiresAt: new Date(Date.now() + 60 * 864e5), searchText: normalizeText(title), ...extra });
    const rows = [
      mk(ListingType.REAL_ESTATE, ListingPurpose.RENT, 'شقة 3 غرف مفروشة بإطلالة بحرية', 2500000, { propertyType: 'apartment', rooms: 3, bathrooms: 2, area: 140, floor: 4, furnished: true, ownership: 'green_deed', hasSolar: true }, { pricePeriod: 'monthly', description: 'شقة نظيفة جداً، طاقة شمسية، قريبة من الكورنيش' }),
      mk(ListingType.REAL_ESTATE, ListingPurpose.SALE, 'محل تجاري على الشارع العام', 450000000, { propertyType: 'shop', area: 60, ownership: 'green_deed' }),
      mk(ListingType.CAR, ListingPurpose.SALE, 'كيا ريو 2015 فل أوبشن', 95000000, { make: 'Kia', model: 'Rio', year: 2015, mileageKm: 120000, fuel: 'petrol', transmission: 'automatic', condition: 'used', bodyType: 'sedan', customsCleared: true }),
      mk(ListingType.JOB, ListingPurpose.HIRE, 'مطلوب محاسب بدوام كامل', 3000000, { jobType: 'full_time', field: 'محاسبة', experienceYears: 2, education: 'bachelor', gender: 'any', companyName: 'شركة الساحل' }, { pricePeriod: 'monthly' }),
      mk(ListingType.JOB, ListingPurpose.HIRE, 'مطلوب شيف مشاوي', 2500000, { jobType: 'full_time', field: 'مطاعم', experienceYears: 3 }, { pricePeriod: 'monthly', businessId: sea?.id || null }),
    ];
    for (const r of rows) await repos2.listings().save(r);
  }
  if ((await repos2.requests().count()) === 0) {
    const solar = await repos.subCategories().findOne({ where: { nameEn: 'Solar Energy' } });
    if (solar) await repos2.requests().save(repos2.requests().create({ userId: reviewers[1].id, categoryId: solar.categoryId, subCategoryId: solar.id, cityId: LAT.id, district: 'الرمل الشمالي', title: 'تركيب منظومة طاقة شمسية لبيت', description: 'بدي 6 ألواح وانفرتر 3 كيلو وبطارية ليثيوم', budget: '20000000', expiresAt: new Date(Date.now() + 14 * 864e5) }));
  }

  await SearchIndexService.reindexAll();
  await PromotionService.syncFeaturedFlags();
  console.log(`✔ demo: ${created} new businesses (owner@dalilak.app / Owner@12345, user@dalilak.app / User@12345)`);
};

(async () => {
  AppDataSource.setOptions({ synchronize: false }); // run `npm run db:sync` first
  await AppDataSource.initialize();
  await seedCities();
  await seedCategories();
  await seedAdmin();
  await seedPlansAndSettings();
  if (DEMO) await seedDemo();
  await SearchIndexService.reindexAll();
  await AppDataSource.destroy();
  console.log('Done.');
})().catch((e) => {
  console.error(e);
  process.exit(1);
});

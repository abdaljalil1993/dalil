export interface SeedSub { name: string; nameEn: string; keywords?: string }
export interface SeedCategory { name: string; nameEn: string; icon: string; color: string; keywords: string; subs: SeedSub[] }

export const CITIES = [
  { name: 'دمشق', nameEn: 'Damascus', state: 'دمشق', latitude: 33.5138, longitude: 36.2765 },
  { name: 'ريف دمشق', nameEn: 'Rif Dimashq', state: 'ريف دمشق', latitude: 33.5167, longitude: 36.45 },
  { name: 'حلب', nameEn: 'Aleppo', state: 'حلب', latitude: 36.2021, longitude: 37.1343 },
  { name: 'حمص', nameEn: 'Homs', state: 'حمص', latitude: 34.7324, longitude: 36.7137 },
  { name: 'حماة', nameEn: 'Hama', state: 'حماة', latitude: 35.1318, longitude: 36.7578 },
  { name: 'اللاذقية', nameEn: 'Latakia', state: 'اللاذقية', latitude: 35.5317, longitude: 35.7915 },
  { name: 'جبلة', nameEn: 'Jableh', state: 'اللاذقية', latitude: 35.3614, longitude: 35.9256 },
  { name: 'طرطوس', nameEn: 'Tartus', state: 'طرطوس', latitude: 34.889, longitude: 35.8866 },
  { name: 'بانياس', nameEn: 'Baniyas', state: 'طرطوس', latitude: 35.1823, longitude: 35.9486 },
  { name: 'إدلب', nameEn: 'Idlib', state: 'إدلب', latitude: 35.9306, longitude: 36.6339 },
  { name: 'دير الزور', nameEn: 'Deir ez-Zor', state: 'دير الزور', latitude: 35.3359, longitude: 40.1408 },
  { name: 'الرقة', nameEn: 'Raqqa', state: 'الرقة', latitude: 35.9594, longitude: 39.0078 },
  { name: 'الحسكة', nameEn: 'Al-Hasakah', state: 'الحسكة', latitude: 36.5024, longitude: 40.7477 },
  { name: 'القامشلي', nameEn: 'Qamishli', state: 'الحسكة', latitude: 37.0522, longitude: 41.2311 },
  { name: 'درعا', nameEn: 'Daraa', state: 'درعا', latitude: 32.6189, longitude: 36.1021 },
  { name: 'السويداء', nameEn: 'As-Suwayda', state: 'السويداء', latitude: 32.7089, longitude: 36.5695 },
  { name: 'القنيطرة', nameEn: 'Quneitra', state: 'القنيطرة', latitude: 33.1258, longitude: 35.8244 },
];

export const CATEGORIES: SeedCategory[] = [
  {
    name: 'أطباء', nameEn: 'Doctors', icon: 'MedicalServices', color: '#EF4444', keywords: 'طبيب,دكتور,عيادة,طب,اخصائي,استشاري',
    subs: [
      { name: 'طب العيون', nameEn: 'Ophthalmology', keywords: 'عيون,طبيب عيون,نظر,نظارات,ليزك' },
      { name: 'طب الأسنان', nameEn: 'Dentistry', keywords: 'اسنان,طبيب اسنان,تقويم,زراعة اسنان' },
      { name: 'طب الأطفال', nameEn: 'Pediatrics', keywords: 'اطفال,طبيب اطفال,حديثي الولادة' },
      { name: 'نسائية وتوليد', nameEn: 'Gynecology', keywords: 'نسائية,توليد,حمل,عقم' },
      { name: 'قلبية', nameEn: 'Cardiology', keywords: 'قلب,قلبية,ضغط,ايكو' },
      { name: 'جلدية وتجميل', nameEn: 'Dermatology', keywords: 'جلدية,بشرة,تجميل,ليزر,شعر' },
      { name: 'عظمية', nameEn: 'Orthopedics', keywords: 'عظام,عظمية,كسور,مفاصل,ظهر' },
      { name: 'أنف أذن حنجرة', nameEn: 'ENT', keywords: 'انف,اذن,حنجرة,سمع' },
      { name: 'باطنية', nameEn: 'Internal Medicine', keywords: 'باطنية,هضمية,سكري,غدد' },
      { name: 'عصبية ونفسية', nameEn: 'Neurology & Psychiatry', keywords: 'عصبية,دماغ,نفسية,اعصاب' },
      { name: 'طب عام', nameEn: 'General Practice', keywords: 'طب عام,طبيب عام,عائلة' },
    ],
  },
  {
    name: 'مشافي ومراكز طبية', nameEn: 'Hospitals & Medical Centers', icon: 'LocalHospital', color: '#F43F5E', keywords: 'مشفى,مستشفى,اسعاف,طوارئ,مركز طبي',
    subs: [
      { name: 'مشافي', nameEn: 'Hospitals', keywords: 'مشفى,مستشفى,اسعاف,طوارئ' },
      { name: 'مخابر تحاليل', nameEn: 'Laboratories', keywords: 'مخبر,تحليل,تحاليل,دم' },
      { name: 'مراكز أشعة', nameEn: 'Radiology', keywords: 'اشعة,طبقي,رنين,ايكو' },
      { name: 'علاج فيزيائي', nameEn: 'Physiotherapy', keywords: 'فيزيائي,تأهيل,مساج علاجي' },
    ],
  },
  {
    name: 'صيدليات', nameEn: 'Pharmacies', icon: 'LocalPharmacy', color: '#10B981', keywords: 'صيدلية,دواء,ادوية,صيدلاني',
    subs: [
      { name: 'صيدليات', nameEn: 'Pharmacies', keywords: 'صيدلية' },
      { name: 'صيدليات مناوبة', nameEn: 'On-duty Pharmacies', keywords: 'مناوبة,ليلية,24 ساعة' },
    ],
  },
  {
    name: 'مطاعم', nameEn: 'Restaurants', icon: 'Restaurant', color: '#F97316', keywords: 'مطعم,اكل,طعام,وجبات,عشاء,غداء',
    subs: [
      { name: 'مأكولات شرقية', nameEn: 'Oriental', keywords: 'شرقي,مازة,فتة,فول,حمص' },
      { name: 'مشاوي', nameEn: 'Grills', keywords: 'مشاوي,كباب,شيش,لحمة' },
      { name: 'شاورما وفلافل', nameEn: 'Shawarma & Falafel', keywords: 'شاورما,فلافل,سندويش' },
      { name: 'وجبات سريعة', nameEn: 'Fast Food', keywords: 'برغر,كريسبي,وجبات سريعة' },
      { name: 'بيتزا ومعجنات', nameEn: 'Pizza & Pastry', keywords: 'بيتزا,معجنات,فطائر,مناقيش' },
      { name: 'مأكولات بحرية', nameEn: 'Seafood', keywords: 'سمك,بحري,سمكي,قريدس' },
      { name: 'حلويات', nameEn: 'Sweets', keywords: 'حلويات,كنافة,بوظة,جاتو' },
    ],
  },
  {
    name: 'مقاهي', nameEn: 'Cafes', icon: 'LocalCafe', color: '#B45309', keywords: 'مقهى,كافيه,قهوة,اركيلة',
    subs: [
      { name: 'كافيهات', nameEn: 'Coffee Shops', keywords: 'كافيه,قهوة,اسبريسو' },
      { name: 'مقاهي أركيلة', nameEn: 'Shisha Cafes', keywords: 'اركيلة,نرجيلة' },
      { name: 'عصائر', nameEn: 'Juice Bars', keywords: 'عصير,كوكتيل,فواكه' },
    ],
  },
  {
    name: 'فنادق وإقامة', nameEn: 'Hotels & Stays', icon: 'Hotel', color: '#6366F1', keywords: 'فندق,اقامة,حجز,غرف,نوم',
    subs: [
      { name: 'فنادق', nameEn: 'Hotels', keywords: 'فندق,اوتيل' },
      { name: 'شاليهات', nameEn: 'Chalets', keywords: 'شاليه,بحر,مسبح' },
      { name: 'شقق مفروشة', nameEn: 'Furnished Apartments', keywords: 'شقة مفروشة,ايجار يومي' },
      { name: 'منتجعات', nameEn: 'Resorts', keywords: 'منتجع,ريزورت' },
    ],
  },
  {
    name: 'محامون', nameEn: 'Lawyers', icon: 'Gavel', color: '#0EA5E9', keywords: 'محامي,محامية,محاماة,قانون,استشارة قانونية,دعوى',
    subs: [
      { name: 'قضايا جزائية', nameEn: 'Criminal Law', keywords: 'جزائي,جنائي' },
      { name: 'قضايا مدنية', nameEn: 'Civil Law', keywords: 'مدني,عقود' },
      { name: 'أحوال شخصية', nameEn: 'Family Law', keywords: 'طلاق,زواج,حضانة,ارث,شرعي' },
      { name: 'شركات وتجاري', nameEn: 'Corporate Law', keywords: 'شركات,تجاري,تأسيس شركة' },
      { name: 'عقارات', nameEn: 'Real Estate Law', keywords: 'عقاري,فراغ,طابو' },
    ],
  },
  {
    name: 'ترفيه', nameEn: 'Entertainment', icon: 'Attractions', color: '#EC4899', keywords: 'ترفيه,تسلية,العاب,طلعة,سهرة',
    subs: [
      { name: 'ملاهي ومدن ألعاب', nameEn: 'Amusement Parks', keywords: 'ملاهي,العاب اطفال,مدينة العاب' },
      { name: 'سينما ومسارح', nameEn: 'Cinema & Theater', keywords: 'سينما,مسرح,فيلم' },
      { name: 'صالات ألعاب', nameEn: 'Gaming Lounges', keywords: 'بلايستيشن,بلياردو,بولينغ' },
      { name: 'حدائق ومنتزهات', nameEn: 'Parks', keywords: 'حديقة,منتزه,طبيعة' },
      { name: 'شواطئ ومسابح', nameEn: 'Beaches & Pools', keywords: 'شاطئ,بحر,مسبح' },
      { name: 'نوادي رياضية', nameEn: 'Gyms & Clubs', keywords: 'نادي,جيم,رياضة,لياقة,سباحة' },
    ],
  },
  {
    name: 'صيانة وحرفيون', nameEn: 'Maintenance & Craftsmen', icon: 'Handyman', color: '#F59E0B', keywords: 'صيانة,تصليح,فني,معلم,حرفي,ورشة',
    subs: [
      { name: 'كهربائي', nameEn: 'Electrician', keywords: 'كهربا,كهربائي,تمديدات كهربائية' },
      { name: 'تمديدات صحية', nameEn: 'Plumber', keywords: 'سباك,صحية,مواسير,تمديدات صحية' },
      { name: 'نجار', nameEn: 'Carpenter', keywords: 'نجار,خشب,موبيليا' },
      { name: 'دهان وديكور', nameEn: 'Painter & Decor', keywords: 'دهان,ديكور,جبصين' },
      { name: 'تكييف وتبريد', nameEn: 'AC & Refrigeration', keywords: 'مكيف,تكييف,براد,تبريد' },
      { name: 'صيانة أجهزة منزلية', nameEn: 'Appliance Repair', keywords: 'غسالة,براد,فرن,صيانة اجهزة' },
      { name: 'صيانة موبايلات وكمبيوتر', nameEn: 'Phone & PC Repair', keywords: 'موبايل,كمبيوتر,لابتوب,شاشة' },
      { name: 'ألمنيوم وحدادة', nameEn: 'Aluminum & Smithing', keywords: 'المنيوم,حداد,ابواب,شبابيك' },
      { name: 'طاقة شمسية', nameEn: 'Solar Energy', keywords: 'طاقة شمسية,الواح,انفرتر,بطاريات' },
    ],
  },
  {
    name: 'نقل وتحميل', nameEn: 'Moving & Transport', icon: 'LocalShipping', color: '#8B5CF6', keywords: 'نقل,عفش,تحميل,عتال,شحن',
    subs: [
      { name: 'نقل عفش', nameEn: 'Furniture Moving', keywords: 'نقل عفش,فك وتركيب' },
      { name: 'عمال تحميل', nameEn: 'Loading Workers', keywords: 'عتال,عمال تحميل,تنزيل' },
      { name: 'شحن وتوصيل', nameEn: 'Shipping & Delivery', keywords: 'شحن,توصيل,دليفري' },
      { name: 'تكسي ونقل ركاب', nameEn: 'Taxi', keywords: 'تكسي,سيارة اجرة,سفريات' },
    ],
  },
  {
    name: 'مواد غذائية', nameEn: 'Groceries & Food', icon: 'LocalGroceryStore', color: '#22C55E', keywords: 'غذائية,سوبرماركت,بقالية,مواد غذائية',
    subs: [
      { name: 'سوبرماركت', nameEn: 'Supermarkets', keywords: 'سوبرماركت,ماركت' },
      { name: 'خضار وفواكه', nameEn: 'Fruits & Vegetables', keywords: 'خضرة,خضار,فواكه' },
      { name: 'لحوم وفروج', nameEn: 'Butchers', keywords: 'لحام,لحمة,فروج,دجاج' },
      { name: 'أفران ومخابز', nameEn: 'Bakeries', keywords: 'فرن,خبز,مخبز' },
      { name: 'بقاليات', nameEn: 'Mini Markets', keywords: 'بقالية,دكان' },
    ],
  },
  {
    name: 'تجميل وعناية', nameEn: 'Beauty & Care', icon: 'Spa', color: '#D946EF', keywords: 'تجميل,صالون,حلاق,كوافير',
    subs: [
      { name: 'حلاقة رجالية', nameEn: 'Barbers', keywords: 'حلاق,حلاقة' },
      { name: 'صالونات نسائية', nameEn: 'Ladies Salons', keywords: 'كوافيرة,صالون نسائي,مكياج' },
      { name: 'مراكز تجميل', nameEn: 'Beauty Centers', keywords: 'ليزر,تجميل,عناية بالبشرة' },
    ],
  },
  {
    name: 'سيارات', nameEn: 'Cars', icon: 'DirectionsCar', color: '#64748B', keywords: 'سيارة,سيارات,ميكانيك',
    subs: [
      { name: 'ورشات صيانة', nameEn: 'Car Repair', keywords: 'ميكانيك,كهربا سيارات,فحص' },
      { name: 'قطع غيار', nameEn: 'Spare Parts', keywords: 'قطع غيار,اكسسوارات' },
      { name: 'غسيل سيارات', nameEn: 'Car Wash', keywords: 'غسيل,تنظيف سيارات' },
      { name: 'معارض سيارات', nameEn: 'Car Dealers', keywords: 'معرض,بيع سيارات' },
      { name: 'محطات وقود', nameEn: 'Gas Stations', keywords: 'بنزين,محطة,مازوت' },
    ],
  },
  {
    name: 'تعليم', nameEn: 'Education', icon: 'School', color: '#14B8A6', keywords: 'تعليم,دراسة,مدرسة,معهد,دورة',
    subs: [
      { name: 'مدارس', nameEn: 'Schools', keywords: 'مدرسة,خاصة' },
      { name: 'معاهد ودورات', nameEn: 'Institutes', keywords: 'معهد,دورة,لغات,كمبيوتر' },
      { name: 'دروس خصوصية', nameEn: 'Private Tutors', keywords: 'مدرس,استاذ,دروس' },
      { name: 'روضات', nameEn: 'Kindergartens', keywords: 'روضة,حضانة' },
    ],
  },
  {
    name: 'خدمات ومكاتب', nameEn: 'Services & Offices', icon: 'BusinessCenter', color: '#475569', keywords: 'مكتب,خدمات,شركة',
    subs: [
      { name: 'مكاتب عقارية', nameEn: 'Real Estate', keywords: 'عقارات,بيع,ايجار,شقق' },
      { name: 'حوالات وصرافة', nameEn: 'Money Transfer', keywords: 'حوالة,صرافة,تحويل' },
      { name: 'مكاتب هندسية', nameEn: 'Engineering Offices', keywords: 'مهندس,هندسي,تصميم' },
      { name: 'محاسبة وتدقيق', nameEn: 'Accounting', keywords: 'محاسب,ضرائب,تدقيق' },
      { name: 'ترجمة', nameEn: 'Translation', keywords: 'ترجمة,محلف' },
      { name: 'تأمين', nameEn: 'Insurance', keywords: 'تأمين' },
    ],
  },
  {
    name: 'تسوق', nameEn: 'Shopping', icon: 'ShoppingBag', color: '#E11D48', keywords: 'تسوق,محل,متجر,شراء',
    subs: [
      { name: 'ملابس وأحذية', nameEn: 'Clothing & Shoes', keywords: 'البسة,ملابس,احذية' },
      { name: 'موبايلات وإلكترونيات', nameEn: 'Electronics', keywords: 'موبايل,الكترونيات,كمبيوتر' },
      { name: 'أثاث ومفروشات', nameEn: 'Furniture', keywords: 'اثاث,مفروشات,غرف نوم' },
      { name: 'هدايا وعطور', nameEn: 'Gifts & Perfumes', keywords: 'هدايا,عطور,اكسسوارات' },
    ],
  },
  {
    name: 'تنظيف وخدمات منزلية', nameEn: 'Cleaning & Home Services', icon: 'CleaningServices', color: '#06B6D4', keywords: 'تنظيف,تنضيف,خدمات منزلية,عاملة,تعقيم',
    subs: [
      { name: 'تنظيف منازل', nameEn: 'House Cleaning', keywords: 'تنظيف بيت,تنضيف,عاملة نظافة' },
      { name: 'غسيل سجاد وموكيت', nameEn: 'Carpet Cleaning', keywords: 'سجاد,موكيت,غسيل' },
      { name: 'تعقيم ومكافحة حشرات', nameEn: 'Pest Control', keywords: 'تعقيم,رش,حشرات,صراصير,قوارض' },
      { name: 'تنظيف خزانات', nameEn: 'Water Tank Cleaning', keywords: 'خزان,مي,تنظيف خزانات' },
      { name: 'تنسيق حدائق', nameEn: 'Gardening', keywords: 'حديقة,جنينة,تقليم,زراعة' },
      { name: 'جلي وتلميع', nameEn: 'Floor Polishing', keywords: 'جلي,تلميع,بلاط,رخام' },
    ],
  },
  {
    name: 'مناسبات وأفراح', nameEn: 'Events & Weddings', icon: 'Celebration', color: '#A855F7', keywords: 'مناسبة,عرس,حفلة,خطوبة,صالة',
    subs: [
      { name: 'صالات أفراح', nameEn: 'Wedding Halls', keywords: 'صالة,عرس,افراح' },
      { name: 'تصوير', nameEn: 'Photography', keywords: 'مصور,تصوير,فيديو' },
      { name: 'ضيافة وحلويات مناسبات', nameEn: 'Catering', keywords: 'ضيافة,بوفيه,حلويات' },
      { name: 'تنسيق ورود وزينة', nameEn: 'Decoration & Flowers', keywords: 'ورد,زينة,كوشة,بالونات' },
      { name: 'فرق ودي جي', nameEn: 'Bands & DJ', keywords: 'فرقة,دي جي,زفة' },
      { name: 'فساتين وبدلات', nameEn: 'Dresses & Suits', keywords: 'فستان,بدلة,ايجار فساتين' },
    ],
  },
  {
    name: 'خدمات بيطرية وحيوانات', nameEn: 'Vets & Pets', icon: 'Pets', color: '#84CC16', keywords: 'بيطري,حيوانات,قطط,كلاب',
    subs: [
      { name: 'عيادات بيطرية', nameEn: 'Vet Clinics', keywords: 'بيطري,طبيب بيطري' },
      { name: 'مستلزمات حيوانات', nameEn: 'Pet Shops', keywords: 'اكل قطط,مستلزمات' },
    ],
  },
  {
    name: 'خدمات عامة', nameEn: 'Public Services', icon: 'AccountBalance', color: '#0F766E', keywords: 'حكومي,دائرة,بنك,بريد',
    subs: [
      { name: 'بنوك', nameEn: 'Banks', keywords: 'بنك,مصرف,صراف الي' },
      { name: 'دوائر حكومية', nameEn: 'Government Offices', keywords: 'دائرة,مديرية,نفوس,سجل' },
      { name: 'بريد واتصالات', nameEn: 'Post & Telecom', keywords: 'بريد,اتصالات,انترنت' },
    ],
  },
];

export const EMERGENCY = [
  { type: 'ambulance', name: 'الإسعاف', nameEn: 'Ambulance', phone: '110' },
  { type: 'police', name: 'الشرطة', nameEn: 'Police', phone: '112' },
  { type: 'fire', name: 'الإطفاء (الدفاع المدني)', nameEn: 'Fire brigade', phone: '113' },
];

export const PLANS = [
  { code: 'free', name: 'المجانية', nameEn: 'Free', priceMonthly: '0', priceYearly: '0', color: '#64748B', isDefault: true, sortOrder: 0,
    description: 'صفحة أساسية للنشاط مع التقييمات والدوام',
    features: { maxImages: 5, maxItems: 15, maxActiveOffers: 1, maxActiveListings: 1, bookings: false, quotes: false, advancedStats: false, verifiedBadge: false, priorityBoost: 0, featuredDaysPerMonth: 0, socialLinks: true, whatsappButton: true } },
  { code: 'silver', name: 'الفضية', nameEn: 'Silver', priceMonthly: '50000', priceYearly: '500000', color: '#0BA5EC', sortOrder: 1, isRecommended: true,
    description: 'منيو/منتجات أكثر، عروض، حجوزات وطلبات أسعار',
    features: { maxImages: 15, maxItems: 100, maxActiveOffers: 5, maxActiveListings: 5, bookings: true, quotes: true, advancedStats: true, verifiedBadge: false, priorityBoost: 10, featuredDaysPerMonth: 0, socialLinks: true, whatsappButton: true } },
  { code: 'gold', name: 'الذهبية', nameEn: 'Gold', priceMonthly: '100000', priceYearly: '1000000', color: '#F79009', sortOrder: 2,
    description: 'كل شيء بلا حدود + شارة موثّق + أيام تمييز شهرية',
    features: { maxImages: 30, maxItems: -1, maxActiveOffers: -1, maxActiveListings: 20, bookings: true, quotes: true, advancedStats: true, verifiedBadge: true, priorityBoost: 25, featuredDaysPerMonth: 7, socialLinks: true, whatsappButton: true } },
];

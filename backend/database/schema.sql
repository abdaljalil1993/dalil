-- Dalilak v2.1 schema (generated from TypeORM entities). Import once: mysql -u root -p dalilak < database/schema.sql
-- Then run: npm run seed   (cities, categories, plans, emergency numbers, admin)
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS=0;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `advertisements` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `imageUrl` varchar(500) DEFAULT NULL,
  `targetUrl` varchar(500) DEFAULT NULL,
  `placement` enum('home_slider','homepage_banner','search_results','category_page','business_details','sidebar') NOT NULL,
  `status` enum('pending','active','paused','rejected','expired') NOT NULL DEFAULT 'pending',
  `startDate` datetime NOT NULL,
  `endDate` datetime NOT NULL,
  `priority` int(11) NOT NULL DEFAULT 0,
  `clickCount` int(11) NOT NULL DEFAULT 0,
  `impressionCount` int(11) NOT NULL DEFAULT 0,
  `price` decimal(12,2) DEFAULT NULL COMMENT 'Amount paid (manual billing)',
  `contactPhone` varchar(30) DEFAULT NULL,
  `adminNote` text DEFAULT NULL,
  `cityId` int(11) DEFAULT NULL COMMENT 'Optional targeting by city',
  `categoryId` int(11) DEFAULT NULL COMMENT 'Optional targeting by category',
  `businessId` varchar(36) DEFAULT NULL,
  `requestedById` varchar(36) DEFAULT NULL COMMENT 'User who requested the ad (owner self-service)',
  `createdAt` datetime(6) NOT NULL DEFAULT current_timestamp(6),
  `updatedAt` datetime(6) NOT NULL DEFAULT current_timestamp(6) ON UPDATE current_timestamp(6),
  PRIMARY KEY (`id`),
  KEY `IDX_c57012f523efd091b055ad0ec6` (`status`,`placement`,`startDate`,`endDate`),
  KEY `FK_c7a1d227ae9c337f4f1a2e48c36` (`businessId`),
  KEY `FK_7430246bb42ba8a87851e70b1c2` (`cityId`),
  KEY `FK_fa2b630def093decc14f53d2e6d` (`categoryId`),
  CONSTRAINT `FK_7430246bb42ba8a87851e70b1c2` FOREIGN KEY (`cityId`) REFERENCES `cities` (`id`) ON DELETE SET NULL ON UPDATE NO ACTION,
  CONSTRAINT `FK_c7a1d227ae9c337f4f1a2e48c36` FOREIGN KEY (`businessId`) REFERENCES `businesses` (`id`) ON DELETE SET NULL ON UPDATE NO ACTION,
  CONSTRAINT `FK_fa2b630def093decc14f53d2e6d` FOREIGN KEY (`categoryId`) REFERENCES `categories` (`id`) ON DELETE SET NULL ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `app_settings` (
  `key` varchar(100) NOT NULL,
  `updatedAt` datetime(6) NOT NULL DEFAULT current_timestamp(6) ON UPDATE current_timestamp(6),
  `value` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`value`)),
  PRIMARY KEY (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `appointments` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `businessId` varchar(36) NOT NULL,
  `userId` varchar(36) NOT NULL,
  `itemId` int(11) DEFAULT NULL COMMENT 'Optional service (business_items)',
  `date` date NOT NULL,
  `time` time DEFAULT NULL,
  `endTime` time DEFAULT NULL,
  `partySize` int(11) NOT NULL DEFAULT 1,
  `phone` varchar(30) DEFAULT NULL,
  `note` text DEFAULT NULL,
  `ownerNote` text DEFAULT NULL,
  `status` enum('pending','confirmed','rejected','cancelled','completed','no_show') NOT NULL DEFAULT 'pending',
  `createdAt` datetime(6) NOT NULL DEFAULT current_timestamp(6),
  `updatedAt` datetime(6) NOT NULL DEFAULT current_timestamp(6) ON UPDATE current_timestamp(6),
  PRIMARY KEY (`id`),
  KEY `IDX_7bf98fac7b5260d4b1a44f938d` (`businessId`),
  KEY `IDX_01733651151c8a1d6d980135cc` (`userId`),
  KEY `IDX_2a8f4ea33d73adc78e90edc9b1` (`date`,`status`),
  KEY `FK_3b1107772a737536a7a009ea518` (`itemId`),
  CONSTRAINT `FK_01733651151c8a1d6d980135cc4` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION,
  CONSTRAINT `FK_3b1107772a737536a7a009ea518` FOREIGN KEY (`itemId`) REFERENCES `business_items` (`id`) ON DELETE SET NULL ON UPDATE NO ACTION,
  CONSTRAINT `FK_7bf98fac7b5260d4b1a44f938d6` FOREIGN KEY (`businessId`) REFERENCES `businesses` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `audit_logs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `userId` varchar(255) DEFAULT NULL,
  `action` varchar(100) NOT NULL,
  `entityType` varchar(50) DEFAULT NULL,
  `entityId` varchar(255) DEFAULT NULL,
  `statusCode` int(11) DEFAULT NULL,
  `ipAddress` varchar(45) DEFAULT NULL,
  `userAgent` varchar(500) DEFAULT NULL,
  `createdAt` datetime(6) NOT NULL DEFAULT current_timestamp(6),
  `payload` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`payload`)),
  PRIMARY KEY (`id`),
  KEY `IDX_0ec936941eb8556fcd7a1f0eae` (`action`,`createdAt`),
  KEY `IDX_99e589da8f9e9326ee0d01a028` (`userId`,`createdAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `business_claims` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `userId` varchar(255) NOT NULL,
  `businessId` varchar(255) NOT NULL,
  `message` text NOT NULL,
  `phone` varchar(30) DEFAULT NULL,
  `proofUrl` varchar(500) DEFAULT NULL COMMENT 'Proof document URL',
  `status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  `adminNote` text DEFAULT NULL,
  `createdAt` datetime(6) NOT NULL DEFAULT current_timestamp(6),
  `updatedAt` datetime(6) NOT NULL DEFAULT current_timestamp(6) ON UPDATE current_timestamp(6),
  PRIMARY KEY (`id`),
  KEY `IDX_d3541e81b65dfd187634e6544f` (`userId`),
  KEY `IDX_6a7e1c63b1418b0cfdebd0e631` (`businessId`),
  CONSTRAINT `FK_6a7e1c63b1418b0cfdebd0e6310` FOREIGN KEY (`businessId`) REFERENCES `businesses` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION,
  CONSTRAINT `FK_d3541e81b65dfd187634e6544fe` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `business_images` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `url` varchar(500) NOT NULL,
  `publicId` varchar(255) DEFAULT NULL,
  `caption` varchar(255) DEFAULT NULL,
  `isPrimary` tinyint(4) NOT NULL DEFAULT 0,
  `sortOrder` int(11) NOT NULL DEFAULT 0,
  `businessId` varchar(255) NOT NULL,
  `createdAt` datetime(6) NOT NULL DEFAULT current_timestamp(6),
  PRIMARY KEY (`id`),
  KEY `IDX_6c3a150c78a49042f0bb81fb83` (`businessId`),
  CONSTRAINT `FK_6c3a150c78a49042f0bb81fb838` FOREIGN KEY (`businessId`) REFERENCES `businesses` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `business_items` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `businessId` varchar(36) NOT NULL,
  `section` varchar(100) NOT NULL DEFAULT '' COMMENT 'Section / menu category e.g. "مشاوي", "مشروبات"',
  `name` varchar(200) NOT NULL,
  `nameEn` varchar(200) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `price` decimal(14,2) DEFAULT NULL,
  `oldPrice` decimal(14,2) DEFAULT NULL,
  `currency` varchar(10) NOT NULL DEFAULT 'SYP',
  `unit` varchar(40) DEFAULT NULL COMMENT 'e.g. "للكيلو", "للشخص", "للساعة"',
  `image` varchar(500) DEFAULT NULL,
  `durationMinutes` int(11) DEFAULT NULL COMMENT 'For bookable services',
  `isAvailable` tinyint(4) NOT NULL DEFAULT 1,
  `isPopular` tinyint(4) NOT NULL DEFAULT 0,
  `sortOrder` int(11) NOT NULL DEFAULT 0,
  `createdAt` datetime(6) NOT NULL DEFAULT current_timestamp(6),
  `updatedAt` datetime(6) NOT NULL DEFAULT current_timestamp(6) ON UPDATE current_timestamp(6),
  PRIMARY KEY (`id`),
  KEY `IDX_b9224f04026592538c539763eb` (`businessId`),
  KEY `IDX_3a5d43add09ff385fef6cb1321` (`section`,`sortOrder`),
  CONSTRAINT `FK_b9224f04026592538c539763ebe` FOREIGN KEY (`businessId`) REFERENCES `businesses` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `business_working_hours` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `businessId` varchar(255) NOT NULL,
  `dayOfWeek` tinyint(3) unsigned NOT NULL,
  `openTime` time DEFAULT NULL,
  `closeTime` time DEFAULT NULL,
  `isClosed` tinyint(4) NOT NULL DEFAULT 0,
  `isOpen24Hours` tinyint(4) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `IDX_ff422fbeff23b2e29fc3ed03b3` (`businessId`,`dayOfWeek`),
  KEY `IDX_8d8e9e2e1e03515ac44c54963b` (`businessId`),
  CONSTRAINT `FK_8d8e9e2e1e03515ac44c54963b3` FOREIGN KEY (`businessId`) REFERENCES `businesses` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `businesses` (
  `id` varchar(36) NOT NULL,
  `name` varchar(255) NOT NULL,
  `nameEn` varchar(255) DEFAULT NULL,
  `slug` varchar(300) NOT NULL,
  `shortDescription` varchar(300) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `address` varchar(500) DEFAULT NULL,
  `district` varchar(150) DEFAULT NULL COMMENT 'Neighborhood / district',
  `latitude` decimal(10,7) DEFAULT NULL,
  `longitude` decimal(10,7) DEFAULT NULL,
  `phone` varchar(30) DEFAULT NULL,
  `phone2` varchar(30) DEFAULT NULL,
  `whatsapp` varchar(30) DEFAULT NULL,
  `website` varchar(255) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `coverImage` varchar(500) DEFAULT NULL,
  `logoImage` varchar(500) DEFAULT NULL,
  `priceRange` tinyint(4) DEFAULT NULL COMMENT '1..4 ($ .. $$$$)',
  `tags` text DEFAULT NULL COMMENT 'Comma separated keywords',
  `searchText` text DEFAULT NULL COMMENT 'Normalized text for search (auto)',
  `averageRating` decimal(3,2) NOT NULL DEFAULT 0.00,
  `reviewCount` int(11) NOT NULL DEFAULT 0,
  `viewCount` int(11) NOT NULL DEFAULT 0,
  `favoriteCount` int(11) NOT NULL DEFAULT 0,
  `phoneClicks` int(11) NOT NULL DEFAULT 0,
  `whatsappClicks` int(11) NOT NULL DEFAULT 0,
  `directionClicks` int(11) NOT NULL DEFAULT 0,
  `websiteClicks` int(11) NOT NULL DEFAULT 0,
  `status` enum('pending','approved','rejected','suspended') NOT NULL DEFAULT 'pending',
  `source` enum('admin','owner','suggestion') NOT NULL DEFAULT 'owner',
  `isActive` tinyint(4) NOT NULL DEFAULT 1,
  `isFeatured` tinyint(4) NOT NULL DEFAULT 0 COMMENT 'Synced automatically from active featured promotions',
  `featuredPriority` int(11) NOT NULL DEFAULT 0,
  `isVerified` tinyint(4) NOT NULL DEFAULT 0,
  `adminNote` text DEFAULT NULL,
  `ownerId` varchar(36) DEFAULT NULL,
  `categoryId` int(11) NOT NULL,
  `subCategoryId` int(11) DEFAULT NULL,
  `cityId` int(11) NOT NULL,
  `approvedAt` datetime DEFAULT NULL,
  `bookingEnabled` tinyint(4) NOT NULL DEFAULT 0,
  `bookingMode` enum('slot','day') NOT NULL DEFAULT 'slot',
  `slotMinutes` int(11) NOT NULL DEFAULT 30 COMMENT 'Slot length in minutes',
  `slotCapacity` int(11) NOT NULL DEFAULT 1 COMMENT 'Parallel bookings per slot/day',
  `bookingDaysAhead` int(11) NOT NULL DEFAULT 30 COMMENT 'How many days ahead customers can book',
  `bookingAutoConfirm` tinyint(4) NOT NULL DEFAULT 0 COMMENT 'Confirm bookings automatically',
  `bookingNote` text DEFAULT NULL,
  `acceptsQuotes` tinyint(4) NOT NULL DEFAULT 0 COMMENT 'Accepts service requests (quotes) from customers',
  `createdAt` datetime(6) NOT NULL DEFAULT current_timestamp(6),
  `updatedAt` datetime(6) NOT NULL DEFAULT current_timestamp(6) ON UPDATE current_timestamp(6),
  `socialLinks` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT '{ facebook, instagram, telegram, tiktok, youtube, x }' CHECK (json_valid(`socialLinks`)),
  `attributes` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'Free key/value details e.g. { specialty, experienceYears, languages }' CHECK (json_valid(`attributes`)),
  `amenities` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'Amenities/services list e.g. ["wifi","parking","delivery"]' CHECK (json_valid(`amenities`)),
  PRIMARY KEY (`id`),
  UNIQUE KEY `IDX_82ca19bc20713fdfa72626a5da` (`slug`),
  KEY `IDX_31e657169754a8feaa08c17bc2` (`name`),
  KEY `IDX_02e7bfb8e766e8e0ef449cc0f3` (`ownerId`),
  KEY `IDX_4d7c89efebdcbe7f54e92f5eed` (`categoryId`),
  KEY `IDX_afec2f3f2daed226bb49ea9654` (`cityId`),
  KEY `IDX_a55d26ee04554d879c5e38c9f9` (`isFeatured`,`featuredPriority`),
  KEY `IDX_2bfe627467175b6401e60ec1e9` (`cityId`,`categoryId`),
  KEY `IDX_0ecf20b5ea1e487ba7960bb953` (`status`,`isActive`),
  KEY `IDX_56ef41e717e287fb3bd812faa8` (`latitude`,`longitude`),
  KEY `FK_4649a63b4c7b4b67f5850f01536` (`subCategoryId`),
  CONSTRAINT `FK_02e7bfb8e766e8e0ef449cc0f36` FOREIGN KEY (`ownerId`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE NO ACTION,
  CONSTRAINT `FK_4649a63b4c7b4b67f5850f01536` FOREIGN KEY (`subCategoryId`) REFERENCES `sub_categories` (`id`) ON DELETE SET NULL ON UPDATE NO ACTION,
  CONSTRAINT `FK_4d7c89efebdcbe7f54e92f5eed8` FOREIGN KEY (`categoryId`) REFERENCES `categories` (`id`) ON UPDATE NO ACTION,
  CONSTRAINT `FK_afec2f3f2daed226bb49ea9654a` FOREIGN KEY (`cityId`) REFERENCES `cities` (`id`) ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `categories` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `nameEn` varchar(100) DEFAULT NULL,
  `slug` varchar(140) NOT NULL,
  `description` text DEFAULT NULL,
  `icon` varchar(100) DEFAULT NULL COMMENT 'Icon key (e.g. MUI icon name) or emoji',
  `color` varchar(20) DEFAULT NULL COMMENT 'Hex color used for category tiles',
  `image` varchar(500) DEFAULT NULL,
  `keywords` text DEFAULT NULL COMMENT 'Comma separated synonyms used by search',
  `isActive` tinyint(4) NOT NULL DEFAULT 1,
  `sortOrder` int(11) NOT NULL DEFAULT 0,
  `createdAt` datetime(6) NOT NULL DEFAULT current_timestamp(6),
  `updatedAt` datetime(6) NOT NULL DEFAULT current_timestamp(6) ON UPDATE current_timestamp(6),
  PRIMARY KEY (`id`),
  UNIQUE KEY `IDX_8b0be371d28245da6e4f4b6187` (`name`),
  UNIQUE KEY `IDX_420d9f679d41281f282f5bc7d0` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `cities` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `nameEn` varchar(100) DEFAULT NULL,
  `slug` varchar(140) NOT NULL,
  `state` varchar(100) DEFAULT NULL COMMENT 'Governorate / state',
  `country` varchar(100) DEFAULT NULL,
  `latitude` decimal(10,7) DEFAULT NULL,
  `longitude` decimal(10,7) DEFAULT NULL,
  `image` varchar(500) DEFAULT NULL,
  `isActive` tinyint(4) NOT NULL DEFAULT 1,
  `sortOrder` int(11) NOT NULL DEFAULT 0,
  `createdAt` datetime(6) NOT NULL DEFAULT current_timestamp(6),
  `updatedAt` datetime(6) NOT NULL DEFAULT current_timestamp(6) ON UPDATE current_timestamp(6),
  PRIMARY KEY (`id`),
  UNIQUE KEY `IDX_a0ae8d83b7d32359578c486e7f` (`name`),
  UNIQUE KEY `IDX_8ef722e770798e37b3205370bf` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `contact_messages` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(150) NOT NULL,
  `email` varchar(255) DEFAULT NULL,
  `phone` varchar(30) DEFAULT NULL,
  `subject` varchar(255) DEFAULT NULL,
  `message` text NOT NULL,
  `userId` varchar(255) DEFAULT NULL,
  `isRead` tinyint(4) NOT NULL DEFAULT 0,
  `createdAt` datetime(6) NOT NULL DEFAULT current_timestamp(6),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `device_tokens` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `userId` varchar(36) NOT NULL,
  `token` varchar(300) NOT NULL,
  `platform` varchar(20) NOT NULL DEFAULT 'android',
  `locale` varchar(10) DEFAULT NULL,
  `createdAt` datetime(6) NOT NULL DEFAULT current_timestamp(6),
  `updatedAt` datetime(6) NOT NULL DEFAULT current_timestamp(6) ON UPDATE current_timestamp(6),
  PRIMARY KEY (`id`),
  UNIQUE KEY `IDX_977e24c520c49436d08e5eeea8` (`token`),
  KEY `IDX_511957e3e8443429dc3fb00120` (`userId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `emergency_contacts` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `cityId` int(11) DEFAULT NULL,
  `type` enum('ambulance','fire','police','traffic','electricity','water','gas','hospital','other') NOT NULL DEFAULT 'other',
  `name` varchar(150) NOT NULL,
  `nameEn` varchar(150) DEFAULT NULL,
  `phone` varchar(30) NOT NULL,
  `phone2` varchar(30) DEFAULT NULL,
  `note` varchar(255) DEFAULT NULL,
  `isActive` tinyint(4) NOT NULL DEFAULT 1,
  `sortOrder` int(11) NOT NULL DEFAULT 0,
  `createdAt` datetime(6) NOT NULL DEFAULT current_timestamp(6),
  PRIMARY KEY (`id`),
  KEY `FK_200f44c1b56ee21612de2e56cd2` (`cityId`),
  CONSTRAINT `FK_200f44c1b56ee21612de2e56cd2` FOREIGN KEY (`cityId`) REFERENCES `cities` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `favorites` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `userId` varchar(255) NOT NULL,
  `businessId` varchar(255) NOT NULL,
  `createdAt` datetime(6) NOT NULL DEFAULT current_timestamp(6),
  PRIMARY KEY (`id`),
  UNIQUE KEY `IDX_26891f1090e5f2829cdec47b89` (`userId`,`businessId`),
  KEY `IDX_e747534006c6e3c2f09939da60` (`userId`),
  KEY `IDX_13a80dce88bdf598df7b6ead5b` (`businessId`),
  CONSTRAINT `FK_13a80dce88bdf598df7b6ead5b2` FOREIGN KEY (`businessId`) REFERENCES `businesses` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION,
  CONSTRAINT `FK_e747534006c6e3c2f09939da60f` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `featured_businesses` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `businessId` varchar(255) NOT NULL,
  `startDate` datetime NOT NULL,
  `endDate` datetime NOT NULL,
  `status` enum('pending','active','rejected','expired') NOT NULL DEFAULT 'pending',
  `priority` int(11) NOT NULL DEFAULT 0,
  `price` decimal(12,2) DEFAULT NULL,
  `note` text DEFAULT NULL,
  `requestedById` varchar(36) DEFAULT NULL,
  `createdAt` datetime(6) NOT NULL DEFAULT current_timestamp(6),
  `updatedAt` datetime(6) NOT NULL DEFAULT current_timestamp(6) ON UPDATE current_timestamp(6),
  PRIMARY KEY (`id`),
  KEY `IDX_9131cb72d649022a75f23ac943` (`businessId`),
  KEY `IDX_b259f63c9a9ffdcc2dfd29d7d5` (`status`,`startDate`,`endDate`),
  CONSTRAINT `FK_9131cb72d649022a75f23ac943b` FOREIGN KEY (`businessId`) REFERENCES `businesses` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `job_applications` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `listingId` varchar(36) NOT NULL,
  `userId` varchar(36) NOT NULL,
  `message` text DEFAULT NULL,
  `phone` varchar(30) DEFAULT NULL,
  `cvUrl` varchar(500) DEFAULT NULL,
  `status` enum('new','viewed','shortlisted','rejected','hired') NOT NULL DEFAULT 'new',
  `createdAt` datetime(6) NOT NULL DEFAULT current_timestamp(6),
  `updatedAt` datetime(6) NOT NULL DEFAULT current_timestamp(6) ON UPDATE current_timestamp(6),
  PRIMARY KEY (`id`),
  UNIQUE KEY `IDX_2109279920c06db96d7412fa16` (`listingId`,`userId`),
  KEY `IDX_f1f1c83d557764941ba1da3a0e` (`listingId`),
  KEY `IDX_f5d132e5bfd7d396afb6458e71` (`userId`),
  CONSTRAINT `FK_f1f1c83d557764941ba1da3a0e2` FOREIGN KEY (`listingId`) REFERENCES `listings` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION,
  CONSTRAINT `FK_f5d132e5bfd7d396afb6458e71c` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `listings` (
  `id` varchar(36) NOT NULL,
  `slug` varchar(300) NOT NULL,
  `type` enum('real_estate','car','job','other') NOT NULL,
  `purpose` enum('sale','rent','hire','wanted') NOT NULL,
  `title` varchar(200) NOT NULL,
  `description` text DEFAULT NULL,
  `price` decimal(16,2) DEFAULT NULL,
  `currency` varchar(10) NOT NULL DEFAULT 'SYP',
  `priceNegotiable` tinyint(4) NOT NULL DEFAULT 0,
  `pricePeriod` varchar(30) DEFAULT NULL COMMENT 'monthly / yearly / daily (rent, salary)',
  `cityId` int(11) NOT NULL,
  `district` varchar(150) DEFAULT NULL,
  `address` varchar(500) DEFAULT NULL,
  `latitude` decimal(10,7) DEFAULT NULL,
  `longitude` decimal(10,7) DEFAULT NULL,
  `searchText` text DEFAULT NULL,
  `userId` varchar(36) NOT NULL,
  `businessId` varchar(36) DEFAULT NULL COMMENT 'Posted on behalf of a business (agency, dealer, company)',
  `contactPhone` varchar(30) DEFAULT NULL,
  `whatsapp` varchar(30) DEFAULT NULL,
  `status` enum('pending','active','rejected','closed','expired') NOT NULL DEFAULT 'pending',
  `adminNote` text DEFAULT NULL,
  `isFeatured` tinyint(4) NOT NULL DEFAULT 0,
  `viewCount` int(11) NOT NULL DEFAULT 0,
  `applicationsCount` int(11) NOT NULL DEFAULT 0,
  `expiresAt` datetime DEFAULT NULL,
  `createdAt` datetime(6) NOT NULL DEFAULT current_timestamp(6),
  `updatedAt` datetime(6) NOT NULL DEFAULT current_timestamp(6) ON UPDATE current_timestamp(6),
  `attributes` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`attributes`)),
  `images` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`images`)),
  PRIMARY KEY (`id`),
  UNIQUE KEY `IDX_23a9f6b054ab6ba43132dfec40` (`slug`),
  KEY `IDX_1141838719be008ddc390913b7` (`cityId`),
  KEY `IDX_45d5c4642c4cad0229da0ec22e` (`userId`),
  KEY `IDX_3fd9451d7c869ef1e4338ffacc` (`status`,`createdAt`),
  KEY `IDX_aac410a462ad26d7b148521918` (`type`,`status`,`cityId`),
  KEY `FK_91749dd2212027d0c9232f9b7f4` (`businessId`),
  CONSTRAINT `FK_1141838719be008ddc390913b71` FOREIGN KEY (`cityId`) REFERENCES `cities` (`id`) ON UPDATE NO ACTION,
  CONSTRAINT `FK_45d5c4642c4cad0229da0ec22e7` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION,
  CONSTRAINT `FK_91749dd2212027d0c9232f9b7f4` FOREIGN KEY (`businessId`) REFERENCES `businesses` (`id`) ON DELETE SET NULL ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `notifications` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `userId` varchar(255) NOT NULL,
  `type` enum('business_approved','business_rejected','new_review','review_reply','claim_approved','claim_rejected','promotion_approved','promotion_rejected','subscription_activated','subscription_expiring','payment_rejected','listing_approved','listing_rejected','job_application','application_update','service_request','new_quote','quote_accepted','new_appointment','appointment_update','system') NOT NULL DEFAULT 'system',
  `title` varchar(255) NOT NULL,
  `body` text DEFAULT NULL,
  `isRead` tinyint(4) NOT NULL DEFAULT 0,
  `createdAt` datetime(6) NOT NULL DEFAULT current_timestamp(6),
  `data` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'e.g. { businessId, slug, reviewId }' CHECK (json_valid(`data`)),
  PRIMARY KEY (`id`),
  KEY `IDX_adb71380622f8eb91ce89d5ecc` (`userId`,`isRead`,`createdAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `offers` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `businessId` varchar(36) NOT NULL,
  `title` varchar(200) NOT NULL,
  `description` text DEFAULT NULL,
  `image` varchar(500) DEFAULT NULL,
  `discountPercent` int(11) DEFAULT NULL,
  `price` decimal(14,2) DEFAULT NULL,
  `oldPrice` decimal(14,2) DEFAULT NULL,
  `currency` varchar(10) NOT NULL DEFAULT 'SYP',
  `couponCode` varchar(40) DEFAULT NULL,
  `terms` text DEFAULT NULL,
  `startDate` datetime NOT NULL,
  `endDate` datetime NOT NULL,
  `isActive` tinyint(4) NOT NULL DEFAULT 1,
  `viewCount` int(11) NOT NULL DEFAULT 0,
  `createdAt` datetime(6) NOT NULL DEFAULT current_timestamp(6),
  `updatedAt` datetime(6) NOT NULL DEFAULT current_timestamp(6) ON UPDATE current_timestamp(6),
  PRIMARY KEY (`id`),
  KEY `IDX_b52b5f90e90473d3f66530f5a1` (`businessId`),
  KEY `IDX_119b0a3211acf96a18b16d99e4` (`isActive`,`startDate`,`endDate`),
  CONSTRAINT `FK_b52b5f90e90473d3f66530f5a16` FOREIGN KEY (`businessId`) REFERENCES `businesses` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `otp_codes` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `phone` varchar(30) NOT NULL,
  `codeHash` varchar(128) NOT NULL,
  `expiresAt` datetime NOT NULL,
  `attempts` int(11) NOT NULL DEFAULT 0,
  `used` tinyint(4) NOT NULL DEFAULT 0,
  `ipAddress` varchar(45) DEFAULT NULL,
  `createdAt` datetime(6) NOT NULL DEFAULT current_timestamp(6),
  PRIMARY KEY (`id`),
  KEY `IDX_c29318b88c272d12db7373461e` (`phone`,`createdAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `payments` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `userId` varchar(36) DEFAULT NULL,
  `businessId` varchar(36) DEFAULT NULL,
  `subscriptionId` int(11) DEFAULT NULL,
  `purpose` enum('subscription','featured','advertisement','listing','other') NOT NULL DEFAULT 'subscription',
  `amount` decimal(12,2) NOT NULL DEFAULT 0.00,
  `currency` varchar(10) NOT NULL DEFAULT 'SYP',
  `method` enum('sham_cash','syriatel_cash','mtn_cash','bank','cash','other') NOT NULL DEFAULT 'cash',
  `reference` varchar(150) DEFAULT NULL COMMENT 'Transaction / receipt number',
  `status` enum('pending','confirmed','rejected') NOT NULL DEFAULT 'pending',
  `note` text DEFAULT NULL,
  `adminNote` text DEFAULT NULL,
  `createdAt` datetime(6) NOT NULL DEFAULT current_timestamp(6),
  `updatedAt` datetime(6) NOT NULL DEFAULT current_timestamp(6) ON UPDATE current_timestamp(6),
  PRIMARY KEY (`id`),
  KEY `IDX_3cc6f3e2f26955eaa64fd7f9ea` (`status`,`createdAt`),
  KEY `FK_d35cb3c13a18e1ea1705b2817b1` (`userId`),
  KEY `FK_9628bb768218b756d120c5e5454` (`businessId`),
  CONSTRAINT `FK_9628bb768218b756d120c5e5454` FOREIGN KEY (`businessId`) REFERENCES `businesses` (`id`) ON DELETE SET NULL ON UPDATE NO ACTION,
  CONSTRAINT `FK_d35cb3c13a18e1ea1705b2817b1` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `pharmacy_duties` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `businessId` varchar(36) NOT NULL,
  `date` date NOT NULL,
  `startTime` time DEFAULT NULL,
  `endTime` time DEFAULT NULL,
  `note` varchar(255) DEFAULT NULL,
  `createdAt` datetime(6) NOT NULL DEFAULT current_timestamp(6),
  PRIMARY KEY (`id`),
  UNIQUE KEY `IDX_26509593101b0a37146da3f82a` (`date`,`businessId`),
  KEY `IDX_afcab8f9a5fe2344f59b2534b6` (`businessId`),
  CONSTRAINT `FK_afcab8f9a5fe2344f59b2534b65` FOREIGN KEY (`businessId`) REFERENCES `businesses` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `plans` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `code` varchar(40) NOT NULL,
  `name` varchar(100) NOT NULL,
  `nameEn` varchar(100) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `priceMonthly` decimal(12,2) NOT NULL DEFAULT 0.00,
  `priceYearly` decimal(12,2) NOT NULL DEFAULT 0.00,
  `currency` varchar(10) NOT NULL DEFAULT 'SYP',
  `features` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`features`)),
  `color` varchar(20) DEFAULT NULL,
  `isDefault` tinyint(4) NOT NULL DEFAULT 0 COMMENT 'Plan given to every business when no paid subscription is active',
  `isRecommended` tinyint(4) NOT NULL DEFAULT 0,
  `isActive` tinyint(4) NOT NULL DEFAULT 1,
  `sortOrder` int(11) NOT NULL DEFAULT 0,
  `createdAt` datetime(6) NOT NULL DEFAULT current_timestamp(6),
  `updatedAt` datetime(6) NOT NULL DEFAULT current_timestamp(6) ON UPDATE current_timestamp(6),
  PRIMARY KEY (`id`),
  UNIQUE KEY `IDX_95f7ef3fc4c31a3545b4d825dd` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `quotes` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `requestId` int(11) NOT NULL,
  `businessId` varchar(36) NOT NULL,
  `price` decimal(14,2) DEFAULT NULL,
  `currency` varchar(10) NOT NULL DEFAULT 'SYP',
  `message` text NOT NULL,
  `etaDays` int(11) DEFAULT NULL,
  `status` enum('pending','accepted','rejected','withdrawn') NOT NULL DEFAULT 'pending',
  `createdAt` datetime(6) NOT NULL DEFAULT current_timestamp(6),
  `updatedAt` datetime(6) NOT NULL DEFAULT current_timestamp(6) ON UPDATE current_timestamp(6),
  PRIMARY KEY (`id`),
  UNIQUE KEY `IDX_12c4353b968d540fcba9ba7edb` (`requestId`,`businessId`),
  KEY `IDX_94b283a74da5d28a700add75f0` (`requestId`),
  KEY `IDX_b1b8e9ffc45eb9c2bfd3209024` (`businessId`),
  CONSTRAINT `FK_94b283a74da5d28a700add75f09` FOREIGN KEY (`requestId`) REFERENCES `service_requests` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION,
  CONSTRAINT `FK_b1b8e9ffc45eb9c2bfd32090242` FOREIGN KEY (`businessId`) REFERENCES `businesses` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `refresh_tokens` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tokenHash` varchar(128) NOT NULL COMMENT 'SHA-256 hash of the refresh token',
  `userId` varchar(255) NOT NULL,
  `expiresAt` datetime NOT NULL,
  `isRevoked` tinyint(4) NOT NULL DEFAULT 0,
  `ipAddress` varchar(45) DEFAULT NULL,
  `userAgent` varchar(500) DEFAULT NULL,
  `createdAt` datetime(6) NOT NULL DEFAULT current_timestamp(6),
  PRIMARY KEY (`id`),
  UNIQUE KEY `IDX_c25bc63d248ca90e8dcc1d92d0` (`tokenHash`),
  KEY `IDX_610102b60fea1455310ccd299d` (`userId`),
  CONSTRAINT `FK_610102b60fea1455310ccd299de` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `reports` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `reporterId` varchar(255) NOT NULL,
  `businessId` varchar(255) NOT NULL,
  `reviewId` varchar(36) DEFAULT NULL,
  `type` enum('spam','inappropriate','wrong_info','duplicate','closed','fake_review','other') NOT NULL,
  `description` text DEFAULT NULL,
  `status` enum('pending','reviewed','resolved','dismissed') NOT NULL DEFAULT 'pending',
  `adminNote` text DEFAULT NULL,
  `createdAt` datetime(6) NOT NULL DEFAULT current_timestamp(6),
  `updatedAt` datetime(6) NOT NULL DEFAULT current_timestamp(6) ON UPDATE current_timestamp(6),
  PRIMARY KEY (`id`),
  KEY `IDX_4353be8309ce86650def2f8572` (`reporterId`),
  KEY `IDX_914ec8a4173f1a2a3b7cd5d73b` (`businessId`),
  KEY `FK_29ae1465ecb0d282037a8739f42` (`reviewId`),
  CONSTRAINT `FK_29ae1465ecb0d282037a8739f42` FOREIGN KEY (`reviewId`) REFERENCES `reviews` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION,
  CONSTRAINT `FK_4353be8309ce86650def2f8572d` FOREIGN KEY (`reporterId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION,
  CONSTRAINT `FK_914ec8a4173f1a2a3b7cd5d73bf` FOREIGN KEY (`businessId`) REFERENCES `businesses` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `review_likes` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `userId` varchar(255) NOT NULL,
  `reviewId` varchar(255) NOT NULL,
  `createdAt` datetime(6) NOT NULL DEFAULT current_timestamp(6),
  PRIMARY KEY (`id`),
  UNIQUE KEY `IDX_66b73fb28dc2cf83784b4089b9` (`userId`,`reviewId`),
  KEY `IDX_0d688be5d7def42d685de4d2c7` (`userId`),
  KEY `IDX_9860c907f782adb487acfb2a53` (`reviewId`),
  CONSTRAINT `FK_0d688be5d7def42d685de4d2c74` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION,
  CONSTRAINT `FK_9860c907f782adb487acfb2a539` FOREIGN KEY (`reviewId`) REFERENCES `reviews` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `reviews` (
  `id` varchar(36) NOT NULL,
  `userId` varchar(255) NOT NULL,
  `businessId` varchar(255) NOT NULL,
  `rating` tinyint(3) unsigned NOT NULL COMMENT '1 to 5',
  `content` text DEFAULT NULL,
  `ownerReply` text DEFAULT NULL,
  `ownerRepliedAt` datetime DEFAULT NULL,
  `likesCount` int(11) NOT NULL DEFAULT 0,
  `isHidden` tinyint(4) NOT NULL DEFAULT 0,
  `createdAt` datetime(6) NOT NULL DEFAULT current_timestamp(6),
  `updatedAt` datetime(6) NOT NULL DEFAULT current_timestamp(6) ON UPDATE current_timestamp(6),
  PRIMARY KEY (`id`),
  UNIQUE KEY `IDX_cc0eafa31f7a1d0d15a25b9684` (`userId`,`businessId`),
  KEY `IDX_7ed5659e7139fc8bc039198cc1` (`userId`),
  KEY `IDX_d17ce9c119d29c7ec8c884044c` (`businessId`),
  KEY `IDX_e896adb7fe7ccb8d463c938e84` (`businessId`,`createdAt`),
  CONSTRAINT `FK_7ed5659e7139fc8bc039198cc1f` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION,
  CONSTRAINT `FK_d17ce9c119d29c7ec8c884044cb` FOREIGN KEY (`businessId`) REFERENCES `businesses` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `search_logs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `query` varchar(255) NOT NULL,
  `normalizedQuery` varchar(255) NOT NULL,
  `userId` varchar(255) DEFAULT NULL,
  `categoryId` int(11) DEFAULT NULL,
  `cityId` int(11) DEFAULT NULL,
  `ipAddress` varchar(45) DEFAULT NULL,
  `resultsCount` int(11) NOT NULL DEFAULT 0,
  `createdAt` datetime(6) NOT NULL DEFAULT current_timestamp(6),
  PRIMARY KEY (`id`),
  KEY `IDX_7a7a845422d711b3f895e720ea` (`normalizedQuery`,`createdAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `service_requests` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `userId` varchar(36) NOT NULL,
  `categoryId` int(11) NOT NULL,
  `subCategoryId` int(11) DEFAULT NULL,
  `cityId` int(11) NOT NULL,
  `district` varchar(150) DEFAULT NULL,
  `title` varchar(200) NOT NULL,
  `description` text NOT NULL,
  `budget` decimal(14,2) DEFAULT NULL,
  `preferredDate` date DEFAULT NULL,
  `phone` varchar(30) DEFAULT NULL,
  `sharePhone` tinyint(4) NOT NULL DEFAULT 1 COMMENT 'Show phone to businesses that send a quote',
  `status` enum('open','assigned','closed','cancelled') NOT NULL DEFAULT 'open',
  `quotesCount` int(11) NOT NULL DEFAULT 0,
  `acceptedQuoteId` int(11) DEFAULT NULL,
  `expiresAt` datetime DEFAULT NULL,
  `createdAt` datetime(6) NOT NULL DEFAULT current_timestamp(6),
  `updatedAt` datetime(6) NOT NULL DEFAULT current_timestamp(6) ON UPDATE current_timestamp(6),
  `images` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`images`)),
  PRIMARY KEY (`id`),
  KEY `IDX_993eaa2875a66ebafedf054688` (`userId`),
  KEY `IDX_9ea2dfed97e371c7fe323ccfe3` (`categoryId`),
  KEY `IDX_2eea8b9a676560804b32bac325` (`subCategoryId`),
  KEY `IDX_b812af1c72a2ac0d5dc6387ce6` (`cityId`),
  KEY `IDX_7d97d080ce75e1ff63454a5aa3` (`status`,`categoryId`,`cityId`),
  CONSTRAINT `FK_2eea8b9a676560804b32bac3254` FOREIGN KEY (`subCategoryId`) REFERENCES `sub_categories` (`id`) ON DELETE SET NULL ON UPDATE NO ACTION,
  CONSTRAINT `FK_993eaa2875a66ebafedf0546883` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION,
  CONSTRAINT `FK_9ea2dfed97e371c7fe323ccfe3c` FOREIGN KEY (`categoryId`) REFERENCES `categories` (`id`) ON UPDATE NO ACTION,
  CONSTRAINT `FK_b812af1c72a2ac0d5dc6387ce64` FOREIGN KEY (`cityId`) REFERENCES `cities` (`id`) ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `sub_categories` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `nameEn` varchar(100) DEFAULT NULL,
  `slug` varchar(140) NOT NULL,
  `description` text DEFAULT NULL,
  `icon` varchar(100) DEFAULT NULL,
  `keywords` text DEFAULT NULL COMMENT 'Comma separated synonyms used by search',
  `isActive` tinyint(4) NOT NULL DEFAULT 1,
  `sortOrder` int(11) NOT NULL DEFAULT 0,
  `categoryId` int(11) NOT NULL,
  `createdAt` datetime(6) NOT NULL DEFAULT current_timestamp(6),
  `updatedAt` datetime(6) NOT NULL DEFAULT current_timestamp(6) ON UPDATE current_timestamp(6),
  PRIMARY KEY (`id`),
  UNIQUE KEY `IDX_83b6e1bb0daad5401c120f31c0` (`categoryId`,`slug`),
  KEY `IDX_dfa3adf1b46e582626b295d025` (`categoryId`),
  CONSTRAINT `FK_dfa3adf1b46e582626b295d0257` FOREIGN KEY (`categoryId`) REFERENCES `categories` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `subscriptions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `businessId` varchar(36) NOT NULL,
  `userId` varchar(36) DEFAULT NULL,
  `planId` int(11) NOT NULL,
  `status` enum('pending','active','expired','cancelled') NOT NULL DEFAULT 'pending',
  `period` varchar(10) NOT NULL DEFAULT 'monthly',
  `startDate` datetime DEFAULT NULL,
  `endDate` datetime DEFAULT NULL,
  `autoRenewReminder` tinyint(4) NOT NULL DEFAULT 0,
  `note` text DEFAULT NULL,
  `createdAt` datetime(6) NOT NULL DEFAULT current_timestamp(6),
  `updatedAt` datetime(6) NOT NULL DEFAULT current_timestamp(6) ON UPDATE current_timestamp(6),
  PRIMARY KEY (`id`),
  KEY `IDX_7e9f8a764f844a37dc4a968494` (`businessId`),
  KEY `IDX_7536cba909dd7584a4640cad7d` (`planId`),
  KEY `IDX_5e1e595231be6134ac7b1ae653` (`status`,`endDate`),
  CONSTRAINT `FK_7536cba909dd7584a4640cad7d5` FOREIGN KEY (`planId`) REFERENCES `plans` (`id`) ON UPDATE NO ACTION,
  CONSTRAINT `FK_7e9f8a764f844a37dc4a968494a` FOREIGN KEY (`businessId`) REFERENCES `businesses` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `users` (
  `id` varchar(36) NOT NULL,
  `firstName` varchar(100) NOT NULL,
  `lastName` varchar(100) NOT NULL,
  `email` varchar(255) DEFAULT NULL COMMENT 'Null for phone-only (OTP) accounts',
  `password` varchar(255) NOT NULL,
  `phone` varchar(30) DEFAULT NULL,
  `avatar` varchar(500) DEFAULT NULL,
  `bio` varchar(500) DEFAULT NULL,
  `cityId` int(11) DEFAULT NULL,
  `role` enum('user','business_owner','admin') NOT NULL DEFAULT 'user',
  `status` enum('active','inactive','suspended') NOT NULL DEFAULT 'active',
  `isEmailVerified` tinyint(4) NOT NULL DEFAULT 0,
  `isPhoneVerified` tinyint(4) NOT NULL DEFAULT 0,
  `passwordResetToken` varchar(255) DEFAULT NULL,
  `passwordResetExpires` datetime DEFAULT NULL,
  `lastLoginAt` datetime DEFAULT NULL,
  `createdAt` datetime(6) NOT NULL DEFAULT current_timestamp(6),
  `updatedAt` datetime(6) NOT NULL DEFAULT current_timestamp(6) ON UPDATE current_timestamp(6),
  PRIMARY KEY (`id`),
  UNIQUE KEY `IDX_97672ac88f789774dd47f7c8be` (`email`),
  KEY `IDX_a000cca60bcf04454e72769949` (`phone`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
SET FOREIGN_KEY_CHECKS=1;

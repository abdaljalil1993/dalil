import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
  ManyToOne, OneToMany, JoinColumn, Index,
} from 'typeorm';
import { BusinessStatus, BusinessSource } from './enums';
import { decimalTransformer } from './transformers';
import type { User } from './User';
import type { Category } from './Category';
import type { SubCategory } from './SubCategory';
import type { City } from './City';
import type { BusinessImage } from './BusinessImage';
import type { BusinessWorkingHours } from './BusinessWorkingHours';
import type { Review } from './Review';

@Entity('businesses')
@Index(['status', 'isActive'])
@Index(['cityId', 'categoryId'])
@Index(['isFeatured', 'featuredPriority'])
@Index(['latitude', 'longitude'])
export class Business {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ length: 255 })
  name: string;

  @Column({ nullable: true, length: 255 })
  nameEn: string;

  @Index({ unique: true })
  @Column({ length: 300 })
  slug: string;

  @Column({ nullable: true, length: 300 })
  shortDescription: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ nullable: true, length: 500 })
  address: string;

  @Column({ nullable: true, length: 150, comment: 'Neighborhood / district' })
  district: string;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true, transformer: decimalTransformer })
  latitude: number | null;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true, transformer: decimalTransformer })
  longitude: number | null;

  @Column({ nullable: true, length: 30 })
  phone: string;

  @Column({ nullable: true, length: 30 })
  phone2: string;

  @Column({ nullable: true, length: 30 })
  whatsapp: string;

  @Column({ nullable: true, length: 255 })
  website: string;

  @Column({ nullable: true, length: 255 })
  email: string;

  @Column({ type: 'json', nullable: true, comment: '{ facebook, instagram, telegram, tiktok, youtube, x }' })
  socialLinks: Record<string, string> | null;

  @Column({ nullable: true, length: 500 })
  coverImage: string;

  @Column({ nullable: true, length: 500 })
  logoImage: string;

  @Column({ type: 'tinyint', nullable: true, comment: '1..4 ($ .. $$$$)' })
  priceRange: number | null;

  @Column({ type: 'json', nullable: true, comment: 'Free key/value details e.g. { specialty, experienceYears, languages }' })
  attributes: Record<string, string | number | boolean | string[]> | null;

  @Column({ type: 'json', nullable: true, comment: 'Amenities/services list e.g. ["wifi","parking","delivery"]' })
  amenities: string[] | null;

  @Column({ nullable: true, type: 'text', comment: 'Comma separated keywords' })
  tags: string;

  @Column({ type: 'text', nullable: true, select: false, comment: 'Normalized text for search (auto)' })
  searchText: string;

  @Column({ type: 'decimal', precision: 3, scale: 2, default: 0, transformer: decimalTransformer })
  averageRating: number;

  @Column({ default: 0 })
  reviewCount: number;

  @Column({ default: 0 })
  viewCount: number;

  @Column({ default: 0 })
  favoriteCount: number;

  @Column({ default: 0 })
  phoneClicks: number;

  @Column({ default: 0 })
  whatsappClicks: number;

  @Column({ default: 0 })
  directionClicks: number;

  @Column({ default: 0 })
  websiteClicks: number;

  @Column({ type: 'enum', enum: BusinessStatus, default: BusinessStatus.PENDING })
  status: BusinessStatus;

  @Column({ type: 'enum', enum: BusinessSource, default: BusinessSource.OWNER })
  source: BusinessSource;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: false, comment: 'Synced automatically from active featured promotions' })
  isFeatured: boolean;

  @Column({ default: 0 })
  featuredPriority: number;

  @Column({ default: false })
  isVerified: boolean;

  @Column({ nullable: true, type: 'text' })
  adminNote: string;

  @Index()
  @Column({ type: 'varchar', length: 36, nullable: true })
  ownerId: string | null;

  @Index()
  @Column()
  categoryId: number;

  @Column({ type: 'int', nullable: true })
  subCategoryId: number | null;

  @Index()
  @Column()
  cityId: number;

  @Column({ nullable: true, type: 'datetime' })
  approvedAt: Date | null;

  // ── bookings (appointments) ──
  @Column({ default: false })
  bookingEnabled: boolean;

  @Column({ type: 'enum', enum: ['slot', 'day'], default: 'slot' })
  bookingMode: 'slot' | 'day';

  @Column({ default: 30, comment: 'Slot length in minutes' })
  slotMinutes: number;

  @Column({ default: 1, comment: 'Parallel bookings per slot/day' })
  slotCapacity: number;

  @Column({ default: 30, comment: 'How many days ahead customers can book' })
  bookingDaysAhead: number;

  @Column({ default: false, comment: 'Confirm bookings automatically' })
  bookingAutoConfirm: boolean;

  @Column({ nullable: true, type: 'text' })
  bookingNote: string;

  @Column({ default: false, comment: 'Accepts service requests (quotes) from customers' })
  acceptsQuotes: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne('User', 'businesses', { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'ownerId' })
  owner: User;

  @ManyToOne('Category', 'businesses', { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'categoryId' })
  category: Category;

  @ManyToOne('SubCategory', { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'subCategoryId' })
  subCategory: SubCategory;

  @ManyToOne('City', { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'cityId' })
  city: City;

  @OneToMany('BusinessImage', 'business')
  images: BusinessImage[];

  @OneToMany('BusinessWorkingHours', 'business')
  workingHours: BusinessWorkingHours[];

  @OneToMany('Review', 'business')
  reviews: Review[];
}

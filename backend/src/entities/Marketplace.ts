import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index, Unique } from 'typeorm';
import { ApplicationStatus, ListingPurpose, ListingStatus, ListingType, QuoteStatus, ServiceRequestStatus } from './enums';
import { decimalTransformer } from './transformers';
import type { User } from './User';
import type { Business } from './Business';
import type { City } from './City';
import type { Category } from './Category';
import type { SubCategory } from './SubCategory';

/**
 * Classifieds: real estate, cars, jobs (and "other").
 * Type-specific fields live in `attributes` (see LISTING_FIELDS in services/ListingService.ts), filterable via attr[...] query params.
 */
@Entity('listings')
@Index(['type', 'status', 'cityId'])
@Index(['status', 'createdAt'])
export class Listing {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index({ unique: true })
  @Column({ length: 300 })
  slug: string;

  @Column({ type: 'enum', enum: ListingType })
  type: ListingType;

  @Column({ type: 'enum', enum: ListingPurpose })
  purpose: ListingPurpose;

  @Column({ length: 200 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'decimal', precision: 16, scale: 2, nullable: true, transformer: decimalTransformer })
  price: number | null;

  @Column({ length: 10, default: 'SYP' })
  currency: string;

  @Column({ default: false })
  priceNegotiable: boolean;

  @Column({ nullable: true, length: 30, comment: 'monthly / yearly / daily (rent, salary)' })
  pricePeriod: string;

  @Index()
  @Column()
  cityId: number;

  @Column({ nullable: true, length: 150 })
  district: string;

  @Column({ nullable: true, length: 500 })
  address: string;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true, transformer: decimalTransformer })
  latitude: number | null;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true, transformer: decimalTransformer })
  longitude: number | null;

  @Column({ type: 'json', nullable: true })
  attributes: Record<string, string | number | boolean | string[]> | null;

  @Column({ type: 'json', nullable: true })
  images: { url: string; publicId?: string }[] | null;

  @Column({ type: 'text', nullable: true, select: false })
  searchText: string;

  @Index()
  @Column({ type: 'varchar', length: 36 })
  userId: string;

  @Column({ type: 'varchar', length: 36, nullable: true, comment: 'Posted on behalf of a business (agency, dealer, company)' })
  businessId: string | null;

  @Column({ nullable: true, length: 30 })
  contactPhone: string;

  @Column({ nullable: true, length: 30 })
  whatsapp: string;

  @Column({ type: 'enum', enum: ListingStatus, default: ListingStatus.PENDING })
  status: ListingStatus;

  @Column({ nullable: true, type: 'text' })
  adminNote: string;

  @Column({ default: false })
  isFeatured: boolean;

  @Column({ default: 0 })
  viewCount: number;

  @Column({ default: 0 })
  applicationsCount: number;

  @Column({ type: 'datetime', nullable: true })
  expiresAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne('User', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne('Business', { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'businessId' })
  business: Business;

  @ManyToOne('City', { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'cityId' })
  city: City;
}

@Entity('job_applications')
@Unique(['listingId', 'userId'])
export class JobApplication {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column({ type: 'varchar', length: 36 })
  listingId: string;

  @Index()
  @Column({ type: 'varchar', length: 36 })
  userId: string;

  @Column({ type: 'text', nullable: true })
  message: string;

  @Column({ nullable: true, length: 30 })
  phone: string;

  @Column({ nullable: true, length: 500 })
  cvUrl: string;

  @Column({ type: 'enum', enum: ApplicationStatus, default: ApplicationStatus.NEW })
  status: ApplicationStatus;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne('Listing', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'listingId' })
  listing: Listing;

  @ManyToOne('User', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;
}

/** "I need an electrician in Al-Ziraa" → sent to matching businesses who reply with quotes. */
@Entity('service_requests')
@Index(['status', 'categoryId', 'cityId'])
export class ServiceRequest {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column({ type: 'varchar', length: 36 })
  userId: string;

  @Index()
  @Column()
  categoryId: number;

  @Index()
  @Column({ type: 'int', nullable: true })
  subCategoryId: number | null;

  @Index()
  @Column()
  cityId: number;

  @Column({ nullable: true, length: 150 })
  district: string;

  @Column({ length: 200 })
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'json', nullable: true })
  images: { url: string }[] | null;

  @Column({ type: 'decimal', precision: 14, scale: 2, nullable: true })
  budget: string | null;

  @Column({ type: 'date', nullable: true })
  preferredDate: string | null;

  @Column({ nullable: true, length: 30 })
  phone: string;

  @Column({ default: true, comment: 'Show phone to businesses that send a quote' })
  sharePhone: boolean;

  @Column({ type: 'enum', enum: ServiceRequestStatus, default: ServiceRequestStatus.OPEN })
  status: ServiceRequestStatus;

  @Column({ default: 0 })
  quotesCount: number;

  @Column({ type: 'int', nullable: true })
  acceptedQuoteId: number | null;

  @Column({ type: 'datetime', nullable: true })
  expiresAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne('User', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne('Category', { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'categoryId' })
  category: Category;

  @ManyToOne('SubCategory', { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'subCategoryId' })
  subCategory: SubCategory;

  @ManyToOne('City', { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'cityId' })
  city: City;
}

@Entity('quotes')
@Unique(['requestId', 'businessId'])
export class Quote {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column()
  requestId: number;

  @Index()
  @Column({ type: 'varchar', length: 36 })
  businessId: string;

  @Column({ type: 'decimal', precision: 14, scale: 2, nullable: true })
  price: string | null;

  @Column({ length: 10, default: 'SYP' })
  currency: string;

  @Column({ type: 'text' })
  message: string;

  @Column({ type: 'int', nullable: true })
  etaDays: number | null;

  @Column({ type: 'enum', enum: QuoteStatus, default: QuoteStatus.PENDING })
  status: QuoteStatus;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne('ServiceRequest', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'requestId' })
  request: ServiceRequest;

  @ManyToOne('Business', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'businessId' })
  business: Business;
}

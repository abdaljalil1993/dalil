import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index, Unique } from 'typeorm';
import { EmergencyType } from './enums';
import type { Business } from './Business';
import type { City } from './City';

/** Menu items (restaurants), products (shops) or services with prices (salons, clinics, craftsmen). */
@Entity('business_items')
@Index(['section', 'sortOrder'])
export class BusinessItem {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column({ type: 'varchar', length: 36 })
  businessId: string;

  @Column({ length: 100, default: '', comment: 'Section / menu category e.g. "مشاوي", "مشروبات"' })
  section: string;

  @Column({ length: 200 })
  name: string;

  @Column({ nullable: true, length: 200 })
  nameEn: string;

  @Column({ nullable: true, type: 'text' })
  description: string;

  @Column({ type: 'decimal', precision: 14, scale: 2, nullable: true })
  price: string | null;

  @Column({ type: 'decimal', precision: 14, scale: 2, nullable: true })
  oldPrice: string | null;

  @Column({ length: 10, default: 'SYP' })
  currency: string;

  @Column({ nullable: true, length: 40, comment: 'e.g. "للكيلو", "للشخص", "للساعة"' })
  unit: string;

  @Column({ nullable: true, length: 500 })
  image: string;

  @Column({ type: 'int', nullable: true, comment: 'For bookable services' })
  durationMinutes: number | null;

  @Column({ default: true })
  isAvailable: boolean;

  @Column({ default: false })
  isPopular: boolean;

  @Column({ default: 0 })
  sortOrder: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne('Business', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'businessId' })
  business: Business;
}

@Entity('offers')
@Index(['isActive', 'startDate', 'endDate'])
export class Offer {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column({ type: 'varchar', length: 36 })
  businessId: string;

  @Column({ length: 200 })
  title: string;

  @Column({ nullable: true, type: 'text' })
  description: string;

  @Column({ nullable: true, length: 500 })
  image: string;

  @Column({ type: 'int', nullable: true })
  discountPercent: number | null;

  @Column({ type: 'decimal', precision: 14, scale: 2, nullable: true })
  price: string | null;

  @Column({ type: 'decimal', precision: 14, scale: 2, nullable: true })
  oldPrice: string | null;

  @Column({ length: 10, default: 'SYP' })
  currency: string;

  @Column({ nullable: true, length: 40 })
  couponCode: string;

  @Column({ nullable: true, type: 'text' })
  terms: string;

  @Column({ type: 'datetime' })
  startDate: Date;

  @Column({ type: 'datetime' })
  endDate: Date;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: 0 })
  viewCount: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne('Business', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'businessId' })
  business: Business;
}

/** On-duty pharmacies schedule (one row per pharmacy per date). */
@Entity('pharmacy_duties')
@Unique(['date', 'businessId'])
export class PharmacyDuty {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column({ type: 'varchar', length: 36 })
  businessId: string;

  @Column({ type: 'date' })
  date: string;

  @Column({ type: 'time', nullable: true })
  startTime: string | null;

  @Column({ type: 'time', nullable: true })
  endTime: string | null;

  @Column({ nullable: true, length: 255 })
  note: string;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne('Business', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'businessId' })
  business: Business;
}

/** Emergency & public service numbers (cityId null = nationwide). */
@Entity('emergency_contacts')
export class EmergencyContact {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', nullable: true })
  cityId: number | null;

  @Column({ type: 'enum', enum: EmergencyType, default: EmergencyType.OTHER })
  type: EmergencyType;

  @Column({ length: 150 })
  name: string;

  @Column({ nullable: true, length: 150 })
  nameEn: string;

  @Column({ length: 30 })
  phone: string;

  @Column({ nullable: true, length: 30 })
  phone2: string;

  @Column({ nullable: true, length: 255 })
  note: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: 0 })
  sortOrder: number;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne('City', { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'cityId' })
  city: City;
}

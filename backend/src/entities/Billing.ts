import { Entity, PrimaryGeneratedColumn, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { PaymentMethod, PaymentPurpose, PaymentStatus, SubscriptionStatus } from './enums';
import type { Business } from './Business';
import type { User } from './User';

/** Key/value platform settings editable from the admin panel (e.g. billingEnabled). */
@Entity('app_settings')
export class AppSetting {
  @PrimaryColumn({ length: 100 })
  key: string;

  @Column({ type: 'json', nullable: true })
  value: unknown;

  @UpdateDateColumn()
  updatedAt: Date;
}

/**
 * Plan limits. -1 = unlimited, 0 = disabled.
 * Every feature check goes through EntitlementService, so turning billing on only requires
 * flipping the `billingEnabled` setting from the admin panel.
 */
export interface PlanFeatures {
  maxImages: number;
  maxItems: number; // menu / products / services
  maxActiveOffers: number;
  maxActiveListings: number; // real estate / cars / jobs posted by the business
  bookings: boolean;
  quotes: boolean; // receive service requests & send quotes
  advancedStats: boolean;
  verifiedBadge: boolean;
  priorityBoost: number; // ranking boost in lists (0..100)
  featuredDaysPerMonth: number;
  socialLinks: boolean;
  whatsappButton: boolean;
}

@Entity('plans')
export class Plan {
  @PrimaryGeneratedColumn()
  id: number;

  @Index({ unique: true })
  @Column({ length: 40 })
  code: string;

  @Column({ length: 100 })
  name: string;

  @Column({ nullable: true, length: 100 })
  nameEn: string;

  @Column({ nullable: true, type: 'text' })
  description: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  priceMonthly: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  priceYearly: string;

  @Column({ length: 10, default: 'SYP' })
  currency: string;

  @Column({ type: 'json' })
  features: PlanFeatures;

  @Column({ nullable: true, length: 20 })
  color: string;

  @Column({ default: false, comment: 'Plan given to every business when no paid subscription is active' })
  isDefault: boolean;

  @Column({ default: false })
  isRecommended: boolean;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: 0 })
  sortOrder: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('subscriptions')
@Index(['status', 'endDate'])
export class Subscription {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column({ type: 'varchar', length: 36 })
  businessId: string;

  @Column({ type: 'varchar', length: 36, nullable: true })
  userId: string | null;

  @Index()
  @Column()
  planId: number;

  @Column({ type: 'enum', enum: SubscriptionStatus, default: SubscriptionStatus.PENDING })
  status: SubscriptionStatus;

  @Column({ length: 10, default: 'monthly' })
  period: 'monthly' | 'yearly';

  @Column({ type: 'datetime', nullable: true })
  startDate: Date | null;

  @Column({ type: 'datetime', nullable: true })
  endDate: Date | null;

  @Column({ default: false })
  autoRenewReminder: boolean;

  @Column({ nullable: true, type: 'text' })
  note: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne('Business', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'businessId' })
  business: Business;

  @ManyToOne('Plan', { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'planId' })
  plan: Plan;
}

/** Manual payments ledger (Sham Cash / Syriatel Cash / MTN Cash / cash). Confirming a payment activates its subscription. */
@Entity('payments')
@Index(['status', 'createdAt'])
export class Payment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 36, nullable: true })
  userId: string | null;

  @Column({ type: 'varchar', length: 36, nullable: true })
  businessId: string | null;

  @Column({ type: 'int', nullable: true })
  subscriptionId: number | null;

  @Column({ type: 'enum', enum: PaymentPurpose, default: PaymentPurpose.SUBSCRIPTION })
  purpose: PaymentPurpose;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  amount: string;

  @Column({ length: 10, default: 'SYP' })
  currency: string;

  @Column({ type: 'enum', enum: PaymentMethod, default: PaymentMethod.CASH })
  method: PaymentMethod;

  @Column({ nullable: true, length: 150, comment: 'Transaction / receipt number' })
  reference: string;

  @Column({ type: 'enum', enum: PaymentStatus, default: PaymentStatus.PENDING })
  status: PaymentStatus;

  @Column({ nullable: true, type: 'text' })
  note: string;

  @Column({ nullable: true, type: 'text' })
  adminNote: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne('User', { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne('Business', { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'businessId' })
  business: Business;
}

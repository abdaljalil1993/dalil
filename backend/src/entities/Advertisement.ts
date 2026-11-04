import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { AdPlacement, AdStatus } from './enums';
import type { Business } from './Business';
import type { City } from './City';
import type { Category } from './Category';

@Entity('advertisements')
@Index(['status', 'placement', 'startDate', 'endDate'])
export class Advertisement {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 255 })
  title: string;

  @Column({ nullable: true, type: 'text' })
  description: string;

  @Column({ nullable: true, length: 500 })
  imageUrl: string;

  @Column({ nullable: true, length: 500 })
  targetUrl: string;

  @Column({ type: 'enum', enum: AdPlacement })
  placement: AdPlacement;

  @Column({ type: 'enum', enum: AdStatus, default: AdStatus.PENDING })
  status: AdStatus;

  @Column({ type: 'datetime' })
  startDate: Date;

  @Column({ type: 'datetime' })
  endDate: Date;

  @Column({ default: 0 })
  priority: number;

  @Column({ default: 0 })
  clickCount: number;

  @Column({ default: 0 })
  impressionCount: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true, comment: 'Amount paid (manual billing)' })
  price: string | null;

  @Column({ nullable: true, length: 30 })
  contactPhone: string;

  @Column({ nullable: true, type: 'text' })
  adminNote: string;

  @Column({ type: 'int', nullable: true, comment: 'Optional targeting by city' })
  cityId: number | null;

  @Column({ type: 'int', nullable: true, comment: 'Optional targeting by category' })
  categoryId: number | null;

  @Column({ type: 'varchar', length: 36, nullable: true })
  businessId: string | null;

  @Column({ type: 'varchar', length: 36, nullable: true, comment: 'User who requested the ad (owner self-service)' })
  requestedById: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne('Business', { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'businessId' })
  business: Business;

  @ManyToOne('City', { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'cityId' })
  city: City;

  @ManyToOne('Category', { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'categoryId' })
  category: Category;
}

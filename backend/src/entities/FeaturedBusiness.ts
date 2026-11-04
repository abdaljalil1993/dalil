import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { PromotionStatus } from './enums';
import type { Business } from './Business';

/** Paid placement: a featured business appears first in lists & search. */
@Entity('featured_businesses')
@Index(['status', 'startDate', 'endDate'])
export class FeaturedBusiness {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column()
  businessId: string;

  @Column({ type: 'datetime' })
  startDate: Date;

  @Column({ type: 'datetime' })
  endDate: Date;

  @Column({ type: 'enum', enum: PromotionStatus, default: PromotionStatus.PENDING })
  status: PromotionStatus;

  @Column({ default: 0 })
  priority: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  price: string | null;

  @Column({ nullable: true, type: 'text' })
  note: string;

  @Column({ type: 'varchar', length: 36, nullable: true })
  requestedById: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne('Business', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'businessId' })
  business: Business;
}

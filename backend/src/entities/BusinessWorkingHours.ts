import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Index, Unique } from 'typeorm';
import type { Business } from './Business';

/** dayOfWeek: 0 = Sunday ... 6 = Saturday */
@Entity('business_working_hours')
@Unique(['businessId', 'dayOfWeek'])
export class BusinessWorkingHours {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column()
  businessId: string;

  @Column({ type: 'tinyint', unsigned: true })
  dayOfWeek: number;

  @Column({ type: 'time', nullable: true })
  openTime: string | null;

  @Column({ type: 'time', nullable: true })
  closeTime: string | null;

  @Column({ default: false })
  isClosed: boolean;

  @Column({ default: false })
  isOpen24Hours: boolean;

  @ManyToOne('Business', 'workingHours', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'businessId' })
  business: Business;
}

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { AppointmentStatus } from './enums';
import type { User } from './User';
import type { Business } from './Business';
import type { BusinessItem } from './CatalogExtra';

@Entity('appointments')
@Index(['date', 'status'])
export class Appointment {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column({ type: 'varchar', length: 36 })
  businessId: string;

  @Index()
  @Column({ type: 'varchar', length: 36 })
  userId: string;

  @Column({ type: 'int', nullable: true, comment: 'Optional service (business_items)' })
  itemId: number | null;

  @Column({ type: 'date' })
  date: string;

  @Column({ type: 'time', nullable: true })
  time: string | null;

  @Column({ type: 'time', nullable: true })
  endTime: string | null;

  @Column({ default: 1 })
  partySize: number;

  @Column({ nullable: true, length: 30 })
  phone: string;

  @Column({ nullable: true, type: 'text' })
  note: string;

  @Column({ nullable: true, type: 'text' })
  ownerNote: string;

  @Column({ type: 'enum', enum: AppointmentStatus, default: AppointmentStatus.PENDING })
  status: AppointmentStatus;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne('User', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne('Business', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'businessId' })
  business: Business;

  @ManyToOne('BusinessItem', { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'itemId' })
  item: BusinessItem;
}

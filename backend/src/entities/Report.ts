import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { ReportStatus, ReportType } from './enums';
import type { User } from './User';
import type { Business } from './Business';
import type { Review } from './Review';

@Entity('reports')
export class Report {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column()
  reporterId: string;

  @Index()
  @Column()
  businessId: string;

  @Column({ type: 'varchar', length: 36, nullable: true })
  reviewId: string | null;

  @Column({ type: 'enum', enum: ReportType })
  type: ReportType;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'enum', enum: ReportStatus, default: ReportStatus.PENDING })
  status: ReportStatus;

  @Column({ nullable: true, type: 'text' })
  adminNote: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne('User', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'reporterId' })
  reporter: User;

  @ManyToOne('Business', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'businessId' })
  business: Business;

  @ManyToOne('Review', { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'reviewId' })
  review: Review;
}

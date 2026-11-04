import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { ClaimStatus } from './enums';
import type { User } from './User';
import type { Business } from './Business';

/** A user claims ownership of a listing that was added by the admin. */
@Entity('business_claims')
export class BusinessClaim {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column()
  userId: string;

  @Index()
  @Column()
  businessId: string;

  @Column({ type: 'text' })
  message: string;

  @Column({ nullable: true, length: 30 })
  phone: string;

  @Column({ nullable: true, length: 500, comment: 'Proof document URL' })
  proofUrl: string;

  @Column({ type: 'enum', enum: ClaimStatus, default: ClaimStatus.PENDING })
  status: ClaimStatus;

  @Column({ nullable: true, type: 'text' })
  adminNote: string;

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
}

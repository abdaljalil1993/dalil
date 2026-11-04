import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, Index } from 'typeorm';
import { UserRole, UserStatus } from './enums';
import type { Business } from './Business';
import type { Review } from './Review';
import type { Favorite } from './Favorite';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  firstName: string;

  @Column({ length: 100 })
  lastName: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 255, nullable: true, comment: 'Null for phone-only (OTP) accounts' })
  email: string;

  @Column({ select: false })
  password: string;

  @Index()
  @Column({ nullable: true, length: 30 })
  phone: string;

  @Column({ nullable: true, length: 500 })
  avatar: string;

  @Column({ nullable: true, length: 500 })
  bio: string;

  @Column({ nullable: true })
  cityId: number;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.USER })
  role: UserRole;

  @Column({ type: 'enum', enum: UserStatus, default: UserStatus.ACTIVE })
  status: UserStatus;

  @Column({ default: false })
  isEmailVerified: boolean;

  @Column({ default: false })
  isPhoneVerified: boolean;

  @Column({ type: 'varchar', nullable: true, length: 255, select: false })
  passwordResetToken: string | null;

  @Column({ nullable: true, type: 'datetime', select: false })
  passwordResetExpires: Date | null;

  @Column({ nullable: true, type: 'datetime' })
  lastLoginAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany('Business', 'owner')
  businesses: Business[];

  @OneToMany('Review', 'user')
  reviews: Review[];

  @OneToMany('Favorite', 'user')
  favorites: Favorite[];
}

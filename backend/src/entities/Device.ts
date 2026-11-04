import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('otp_codes')
@Index(['phone', 'createdAt'])
export class OtpCode {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 30 })
  phone: string;

  @Column({ length: 128 })
  codeHash: string;

  @Column({ type: 'datetime' })
  expiresAt: Date;

  @Column({ default: 0 })
  attempts: number;

  @Column({ default: false })
  used: boolean;

  @Column({ nullable: true, length: 45 })
  ipAddress: string;

  @CreateDateColumn()
  createdAt: Date;
}

/** FCM tokens for push notifications (mobile). */
@Entity('device_tokens')
export class DeviceToken {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column({ type: 'varchar', length: 36 })
  userId: string;

  @Index({ unique: true })
  @Column({ length: 300 })
  token: string;

  @Column({ length: 20, default: 'android' })
  platform: string;

  @Column({ nullable: true, length: 10 })
  locale: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

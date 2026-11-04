import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import type { Business } from './Business';

@Entity('business_images')
export class BusinessImage {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 500 })
  url: string;

  @Column({ nullable: true, length: 255 })
  publicId: string;

  @Column({ nullable: true, length: 255 })
  caption: string;

  @Column({ default: false })
  isPrimary: boolean;

  @Column({ default: 0 })
  sortOrder: number;

  @Index()
  @Column()
  businessId: string;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne('Business', 'images', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'businessId' })
  business: Business;
}

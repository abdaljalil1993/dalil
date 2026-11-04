import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, Index } from 'typeorm';
import type { SubCategory } from './SubCategory';
import type { Business } from './Business';

@Entity('categories')
export class Category {
  @PrimaryGeneratedColumn()
  id: number;

  @Index({ unique: true })
  @Column({ length: 100 })
  name: string;

  @Column({ nullable: true, length: 100 })
  nameEn: string;

  @Index({ unique: true })
  @Column({ length: 140 })
  slug: string;

  @Column({ nullable: true, type: 'text' })
  description: string;

  @Column({ nullable: true, length: 100, comment: 'Icon key (e.g. MUI icon name) or emoji' })
  icon: string;

  @Column({ nullable: true, length: 20, comment: 'Hex color used for category tiles' })
  color: string;

  @Column({ nullable: true, length: 500 })
  image: string;

  @Column({ nullable: true, type: 'text', comment: 'Comma separated synonyms used by search' })
  keywords: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: 0 })
  sortOrder: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany('SubCategory', 'category')
  subCategories: SubCategory[];

  @OneToMany('Business', 'category')
  businesses: Business[];
}

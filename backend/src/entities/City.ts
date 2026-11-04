import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { decimalTransformer } from './transformers';

@Entity('cities')
export class City {
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

  @Column({ nullable: true, length: 100, comment: 'Governorate / state' })
  state: string;

  @Column({ nullable: true, length: 100 })
  country: string;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true, transformer: decimalTransformer })
  latitude: number | null;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true, transformer: decimalTransformer })
  longitude: number | null;

  @Column({ nullable: true, length: 500 })
  image: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: 0 })
  sortOrder: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity('search_logs')
@Index(['normalizedQuery', 'createdAt'])
export class SearchLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 255 })
  query: string;

  @Column({ length: 255 })
  normalizedQuery: string;

  @Column({ nullable: true })
  userId: string;

  @Column({ nullable: true })
  categoryId: number;

  @Column({ nullable: true })
  cityId: number;

  @Column({ nullable: true, length: 45 })
  ipAddress: string;

  @Column({ default: 0 })
  resultsCount: number;

  @CreateDateColumn()
  createdAt: Date;
}

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index, Unique } from 'typeorm';
import type { User } from './User';
import type { Business } from './Business';

@Entity('reviews')
@Unique(['userId', 'businessId'])
@Index(['businessId', 'createdAt'])
export class Review {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column()
  userId: string;

  @Index()
  @Column()
  businessId: string;

  @Column({ type: 'tinyint', unsigned: true, comment: '1 to 5' })
  rating: number;

  @Column({ type: 'text', nullable: true })
  content: string | null;

  @Column({ nullable: true, type: 'text' })
  ownerReply: string | null;

  @Column({ nullable: true, type: 'datetime' })
  ownerRepliedAt: Date | null;

  @Column({ default: 0 })
  likesCount: number;

  @Column({ default: false })
  isHidden: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne('User', 'reviews', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne('Business', 'reviews', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'businessId' })
  business: Business;
}

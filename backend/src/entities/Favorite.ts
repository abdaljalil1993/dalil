import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Unique, Index } from 'typeorm';
import type { User } from './User';
import type { Business } from './Business';

@Entity('favorites')
@Unique(['userId', 'businessId'])
export class Favorite {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column()
  userId: string;

  @Index()
  @Column()
  businessId: string;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne('User', 'favorites', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne('Business', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'businessId' })
  business: Business;
}

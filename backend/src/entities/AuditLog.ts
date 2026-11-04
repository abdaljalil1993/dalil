import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity('audit_logs')
@Index(['userId', 'createdAt'])
@Index(['action', 'createdAt'])
export class AuditLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  userId: string;

  @Column({ length: 100 })
  action: string;

  @Column({ nullable: true, length: 50 })
  entityType: string;

  @Column({ nullable: true, length: 255 })
  entityId: string;

  @Column({ nullable: true, type: 'json' })
  payload: Record<string, unknown> | null;

  @Column({ nullable: true })
  statusCode: number;

  @Column({ nullable: true, length: 45 })
  ipAddress: string;

  @Column({ nullable: true, length: 500 })
  userAgent: string;

  @CreateDateColumn()
  createdAt: Date;
}

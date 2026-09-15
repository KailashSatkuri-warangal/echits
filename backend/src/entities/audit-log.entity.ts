import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { AuditAction } from '../common/enums';
import { User } from './user.entity';

@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'actor_id' })
  actor: User;

  @Column({ name: 'actor_id', type: 'uuid', nullable: true })
  actorId: string;

  @Index()
  @Column({ type: 'varchar', length: 50 })
  action: AuditAction;

  @Index()
  @Column({ type: 'varchar', length: 50 })
  entityName: string;

  @Index()
  @Column({ type: 'varchar', length: 100, nullable: true })
  entityId: string;

  @Column({ type: 'text', nullable: true })
  beforeStateJson: string;

  @Column({ type: 'text', nullable: true })
  afterStateJson: string;

  @Column({ type: 'text', nullable: true })
  reason: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  ipAddress: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  userAgent: string;

  @CreateDateColumn()
  createdAt: Date;
}

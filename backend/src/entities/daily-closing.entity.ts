import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { DailyClosingStatus } from '../common/enums';
import { User } from './user.entity';

@Entity('daily_closings')
export class DailyClosing {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'varchar', length: 20 })
  closingDate: string;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'opened_by' })
  openedByUser: User;

  @Column({ name: 'opened_by', type: 'uuid' })
  openedBy: string;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'closed_by' })
  closedByUser: User;

  @Column({ name: 'closed_by', type: 'uuid', nullable: true })
  closedBy: string;

  @Column({ type: 'numeric', precision: 12, scale: 2, default: 0.00 })
  openingCash: number;

  @Column({ type: 'numeric', precision: 12, scale: 2, default: 0.00 })
  cashCollected: number;

  @Column({ type: 'numeric', precision: 12, scale: 2, default: 0.00 })
  upiCollected: number;

  @Column({ type: 'numeric', precision: 12, scale: 2, default: 0.00 })
  bankCollected: number;

  @Column({ type: 'numeric', precision: 12, scale: 2, default: 0.00 })
  chequeCollected: number;

  @Column({ type: 'numeric', precision: 12, scale: 2, default: 0.00 })
  otherCollected: number;

  @Column({ type: 'numeric', precision: 12, scale: 2, default: 0.00 })
  refunds: number;

  @Column({ type: 'numeric', precision: 12, scale: 2, default: 0.00 })
  expectedClosing: number;

  @Column({ type: 'numeric', precision: 12, scale: 2, default: 0.00 })
  actualClosing: number;

  @Column({ type: 'numeric', precision: 12, scale: 2, default: 0.00 })
  difference: number;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'varchar', length: 30, default: DailyClosingStatus.OPEN })
  status: DailyClosingStatus;

  @Column({ type: 'datetime', nullable: true })
  closedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

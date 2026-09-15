import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { AdjustmentType } from '../common/enums';
import { MonthlyDue } from './monthly-due.entity';
import { User } from './user.entity';

@Entity('adjustments')
export class Adjustment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => MonthlyDue, (due) => due.adjustments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'monthly_due_id' })
  monthlyDue: MonthlyDue;

  @Column({ name: 'monthly_due_id', type: 'uuid' })
  monthlyDueId: string;

  @Column({ type: 'varchar', length: 50, default: AdjustmentType.WAIVER })
  adjustmentType: AdjustmentType;

  @Column({ type: 'numeric', precision: 12, scale: 2 })
  amount: number;

  @Column({ type: 'text' })
  reason: string;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'authorized_by' })
  authorizedByUser: User;

  @Column({ name: 'authorized_by', type: 'uuid' })
  authorizedBy: string;

  @CreateDateColumn()
  createdAt: Date;
}

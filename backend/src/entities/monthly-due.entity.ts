import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn, Index, Unique, VersionColumn } from 'typeorm';
import { DueStatus } from '../common/enums';
import { ChitMembership } from './chit-membership.entity';
import { ChitMonth } from './chit-month.entity';
import { PaymentAllocation } from './payment-allocation.entity';
import { Adjustment } from './adjustment.entity';

@Entity('monthly_dues')
@Unique(['membership', 'chitMonth'])
export class MonthlyDue {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => ChitMembership, (membership) => membership.dues, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'membership_id' })
  membership: ChitMembership;

  @Column({ name: 'membership_id', type: 'uuid' })
  membershipId: string;

  @ManyToOne(() => ChitMonth, (month) => month.dues, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'chit_month_id' })
  chitMonth: ChitMonth;

  @Column({ name: 'chit_month_id', type: 'uuid' })
  chitMonthId: string;

  @Column({ type: 'numeric', precision: 12, scale: 2, default: 0.00 })
  scheduledDue: number;

  @Column({ type: 'numeric', precision: 12, scale: 2, default: 0.00 })
  previousBalance: number;

  @Column({ type: 'numeric', precision: 12, scale: 2, default: 0.00 })
  interestBase: number;

  @Column({ type: 'numeric', precision: 5, scale: 2, default: 0.00 })
  interestRate: number;

  @Column({ type: 'numeric', precision: 12, scale: 2, default: 0.00 })
  interestAmount: number;

  @Column({ type: 'numeric', precision: 12, scale: 2, default: 0.00 })
  lateFee: number;

  @Column({ type: 'numeric', precision: 12, scale: 2, default: 0.00 })
  adjustmentAmount: number;

  @Column({ type: 'numeric', precision: 12, scale: 2, default: 0.00 })
  totalDue: number;

  @Column({ type: 'numeric', precision: 12, scale: 2, default: 0.00 })
  totalPaid: number;

  @Column({ type: 'numeric', precision: 12, scale: 2, default: 0.00 })
  balanceDue: number;

  @Index()
  @Column({ type: 'varchar', length: 30, default: DueStatus.PENDING })
  status: DueStatus;

  @OneToMany(() => PaymentAllocation, (alloc) => alloc.monthlyDue)
  allocations: PaymentAllocation[];

  @OneToMany(() => Adjustment, (adj) => adj.monthlyDue)
  adjustments: Adjustment[];

  @VersionColumn()
  version: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

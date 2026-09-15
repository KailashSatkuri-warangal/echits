import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { LiftApprovalStatus } from '../common/enums';
import { ChitMembership } from './chit-membership.entity';
import { ChitMonth } from './chit-month.entity';
import { User } from './user.entity';

@Entity('lift_events')
export class LiftEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => ChitMembership, (membership) => membership.liftEvents, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'membership_id' })
  membership: ChitMembership;

  @Column({ name: 'membership_id', type: 'uuid' })
  membershipId: string;

  @ManyToOne(() => ChitMonth, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'chit_month_id' })
  chitMonth: ChitMonth;

  @Column({ name: 'chit_month_id', type: 'uuid' })
  chitMonthId: string;

  @Column({ type: 'varchar', length: 20 })
  liftDate: string;

  @Column({ type: 'numeric', precision: 12, scale: 2 })
  chitValue: number;

  @Column({ type: 'numeric', precision: 12, scale: 2 })
  bidDiscount: number;

  @Column({ type: 'numeric', precision: 12, scale: 2, default: 0.00 })
  companyCommission: number;

  @Column({ type: 'numeric', precision: 12, scale: 2, default: 0.00 })
  dividendAmount: number;

  @Column({ type: 'numeric', precision: 12, scale: 2, default: 0.00 })
  dividendPerMember: number;

  @Column({ type: 'numeric', precision: 12, scale: 2 })
  amountReleased: number;

  @Column({ type: 'numeric', precision: 12, scale: 2 })
  previousInstallment: number;

  @Column({ type: 'numeric', precision: 12, scale: 2 })
  newInstallment: number;

  @Column({ type: 'int' })
  effectiveMonthSequence: number;

  @Column({ type: 'varchar', length: 30, default: LiftApprovalStatus.APPROVED })
  approvalStatus: LiftApprovalStatus;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'approved_by' })
  approvedByUser: User;

  @Column({ name: 'approved_by', type: 'uuid', nullable: true })
  approvedBy: string;

  @Column({ type: 'text', nullable: true })
  remarks: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

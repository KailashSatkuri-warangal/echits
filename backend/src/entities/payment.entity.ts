import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, OneToOne, JoinColumn, Index } from 'typeorm';
import { PaymentMode } from '../common/enums';
import { Member } from './member.entity';
import { Chit } from './chit.entity';
import { User } from './user.entity';
import { PaymentAllocation } from './payment-allocation.entity';
import { PaymentReversal } from './payment-reversal.entity';

@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 50, unique: true })
  receiptNumber: string;

  @ManyToOne(() => Member, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'member_id' })
  member: Member;

  @Column({ name: 'member_id', type: 'uuid' })
  memberId: string;

  @ManyToOne(() => Chit, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'chit_id' })
  chit: Chit;

  @Column({ name: 'chit_id', type: 'uuid', nullable: true })
  chitId: string;

  @Column({ type: 'numeric', precision: 12, scale: 2 })
  totalAmount: number;

  @Column({ type: 'numeric', precision: 12, scale: 2, default: 0.00 })
  allocatedAmount: number;

  @Column({ type: 'numeric', precision: 12, scale: 2, default: 0.00 })
  advanceAmount: number;

  @Column({ type: 'varchar', length: 30, default: PaymentMode.CASH })
  paymentMode: PaymentMode;

  @Column({ type: 'varchar', length: 100, nullable: true })
  referenceNumber: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'collected_by' })
  collectedByUser: User;

  @Column({ name: 'collected_by', type: 'uuid' })
  collectedBy: string;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  collectedAt: Date;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 100, unique: true })
  idempotencyKey: string;

  @Column({ type: 'boolean', default: false })
  isReversed: boolean;

  @OneToMany(() => PaymentAllocation, (alloc) => alloc.payment)
  allocations: PaymentAllocation[];

  @OneToOne(() => PaymentReversal, (rev) => rev.payment, { nullable: true })
  reversal: PaymentReversal;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Payment } from './payment.entity';
import { MonthlyDue } from './monthly-due.entity';

@Entity('payment_allocations')
export class PaymentAllocation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Payment, (payment) => payment.allocations, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'payment_id' })
  payment: Payment;

  @Column({ name: 'payment_id', type: 'uuid' })
  paymentId: string;

  @ManyToOne(() => MonthlyDue, (due) => due.allocations, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'monthly_due_id' })
  monthlyDue: MonthlyDue;

  @Column({ name: 'monthly_due_id', type: 'uuid' })
  monthlyDueId: string;

  @Column({ type: 'numeric', precision: 12, scale: 2, default: 0.00 })
  interestAllocated: number;

  @Column({ type: 'numeric', precision: 12, scale: 2, default: 0.00 })
  feeAllocated: number;

  @Column({ type: 'numeric', precision: 12, scale: 2, default: 0.00 })
  principalAllocated: number;

  @Column({ type: 'numeric', precision: 12, scale: 2 })
  totalAllocated: number;

  @CreateDateColumn()
  createdAt: Date;
}

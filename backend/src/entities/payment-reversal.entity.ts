import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToOne, ManyToOne, JoinColumn } from 'typeorm';
import { Payment } from './payment.entity';
import { User } from './user.entity';

@Entity('payment_reversals')
export class PaymentReversal {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => Payment, (payment) => payment.reversal, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'payment_id' })
  payment: Payment;

  @Column({ name: 'payment_id', type: 'uuid', unique: true })
  paymentId: string;

  @Column({ type: 'text' })
  reason: string;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'reversed_by' })
  reversedByUser: User;

  @Column({ name: 'reversed_by', type: 'uuid' })
  reversedBy: string;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  reversedAt: Date;

  @Column({ type: 'text', nullable: true })
  restoredAllocationsJson: string;

  @CreateDateColumn()
  createdAt: Date;
}

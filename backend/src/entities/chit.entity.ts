import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, Index } from 'typeorm';
import { ChitStatus } from '../common/enums';
import { ChitMembership } from './chit-membership.entity';
import { ChitMonth } from './chit-month.entity';

@Entity('chits')
export class Chit {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 50, unique: true })
  chitCode: string;

  @Column({ type: 'varchar', length: 150 })
  chitName: string;

  @Column({ type: 'numeric', precision: 12, scale: 2 })
  totalValue: number;

  @Column({ type: 'int' })
  capacity: number;

  @Column({ type: 'int' })
  durationMonths: number;

  @Column({ type: 'int' })
  startMonth: number;

  @Column({ type: 'int' })
  startYear: number;

  @Column({ type: 'int' })
  endMonth: number;

  @Column({ type: 'int' })
  endYear: number;

  @Column({ type: 'numeric', precision: 12, scale: 2 })
  defaultInstallment: number;

  @Column({ type: 'int', default: 10 })
  dueDay: number;

  @Column({ type: 'int', default: 5 })
  gracePeriodDays: number;

  @Column({ type: 'numeric', precision: 5, scale: 2, default: 2.00 })
  defaultInterestRate: number;

  @Column({ type: 'numeric', precision: 12, scale: 2, default: 0.00 })
  lateFee: number;

  @Column({ type: 'varchar', length: 30, default: ChitStatus.ACTIVE })
  status: ChitStatus;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @OneToMany(() => ChitMembership, (membership) => membership.chit)
  memberships: ChitMembership[];

  @OneToMany(() => ChitMonth, (month) => month.chit)
  months: ChitMonth[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

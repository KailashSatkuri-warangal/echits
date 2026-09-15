import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn, Unique } from 'typeorm';
import { ChitMonthStatus } from '../common/enums';
import { Chit } from './chit.entity';
import { MonthlyDue } from './monthly-due.entity';

@Entity('chit_months')
@Unique(['chit', 'monthSequence'])
export class ChitMonth {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Chit, (chit) => chit.months, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'chit_id' })
  chit: Chit;

  @Column({ name: 'chit_id', type: 'uuid' })
  chitId: string;

  @Column({ type: 'int' })
  monthSequence: number;

  @Column({ type: 'int' })
  calendarMonth: number;

  @Column({ type: 'int' })
  calendarYear: number;

  @Column({ type: 'varchar', length: 20 })
  dueDate: string;

  @Column({ type: 'varchar', length: 20 })
  graceDate: string;

  @Column({ type: 'numeric', precision: 5, scale: 2, nullable: true })
  interestRateOverride: number;

  @Column({ type: 'numeric', precision: 12, scale: 2, nullable: true })
  dividendPerMember: number;

  @Column({ type: 'varchar', length: 20, nullable: true })
  auctionDate: string;

  @Column({ type: 'varchar', length: 30, default: ChitMonthStatus.OPEN })
  status: ChitMonthStatus;

  @OneToMany(() => MonthlyDue, (due) => due.chitMonth)
  dues: MonthlyDue[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn, Unique } from 'typeorm';
import { MembershipStatus } from '../common/enums';
import { Member } from './member.entity';
import { Chit } from './chit.entity';
import { MonthlyDue } from './monthly-due.entity';
import { LiftEvent } from './lift-event.entity';

@Entity('chit_memberships')
@Unique(['chit', 'seatNumber'])
@Unique(['chit', 'member'])
export class ChitMembership {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Chit, (chit) => chit.memberships, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'chit_id' })
  chit: Chit;

  @Column({ name: 'chit_id', type: 'uuid' })
  chitId: string;

  @ManyToOne(() => Member, (member) => member.memberships, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'member_id' })
  member: Member;

  @Column({ name: 'member_id', type: 'uuid' })
  memberId: string;

  @Column({ type: 'int' })
  seatNumber: number;

  @Column({ type: 'varchar', length: 20 })
  joiningDate: string;

  @Column({ type: 'numeric', precision: 12, scale: 2, nullable: true })
  customInstallment: number;

  @Column({ type: 'numeric', precision: 12, scale: 2, default: 0.00 })
  openingBalance: number;

  @Column({ type: 'varchar', length: 30, default: MembershipStatus.ACTIVE })
  status: MembershipStatus;

  @OneToMany(() => MonthlyDue, (due) => due.membership)
  dues: MonthlyDue[];

  @OneToMany(() => LiftEvent, (lift) => lift.membership)
  liftEvents: LiftEvent[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

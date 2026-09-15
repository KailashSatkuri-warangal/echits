import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { Member } from './member.entity';
import { Chit } from './chit.entity';

@Entity('member_advances')
@Unique(['member', 'chit'])
export class MemberAdvance {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Member, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'member_id' })
  member: Member;

  @Column({ name: 'member_id', type: 'uuid' })
  memberId: string;

  @ManyToOne(() => Chit, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'chit_id' })
  chit: Chit;

  @Column({ name: 'chit_id', type: 'uuid', nullable: true })
  chitId: string;

  @Column({ type: 'numeric', precision: 12, scale: 2, default: 0.00 })
  creditBalance: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

import { Injectable, OnApplicationBootstrap, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import * as entities from '../entities';
import {
  Role,
  ChitStatus,
  MembershipStatus,
  ChitMonthStatus,
  DueStatus,
  PaymentMode,
  LiftApprovalStatus,
  DailyClosingStatus,
  AuditAction,
} from '../common/enums';
import { CurrencyUtil } from '../common/utils/currency.util';

@Injectable()
export class SeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger(SeedService.name);

  constructor(private dataSource: DataSource) {}

  async onApplicationBootstrap() {
    try {
      await this.ensureSeedData();
    } catch (err) {
      this.logger.error('Error during startup database initialization:', err);
    }
  }

  async ensureSeedData() {
    const userRepo = this.dataSource.getRepository(entities.User);
    const memberRepo = this.dataSource.getRepository(entities.Member);
    const chitRepo = this.dataSource.getRepository(entities.Chit);
    const monthRepo = this.dataSource.getRepository(entities.ChitMonth);
    const membershipRepo = this.dataSource.getRepository(entities.ChitMembership);
    const dueRepo = this.dataSource.getRepository(entities.MonthlyDue);
    const paymentRepo = this.dataSource.getRepository(entities.Payment);
    const allocRepo = this.dataSource.getRepository(entities.PaymentAllocation);
    const liftRepo = this.dataSource.getRepository(entities.LiftEvent);
    const closingRepo = this.dataSource.getRepository(entities.DailyClosing);
    const auditRepo = this.dataSource.getRepository(entities.AuditLog);
    const settingRepo = this.dataSource.getRepository(entities.BusinessSetting);

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('Admin@123', salt);

    // 1. Ensure all Staff & Admin Users exist with valid Admin@123 password
    const defaultUsers = [
      { name: 'Super Admin', email: 'superadmin@sudhakarchits.com', phone: '9900000001', role: Role.SUPER_ADMIN },
      { name: 'Branch Operations Admin', email: 'admin@sudhakarchits.com', phone: '9900000002', role: Role.ADMIN },
      { name: 'Ramesh Collector', email: 'collector@sudhakarchits.com', phone: '9900000003', role: Role.COLLECTION_STAFF },
      { name: 'Pooja Accountant', email: 'accountant@sudhakarchits.com', phone: '9900000004', role: Role.ACCOUNTANT },
      { name: 'Super Admin', email: 'superadmin@echits.com', phone: '9900000011', role: Role.SUPER_ADMIN },
      { name: 'Branch Admin', email: 'admin@echits.com', phone: '9900000012', role: Role.ADMIN },
      { name: 'Collector Staff', email: 'collector@echits.com', phone: '9900000013', role: Role.COLLECTION_STAFF },
      { name: 'Accountant', email: 'accountant@echits.com', phone: '9900000014', role: Role.ACCOUNTANT },
    ];

    for (const u of defaultUsers) {
      let existingByEmail = await userRepo.findOne({
        where: { email: u.email.toLowerCase() },
      });

      if (existingByEmail) {
        existingByEmail.name = u.name;
        existingByEmail.passwordHash = passwordHash;
        existingByEmail.isActive = true;
        existingByEmail.role = u.role;
        existingByEmail.phone = u.phone;
        await userRepo.save(existingByEmail).catch(async () => {
          // If phone conflict, resolve by assigning unique phone
          existingByEmail.phone = `${u.phone}0`;
          await userRepo.save(existingByEmail);
        });
        this.logger.log(`Updated user: ${u.email}`);
      } else {
        // Check if another user holds this phone
        const existingByPhone = await userRepo.findOne({ where: { phone: u.phone } });
        if (existingByPhone) {
          existingByPhone.phone = `${existingByPhone.phone}9`;
          await userRepo.save(existingByPhone);
        }

        const newUser = userRepo.create({
          name: u.name,
          email: u.email.toLowerCase(),
          phone: u.phone,
          passwordHash,
          role: u.role,
          isActive: true,
        });
        await userRepo.save(newUser);
        this.logger.log(`Created user: ${u.email}`);
      }
    }

    // 2. Ensure Settings exist
    const companySetting = await settingRepo.findOne({ where: { key: 'COMPANY_NAME' } });
    if (!companySetting) {
      await settingRepo.save([
        settingRepo.create({
          key: 'COMPANY_NAME',
          value: 'Sudhakar Chits (India) Pvt Ltd',
          description: 'Official organization name',
          group: 'SYSTEM',
        }),
        settingRepo.create({
          key: 'DEFAULT_INTEREST_RATE',
          value: '2.0',
          description: 'Default monthly interest % on overdue balances',
          group: 'FINANCIAL',
        }),
        settingRepo.create({
          key: 'DEFAULT_GRACE_PERIOD_DAYS',
          value: '5',
          description: 'Grace period before late fee & interest accrual',
          group: 'FINANCIAL',
        }),
      ]);
    }

    // 3. Ensure Chits and Members exist
    const chitCount = await chitRepo.count();
    if (chitCount === 0) {
      this.logger.log('Seeding initial schemes, members, and monthly dues...');

      const adminUser = await userRepo.findOneOrFail({ where: { email: 'admin@sudhakarchits.com' } });
      const collectorUser = await userRepo.findOneOrFail({ where: { email: 'collector@sudhakarchits.com' } });

      // Chits
      const chit1 = await chitRepo.save(
        chitRepo.create({
          chitCode: 'CHIT-5L-20M',
          chitName: '5 Lakhs Gold 20M Scheme',
          totalValue: 500000,
          capacity: 20,
          durationMonths: 20,
          startMonth: 8,
          startYear: 2026,
          endMonth: 3,
          endYear: 2028,
          defaultInstallment: 25000,
          dueDay: 10,
          gracePeriodDays: 5,
          defaultInterestRate: 2.0,
          lateFee: 100,
          status: ChitStatus.ACTIVE,
          notes: 'Premier 20-month monthly chit group',
        }),
      );

      const chit2 = await chitRepo.save(
        chitRepo.create({
          chitCode: 'CHIT-10L-20M',
          chitName: '10 Lakhs Diamond 20M Scheme',
          totalValue: 1000000,
          capacity: 20,
          durationMonths: 20,
          startMonth: 8,
          startYear: 2026,
          endMonth: 3,
          endYear: 2028,
          defaultInstallment: 50000,
          dueDay: 10,
          gracePeriodDays: 5,
          defaultInterestRate: 2.0,
          lateFee: 200,
          status: ChitStatus.ACTIVE,
        }),
      );

      const chit3 = await chitRepo.save(
        chitRepo.create({
          chitCode: 'CHIT-2L-10M',
          chitName: '2 Lakhs Silver 10M Scheme',
          totalValue: 200000,
          capacity: 10,
          durationMonths: 10,
          startMonth: 8,
          startYear: 2026,
          endMonth: 5,
          endYear: 2027,
          defaultInstallment: 20000,
          dueDay: 15,
          gracePeriodDays: 5,
          defaultInterestRate: 2.0,
          lateFee: 50,
          status: ChitStatus.ACTIVE,
        }),
      );

      const generateMonths = async (chit: entities.Chit) => {
        const months: entities.ChitMonth[] = [];
        let curM = chit.startMonth;
        let curY = chit.startYear;

        for (let seq = 1; seq <= chit.durationMonths; seq++) {
          const dueDate = `${curY}-${String(curM).padStart(2, '0')}-${String(chit.dueDay).padStart(2, '0')}`;
          const graceDay = Math.min(28, chit.dueDay + chit.gracePeriodDays);
          const graceDate = `${curY}-${String(curM).padStart(2, '0')}-${String(graceDay).padStart(2, '0')}`;

          const m = monthRepo.create({
            chitId: chit.id,
            monthSequence: seq,
            calendarMonth: curM,
            calendarYear: curY,
            dueDate,
            graceDate,
            status: seq === 1 ? ChitMonthStatus.OPEN : ChitMonthStatus.PENDING,
          });

          months.push(m);
          curM++;
          if (curM > 12) {
            curM = 1;
            curY++;
          }
        }
        return monthRepo.save(months);
      };

      const chit1Months = await generateMonths(chit1);
      const chit2Months = await generateMonths(chit2);
      const chit3Months = await generateMonths(chit3);

      // Members
      const ravi = await memberRepo.save(
        memberRepo.create({
          memberCode: 'MEM-1001',
          fullName: 'Ravi Kumar',
          phone: '9845012345',
          altPhone: '9845012346',
          email: 'ravi.kumar@example.com',
          address: '#45, 2nd Main, Indiranagar, Bengaluru - 560038',
          idProofType: 'AADHAAR',
          idProofNumber: '9876-5432-1098',
          status: 'ACTIVE',
          notes: 'Multi-chit premium member',
        }),
      );

      const priya = await memberRepo.save(
        memberRepo.create({
          memberCode: 'MEM-1002',
          fullName: 'Priya Sharma',
          phone: '9845098765',
          email: 'priya.sharma@example.com',
          address: '#12, Koramangala 4th Block, Bengaluru - 560034',
          idProofType: 'PAN',
          idProofNumber: 'ABCPS1234K',
          status: 'ACTIVE',
        }),
      );

      const ramesh = await memberRepo.save(
        memberRepo.create({
          memberCode: 'MEM-1003',
          fullName: 'Ramesh Patel',
          phone: '9845055555',
          email: 'ramesh.patel@example.com',
          address: '#88, Jayanagar 7th Block, Bengaluru - 560070',
          idProofType: 'AADHAAR',
          idProofNumber: '5555-4444-3333',
          status: 'ACTIVE',
        }),
      );

      const ananya = await memberRepo.save(
        memberRepo.create({
          memberCode: 'MEM-1004',
          fullName: 'Ananya Deshmukh',
          phone: '9845077777',
          email: 'ananya.d@example.com',
          address: '#24, Malleshwaram, Bengaluru - 560003',
          idProofType: 'PASSPORT',
          idProofNumber: 'N1234567',
          status: 'ACTIVE',
        }),
      );

      const karthik = await memberRepo.save(
        memberRepo.create({
          memberCode: 'MEM-1005',
          fullName: 'Karthik Sundaram',
          phone: '9845088888',
          email: 'karthik.s@example.com',
          address: '#56, HSR Layout Sector 2, Bengaluru - 560102',
          idProofType: 'VOTER_ID',
          idProofNumber: 'KA12345678',
          status: 'ACTIVE',
        }),
      );

      const createMembershipWithDues = async (
        chit: entities.Chit,
        months: entities.ChitMonth[],
        member: entities.Member,
        seatNumber: number,
        customInstallment?: number,
      ) => {
        const ms = await membershipRepo.save(
          membershipRepo.create({
            chitId: chit.id,
            memberId: member.id,
            seatNumber,
            joiningDate: `${chit.startYear}-08-01`,
            customInstallment: customInstallment || null,
            openingBalance: 0,
            status: MembershipStatus.ACTIVE,
          }),
        );

        const inst = customInstallment || chit.defaultInstallment;
        const dues: entities.MonthlyDue[] = [];

        for (let i = 0; i < months.length; i++) {
          const month = months[i];
          const due = dueRepo.create({
            membershipId: ms.id,
            chitMonthId: month.id,
            scheduledDue: inst,
            previousBalance: 0,
            interestBase: 0,
            interestRate: chit.defaultInterestRate,
            interestAmount: 0,
            lateFee: 0,
            adjustmentAmount: 0,
            totalDue: inst,
            totalPaid: 0,
            balanceDue: inst,
            status: DueStatus.PENDING,
            version: 1,
          });
          dues.push(due);
        }

        await dueRepo.save(dues);
        return ms;
      };

      const raviMs1 = await createMembershipWithDues(chit1, chit1Months, ravi, 1, 25000);
      const raviMs2 = await createMembershipWithDues(chit2, chit2Months, ravi, 1, 50000);
      const raviMs3 = await createMembershipWithDues(chit3, chit3Months, ravi, 1, 20000);
      const priyaMs1 = await createMembershipWithDues(chit1, chit1Months, priya, 2, 25000);
      const rameshMs1 = await createMembershipWithDues(chit1, chit1Months, ramesh, 3, 25000);
      await createMembershipWithDues(chit3, chit3Months, ramesh, 2, 20000);
      const ananyaMs1 = await createMembershipWithDues(chit1, chit1Months, ananya, 4, 25000);
      await createMembershipWithDues(chit2, chit2Months, karthik, 2, 50000);

      const recordPaymentHelper = async (
        member: entities.Member,
        chit: entities.Chit,
        due: entities.MonthlyDue,
        amount: number,
        mode: PaymentMode,
        notes: string,
        key: string,
      ) => {
        const receiptNumber = `REC-${new Date().getFullYear()}09-${String(Math.floor(Math.random() * 9000) + 1000)}`;
        const payment = await paymentRepo.save(
          paymentRepo.create({
            receiptNumber,
            memberId: member.id,
            chitId: chit.id,
            totalAmount: amount,
            allocatedAmount: amount,
            advanceAmount: 0,
            paymentMode: mode,
            referenceNumber: mode === PaymentMode.UPI ? `UPI-${Math.floor(Math.random() * 899999 + 100000)}` : null,
            notes,
            collectedBy: collectorUser.id,
            collectedAt: new Date(),
            idempotencyKey: key,
            isReversed: false,
          }),
        );

        await allocRepo.save(
          allocRepo.create({
            paymentId: payment.id,
            monthlyDueId: due.id,
            interestAllocated: 0,
            feeAllocated: 0,
            principalAllocated: amount,
            totalAllocated: amount,
          }),
        );

        due.totalPaid = CurrencyUtil.add(due.totalPaid, amount);
        due.balanceDue = CurrencyUtil.round(Math.max(0, due.totalDue - due.totalPaid));
        due.status = due.balanceDue === 0 ? DueStatus.PAID : DueStatus.PART_PAID;
        await dueRepo.save(due);
        return payment;
      };

      const raviDue1 = await dueRepo.findOneOrFail({ where: { membershipId: raviMs1.id, chitMonthId: chit1Months[0].id } });
      await recordPaymentHelper(ravi, chit1, raviDue1, 15000, PaymentMode.UPI, 'Partial payment by Ravi', 'key-ravi-c1-m1');

      const raviDue2 = await dueRepo.findOneOrFail({ where: { membershipId: raviMs2.id, chitMonthId: chit2Months[0].id } });
      await recordPaymentHelper(ravi, chit2, raviDue2, 42500, PaymentMode.BANK_TRANSFER, 'Partial payment by Ravi', 'key-ravi-c2-m1');

      const raviDue3 = await dueRepo.findOneOrFail({ where: { membershipId: raviMs3.id, chitMonthId: chit3Months[0].id } });
      await recordPaymentHelper(ravi, chit3, raviDue3, 15000, PaymentMode.CASH, 'Partial payment by Ravi', 'key-ravi-c3-m1');

      const priyaDue1 = await dueRepo.findOneOrFail({ where: { membershipId: priyaMs1.id, chitMonthId: chit1Months[0].id } });
      await recordPaymentHelper(priya, chit1, priyaDue1, 25000, PaymentMode.UPI, 'Full Month 1 payment', 'key-priya-c1-m1');

      const ananyaDue1 = await dueRepo.findOneOrFail({ where: { membershipId: ananyaMs1.id, chitMonthId: chit1Months[0].id } });
      await recordPaymentHelper(ananya, chit1, ananyaDue1, 25000, PaymentMode.UPI, 'Full Month 1 payment', 'key-ananya-c1-m1');

      // Lift Event
      const liftEvent = await liftRepo.save(
        liftRepo.create({
          membershipId: priyaMs1.id,
          chitMonthId: chit1Months[1].id,
          liftDate: '2026-09-10',
          chitValue: 500000,
          bidDiscount: 75000,
          companyCommission: 25000,
          dividendAmount: 50000,
          dividendPerMember: 2500,
          amountReleased: 425000,
          previousInstallment: 25000,
          newInstallment: 25000,
          effectiveMonthSequence: 2,
          approvalStatus: LiftApprovalStatus.APPROVED,
          approvedBy: adminUser.id,
          remarks: 'Auction won at ₹75,000 discount. Net released: ₹4,25,000. Dividend ₹2,500/member.',
        }),
      );

      priyaMs1.status = MembershipStatus.LIFTED;
      await membershipRepo.save(priyaMs1);

      chit1Months[1].dividendPerMember = 2500;
      chit1Months[1].auctionDate = '2026-09-10';
      await monthRepo.save(chit1Months[1]);

      const todayStr = new Date().toISOString().slice(0, 10);
      await closingRepo.save(
        closingRepo.create({
          closingDate: todayStr,
          openedBy: collectorUser.id,
          openingCash: 5000,
          cashCollected: 15000,
          upiCollected: 82500,
          bankCollected: 42500,
          chequeCollected: 0,
          otherCollected: 0,
          refunds: 0,
          expectedClosing: 20000,
          actualClosing: 20000,
          difference: 0,
          status: DailyClosingStatus.OPEN,
        }),
      );

      await auditRepo.save([
        auditRepo.create({
          actorId: adminUser.id,
          action: AuditAction.CREATE,
          entityName: 'Chit',
          entityId: chit1.id,
          reason: 'Initialized CHIT-5L-20M scheme',
        }),
        auditRepo.create({
          actorId: collectorUser.id,
          action: AuditAction.PAYMENT_RECORDED,
          entityName: 'Payment',
          reason: 'Recorded ₹15,000 payment from Ravi Kumar',
        }),
        auditRepo.create({
          actorId: adminUser.id,
          action: AuditAction.LIFT_CONFIRMED,
          entityName: 'LiftEvent',
          entityId: liftEvent.id,
          reason: 'Confirmed lift for Priya Sharma (CHIT-5L-20M)',
        }),
      ]);

      this.logger.log('Startup database initialization and seeding completed successfully!');
    }
  }
}

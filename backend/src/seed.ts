import { DataSource } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import * as entities from './entities';
import { Role, ChitStatus, MembershipStatus, ChitMonthStatus, DueStatus, PaymentMode, LiftApprovalStatus, DailyClosingStatus, AuditAction, NotificationCategory } from './common/enums';
import { CurrencyUtil } from './common/utils/currency.util';

async function seed() {
  const isPostgres = !!process.env.DATABASE_URL || !!process.env.DB_HOST;

  const dataSource = new DataSource(
    isPostgres
      ? {
          type: 'postgres',
          url: process.env.DATABASE_URL,
          host: process.env.DB_HOST || 'localhost',
          port: parseInt(process.env.DB_PORT || '5432', 10),
          username: process.env.DB_USERNAME || 'postgres',
          password: process.env.DB_PASSWORD || 'postgres',
          database: process.env.DB_DATABASE || 'echits',
          ssl: !!process.env.DATABASE_URL || process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
          entities: Object.values(entities),
          synchronize: true,
        }
      : {
          type: 'better-sqlite3',
          database: process.env.SQLITE_PATH || 'echits.db',
          entities: Object.values(entities),
          synchronize: true,
        },
  );

  await dataSource.initialize();
  console.log('📦 Database connection initialized for seeding...');

  const userRepo = dataSource.getRepository(entities.User);
  const memberRepo = dataSource.getRepository(entities.Member);
  const chitRepo = dataSource.getRepository(entities.Chit);
  const monthRepo = dataSource.getRepository(entities.ChitMonth);
  const membershipRepo = dataSource.getRepository(entities.ChitMembership);
  const dueRepo = dataSource.getRepository(entities.MonthlyDue);
  const paymentRepo = dataSource.getRepository(entities.Payment);
  const allocRepo = dataSource.getRepository(entities.PaymentAllocation);
  const liftRepo = dataSource.getRepository(entities.LiftEvent);
  const closingRepo = dataSource.getRepository(entities.DailyClosing);
  const notifRepo = dataSource.getRepository(entities.Notification);
  const auditRepo = dataSource.getRepository(entities.AuditLog);
  const settingRepo = dataSource.getRepository(entities.BusinessSetting);

  // Clear existing records if needed
  if (!isPostgres) {
    await dataSource.query('PRAGMA foreign_keys = OFF;');
  }

  const reversalRepo = dataSource.getRepository(entities.PaymentReversal);
  const advanceRepo = dataSource.getRepository(entities.MemberAdvance);
  const adjRepo = dataSource.getRepository(entities.Adjustment);

  await reversalRepo.clear().catch(() => {});
  await allocRepo.clear().catch(() => {});
  await adjRepo.clear().catch(() => {});
  await advanceRepo.clear().catch(() => {});
  await paymentRepo.clear().catch(() => {});
  await liftRepo.clear().catch(() => {});
  await dueRepo.clear().catch(() => {});
  await membershipRepo.clear().catch(() => {});
  await monthRepo.clear().catch(() => {});
  await chitRepo.clear().catch(() => {});
  await memberRepo.clear().catch(() => {});
  await userRepo.clear().catch(() => {});
  await closingRepo.clear().catch(() => {});
  await notifRepo.clear().catch(() => {});
  await auditRepo.clear().catch(() => {});
  await settingRepo.clear().catch(() => {});

  if (!isPostgres) {
    await dataSource.query('PRAGMA foreign_keys = ON;');
  }

  console.log('🧹 Existing data cleared.');

  // 1. Seed Users
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('Admin@123', salt);

  const superAdmin = await userRepo.save(
    userRepo.create({
      name: 'Super Admin',
      email: 'superadmin@echits.com',
      phone: '9900000001',
      passwordHash,
      role: Role.SUPER_ADMIN,
      isActive: true,
    }),
  );

  const admin = await userRepo.save(
    userRepo.create({
      name: 'Branch Operations Admin',
      email: 'admin@echits.com',
      phone: '9900000002',
      passwordHash,
      role: Role.ADMIN,
      isActive: true,
    }),
  );

  const collector = await userRepo.save(
    userRepo.create({
      name: 'Ramesh Collector',
      email: 'collector@echits.com',
      phone: '9900000003',
      passwordHash,
      role: Role.COLLECTION_STAFF,
      isActive: true,
    }),
  );

  const accountant = await userRepo.save(
    userRepo.create({
      name: 'Pooja Accountant',
      email: 'accountant@echits.com',
      phone: '9900000004',
      passwordHash,
      role: Role.ACCOUNTANT,
      isActive: true,
    }),
  );

  console.log('👤 Users created.');

  // 2. Seed Settings
  await settingRepo.save([
    settingRepo.create({
      key: 'COMPANY_NAME',
      value: 'eChits Financial Enterprises Pvt Ltd',
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

  // 3. Seed Chits
  // Chit 1: 5 Lakhs 20 Months
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

  // Chit 2: 10 Lakhs 20 Months
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

  // Chit 3: 2 Lakhs 10 Months
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

  console.log('🏷️ Chits created.');

  // Helper function to generate ChitMonths
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

  console.log('📅 ChitMonths scheduled.');

  // 4. Seed Members
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

  console.log('👥 Members created.');


  // 5. Seed Memberships & Monthly Dues
  // Helper to create membership and its sequential dues
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

  // Ravi belongs to Chit 1 (Seat 1), Chit 2 (Seat 1), Chit 3 (Seat 1)
  const raviMs1 = await createMembershipWithDues(chit1, chit1Months, ravi, 1, 25000);
  const raviMs2 = await createMembershipWithDues(chit2, chit2Months, ravi, 1, 50000);
  const raviMs3 = await createMembershipWithDues(chit3, chit3Months, ravi, 1, 20000);

  // Priya belongs to Chit 1 (Seat 2)
  const priyaMs1 = await createMembershipWithDues(chit1, chit1Months, priya, 2, 25000);

  // Ramesh belongs to Chit 1 (Seat 3) and Chit 3 (Seat 2)
  const rameshMs1 = await createMembershipWithDues(chit1, chit1Months, ramesh, 3, 25000);
  const rameshMs3 = await createMembershipWithDues(chit3, chit3Months, ramesh, 2, 20000);

  // Ananya belongs to Chit 1 (Seat 4)
  const ananyaMs1 = await createMembershipWithDues(chit1, chit1Months, ananya, 4, 25000);

  // Karthik belongs to Chit 2 (Seat 2)
  const karthikMs2 = await createMembershipWithDues(chit2, chit2Months, karthik, 2, 50000);

  console.log('🪑 Memberships & Monthly dues created.');

  // 6. Record Initial Seed Payments & Partial Payments
  // Helper to record payment
  const recordPaymentHelper = async (
    member: entities.Member,
    chit: entities.Chit,
    due: entities.MonthlyDue,
    amount: number,
    mode: PaymentMode,
    notes: string,
    key: string,
    customDate?: Date,
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
        collectedBy: collector.id,
        collectedAt: customDate || new Date(),
        idempotencyKey: key,
        isReversed: false,
      }),
    );

    // Allocate
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

    // Update Due
    due.totalPaid = CurrencyUtil.add(due.totalPaid, amount);
    due.balanceDue = CurrencyUtil.round(Math.max(0, due.totalDue - due.totalPaid));
    due.status = due.balanceDue === 0 ? DueStatus.PAID : DueStatus.PART_PAID;
    await dueRepo.save(due);

    return payment;
  };

  // Ravi pays partial on Month 1 across his 3 chits:
  // Chit 1 Month 1 (₹25,000 due): Ravi paid ₹15,000 -> ₹10,000 pending
  const raviDue1 = await dueRepo.findOneOrFail({ where: { membershipId: raviMs1.id, chitMonthId: chit1Months[0].id } });
  await recordPaymentHelper(ravi, chit1, raviDue1, 15000, PaymentMode.UPI, 'Partial payment by Ravi', 'key-ravi-c1-m1');

  // Chit 2 Month 1 (₹50,000 due): Ravi paid ₹42,500 -> ₹7,500 pending
  const raviDue2 = await dueRepo.findOneOrFail({ where: { membershipId: raviMs2.id, chitMonthId: chit2Months[0].id } });
  await recordPaymentHelper(ravi, chit2, raviDue2, 42500, PaymentMode.BANK_TRANSFER, 'Partial payment by Ravi', 'key-ravi-c2-m1');

  // Chit 3 Month 1 (₹20,000 due): Ravi paid ₹15,000 -> ₹5,000 pending
  // Total across 3 chits: 10,000 + 7,500 + 5,000 = ₹22,500! Exactly matching prompt specification!
  const raviDue3 = await dueRepo.findOneOrFail({ where: { membershipId: raviMs3.id, chitMonthId: chit3Months[0].id } });
  await recordPaymentHelper(ravi, chit3, raviDue3, 15000, PaymentMode.CASH, 'Partial payment by Ravi', 'key-ravi-c3-m1');

  // Priya pays full Month 1 (₹25,000)
  const priyaDue1 = await dueRepo.findOneOrFail({ where: { membershipId: priyaMs1.id, chitMonthId: chit1Months[0].id } });
  await recordPaymentHelper(priya, chit1, priyaDue1, 25000, PaymentMode.UPI, 'Full Month 1 payment', 'key-priya-c1-m1');

  // Ananya pays full Month 1 (₹25,000)
  const ananyaDue1 = await dueRepo.findOneOrFail({ where: { membershipId: ananyaMs1.id, chitMonthId: chit1Months[0].id } });
  await recordPaymentHelper(ananya, chit1, ananyaDue1, 25000, PaymentMode.UPI, 'Full Month 1 payment', 'key-ananya-c1-m1');

  console.log('💳 Seed Payments & Allocations recorded.');

  // 7. Seed Lift / Auction Event for Priya Sharma in Chit 1 Month 2
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
      approvedBy: admin.id,
      remarks: 'Auction won at ₹75,000 discount. Net released: ₹4,25,000. Dividend ₹2,500/member.',
    }),
  );

  priyaMs1.status = MembershipStatus.LIFTED;
  await membershipRepo.save(priyaMs1);

  chit1Months[1].dividendPerMember = 2500;
  chit1Months[1].auctionDate = '2026-09-10';
  await monthRepo.save(chit1Months[1]);

  console.log('🏆 Lift / Auction event recorded.');

  // 8. Seed Initial Daily Closing for Today
  const todayStr = new Date().toISOString().slice(0, 10);
  await closingRepo.save(
    closingRepo.create({
      closingDate: todayStr,
      openedBy: collector.id,
      openingCash: 5000,
      cashCollected: 15000,
      upiCollected: 82500,
      bankCollected: 42500,
      chequeCollected: 0,
      otherCollected: 0,
      refunds: 0,
      expectedClosing: 20000, // opening 5000 + cash 15000
      actualClosing: 20000,
      difference: 0,
      status: DailyClosingStatus.OPEN,
    }),
  );

  // 9. Seed Audit Logs
  await auditRepo.save([
    auditRepo.create({
      actorId: admin.id,
      action: AuditAction.CREATE,
      entityName: 'Chit',
      entityId: chit1.id,
      reason: 'Initialized CHIT-5L-20M scheme',
    }),
    auditRepo.create({
      actorId: collector.id,
      action: AuditAction.PAYMENT_RECORDED,
      entityName: 'Payment',
      reason: 'Recorded ₹15,000 payment from Ravi Kumar',
    }),
    auditRepo.create({
      actorId: admin.id,
      action: AuditAction.LIFT_CONFIRMED,
      entityName: 'LiftEvent',
      entityId: liftEvent.id,
      reason: 'Confirmed lift for Priya Sharma (CHIT-5L-20M)',
    }),
  ]);

  console.log('✅ eChits Database seeding completed successfully!');
  await dataSource.destroy();
}

seed().catch((err) => {
  console.error('❌ Seeding error:', err);
  process.exit(1);
});

export enum Role {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  COLLECTION_STAFF = 'COLLECTION_STAFF',
  ACCOUNTANT = 'ACCOUNTANT',
  VIEWER = 'VIEWER',
}

export enum PaymentMode {
  CASH = 'CASH',
  UPI = 'UPI',
  BANK_TRANSFER = 'BANK_TRANSFER',
  CHEQUE = 'CHEQUE',
  OTHER = 'OTHER',
}

export enum DueStatus {
  PENDING = 'PENDING',
  PART_PAID = 'PART_PAID',
  PAID = 'PAID',
  OVERDUE = 'OVERDUE',
  WAIVED = 'WAIVED',
}

export enum ChitStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum MembershipStatus {
  ACTIVE = 'ACTIVE',
  LIFTED = 'LIFTED',
  EXITED = 'EXITED',
  CLOSED = 'CLOSED',
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: Role;
  isActive: boolean;
}

export interface Member {
  id: string;
  memberCode: string;
  fullName: string;
  phone: string;
  altPhone?: string;
  email?: string;
  address?: string;
  idProofType?: string;
  idProofNumber?: string;
  status: string;
  notes?: string;
}

export interface ChitSummaryItem {
  membershipId: string;
  chitId: string;
  chitCode: string;
  chitName: string;
  seatNumber: number;
  status: string;
  monthlyInstallment: number;
  pendingAmount: number;
  paidAmount: number;
  interestAmount: number;
  overdueAmount: number;
  nextDueMonth?: number | null;
  nextDueDate?: string | null;
  nextDueAmount: number;
}

export interface MemberSummary {
  id: string;
  memberCode: string;
  fullName: string;
  phone: string;
  altPhone?: string;
  email?: string;
  address?: string;
  status: string;
  chitsCount: number;
  pendingChitsCount: number;
  totalOutstanding: number;
  totalPaid: number;
  totalInterest: number;
  totalOverdue: number;
  totalAdvance: number;
  chits: ChitSummaryItem[];
}

export interface Chit {
  id: string;
  chitCode: string;
  chitName: string;
  totalValue: number;
  capacity: number;
  durationMonths: number;
  startMonth: number;
  startYear: number;
  endMonth: number;
  endYear: number;
  defaultInstallment: number;
  dueDay: number;
  gracePeriodDays: number;
  defaultInterestRate: number;
  lateFee: number;
  status: ChitStatus;
  notes?: string;
}

export interface ChitCardSummary {
  id: string;
  chitCode: string;
  chitName: string;
  totalValue: number;
  capacity: number;
  enrolledMembers: number;
  durationMonths: number;
  startMonth: number;
  startYear: number;
  endMonth: number;
  endYear: number;
  defaultInstallment: number;
  dueDay: number;
  gracePeriodDays: number;
  defaultInterestRate: number;
  lateFee: number;
  status: ChitStatus;
  currentMonthSequence: number;
  totalExpected: number;
  totalCollected: number;
  totalPending: number;
  totalOverdue: number;
  totalInterest: number;
}

export interface ChitMonth {
  id: string;
  chitId: string;
  monthSequence: number;
  calendarMonth: number;
  calendarYear: number;
  dueDate: string;
  graceDate: string;
  interestRateOverride?: number | null;
  dividendPerMember?: number | null;
  auctionDate?: string | null;
  status: string;
}

export interface MonthlyDue {
  id: string;
  membershipId: string;
  chitMonthId: string;
  scheduledDue: number;
  previousBalance: number;
  interestBase: number;
  interestRate: number;
  interestAmount: number;
  lateFee: number;
  adjustmentAmount: number;
  totalDue: number;
  totalPaid: number;
  balanceDue: number;
  status: DueStatus;
  chitMonth?: ChitMonth;
  membership?: ChitMembership;
  allocations?: PaymentAllocation[];
}

export interface ChitMembership {
  id: string;
  chitId: string;
  memberId: string;
  seatNumber: number;
  joiningDate: string;
  customInstallment?: number | null;
  openingBalance: number;
  status: MembershipStatus;
  chit?: Chit;
  member?: Member;
  dues?: MonthlyDue[];
}

export interface PaymentAllocation {
  id: string;
  paymentId: string;
  monthlyDueId: string;
  interestAllocated: number;
  feeAllocated: number;
  principalAllocated: number;
  totalAllocated: number;
  monthlyDue?: MonthlyDue;
}

export interface Payment {
  id: string;
  receiptNumber: string;
  memberId: string;
  chitId?: string | null;
  totalAmount: number;
  allocatedAmount: number;
  advanceAmount: number;
  paymentMode: PaymentMode;
  referenceNumber?: string | null;
  notes?: string | null;
  collectedBy: string;
  collectedAt: string;
  idempotencyKey: string;
  isReversed: boolean;
  member?: Member;
  chit?: Chit;
  collectedByUser?: User;
  allocations?: PaymentAllocation[];
  reversal?: any;
}

export interface ReceiptData {
  payment: Payment;
  receiptNumber: string;
  date: string;
  amount: number;
  allocatedAmount: number;
  advanceAmount: number;
  paymentMode: PaymentMode;
  referenceNumber?: string | null;
  member: {
    id: string;
    name: string;
    code: string;
    phone: string;
    address?: string;
  };
  chit?: {
    id: string;
    code: string;
    name: string;
    totalValue: number;
  } | null;
  collectedBy: {
    id: string;
    name: string;
    role: string;
  };
  allocationBreakdown: Array<{
    dueId: string;
    monthSequence: number;
    calendarMonth: number;
    calendarYear: number;
    interestPaid: number;
    feePaid: number;
    principalPaid: number;
    totalAllocated: number;
    dueBalanceRemaining: number;
    dueStatus: DueStatus;
  }>;
  totalInterestAllocated: number;
  totalFeeAllocated: number;
  totalPrincipalAllocated: number;
  remainingChitBalance: number;
  isReversed: boolean;
  reversal?: any;
}

export interface DashboardKpis {
  kpis: {
    todayCollection: number;
    monthCollection: number;
    dueTodayAmount: number;
    dueTodayCount: number;
    pendingAmount: number;
    overdueAmount: number;
    overdueCount: number;
    interestPending: number;
  };
  attentionItems: Array<{
    id: string;
    type: string;
    title: string;
    count: number;
    amount: number;
    severity: 'info' | 'warning' | 'danger';
    description: string;
  }>;
  recentPayments: Payment[];
}

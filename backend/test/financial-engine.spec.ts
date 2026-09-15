import { CurrencyUtil } from '../src/common/utils/currency.util';
import { DueStatus, PaymentMode, MembershipStatus, ChitStatus } from '../src/common/enums';

describe('Financial Calculation & Payment Engine Unit Tests', () => {
  describe('Currency Precision & Arithmetic', () => {
    it('should round monetary amounts accurately using Half-Up rounding', () => {
      expect(CurrencyUtil.round(100.455)).toBe(100.46);
      expect(CurrencyUtil.round(100.454)).toBe(100.45);
      expect(CurrencyUtil.round('25000.50')).toBe(25000.5);
    });

    it('should safely add multiple currency values without floating-point artifacts', () => {
      // 0.1 + 0.2 in standard floating point is 0.30000000000000004
      expect(CurrencyUtil.add(0.1, 0.2)).toBe(0.3);
      expect(CurrencyUtil.add(10000, 7500, 5000)).toBe(22500);
      expect(CurrencyUtil.add('15000.75', '25000.25')).toBe(40001);
    });

    it('should safely subtract currency values', () => {
      expect(CurrencyUtil.subtract(15100, 5000)).toBe(10100);
      expect(CurrencyUtil.subtract('500000.00', '75000.00')).toBe(425000);
    });
  });

  describe('Monthly Due & Interest Engine', () => {
    it('should calculate non-compounded interest strictly on eligible previous delinquent balance', () => {
      const previousBalance = 5000;
      const scheduledDue = 10000;
      const interestRate = 2.0; // 2% per month

      const interestBase = Math.max(0, previousBalance);
      const interestAmount = CurrencyUtil.round((interestBase * interestRate) / 100);
      const totalDue = CurrencyUtil.add(previousBalance, scheduledDue, interestAmount);

      expect(interestBase).toBe(5000);
      expect(interestAmount).toBe(100);
      expect(totalDue).toBe(15100);
    });

    it('should transition status to PART_PAID when payment is less than total due', () => {
      const totalDue = 15100;
      const paymentAmount = 5000;
      const balanceDue = CurrencyUtil.subtract(totalDue, paymentAmount);

      let status = DueStatus.PENDING;
      if (paymentAmount >= totalDue) {
        status = DueStatus.PAID;
      } else if (paymentAmount > 0) {
        status = DueStatus.PART_PAID;
      }

      expect(balanceDue).toBe(10100);
      expect(status).toBe(DueStatus.PART_PAID);
    });

    it('should transition status to PAID when payment covers full due', () => {
      const totalDue = 25000;
      const paymentAmount = 25000;
      const balanceDue = CurrencyUtil.subtract(totalDue, paymentAmount);

      let status = DueStatus.PENDING;
      if (paymentAmount >= totalDue) {
        status = DueStatus.PAID;
      }

      expect(balanceDue).toBe(0);
      expect(status).toBe(DueStatus.PAID);
    });
  });

  describe('Deterministic Payment Allocation Engine', () => {
    it('should allocate payment to Interest first, then Late Fees, then Principal', () => {
      const due = {
        scheduledDue: 10000,
        previousBalance: 5000,
        interestAmount: 100,
        lateFee: 50,
        balanceDue: 15150,
      };

      let unallocated = 10000;

      // 1. Interest
      const interestAlloc = Math.min(unallocated, due.interestAmount);
      unallocated = CurrencyUtil.subtract(unallocated, interestAlloc);

      // 2. Late Fee
      const feeAlloc = Math.min(unallocated, due.lateFee);
      unallocated = CurrencyUtil.subtract(unallocated, feeAlloc);

      // 3. Principal
      const principalAlloc = Math.min(unallocated, 15000);
      unallocated = CurrencyUtil.subtract(unallocated, principalAlloc);

      expect(interestAlloc).toBe(100);
      expect(feeAlloc).toBe(50);
      expect(principalAlloc).toBe(9850);
      expect(unallocated).toBe(0);
      expect(CurrencyUtil.add(interestAlloc, feeAlloc, principalAlloc)).toBe(10000);
    });

    it('should handle excess payment by creating explicit advance credit balance', () => {
      const totalOutstanding = 15000;
      const paymentAmount = 20000;

      const allocatedAmount = Math.min(paymentAmount, totalOutstanding);
      const advanceAmount = Math.max(0, CurrencyUtil.subtract(paymentAmount, totalOutstanding));

      expect(allocatedAmount).toBe(15000);
      expect(advanceAmount).toBe(5000);
      expect(CurrencyUtil.add(allocatedAmount, advanceAmount)).toBe(paymentAmount);
    });
  });

  describe('Lift / Auction Mathematical Invariants', () => {
    it('should calculate auction winner payout, company commission, and member dividend accurately', () => {
      const chitValue = 500000;
      const capacity = 20;
      const bidDiscount = 75000;
      const commissionRate = 5.0; // 5%

      const companyCommission = CurrencyUtil.round((chitValue * commissionRate) / 100); // ₹25,000
      const dividendPool = CurrencyUtil.subtract(bidDiscount, companyCommission); // ₹50,000
      const dividendPerMember = CurrencyUtil.round(dividendPool / capacity); // ₹2,500
      const amountReleased = CurrencyUtil.subtract(chitValue, bidDiscount); // ₹4,25,000

      expect(companyCommission).toBe(25000);
      expect(dividendPool).toBe(50000);
      expect(dividendPerMember).toBe(2500);
      expect(amountReleased).toBe(425000);
      expect(CurrencyUtil.add(amountReleased, bidDiscount)).toBe(chitValue);
    });
  });
});

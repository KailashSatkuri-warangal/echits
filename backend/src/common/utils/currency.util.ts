/**
 * Precision monetary utility functions
 * Financial calculations must never suffer from IEEE floating-point errors.
 */

export class CurrencyUtil {
  /**
   * Round to 2 decimal places using deterministic Half-Up rounding
   */
  static round(value: number | string): number {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num)) return 0;
    return Math.round((num + Number.EPSILON) * 100) / 100;
  }

  /**
   * Convert rupees to paise (cents) for exact integer arithmetic
   */
  static toPaise(rupees: number | string): number {
    const num = typeof rupees === 'string' ? parseFloat(rupees) : rupees;
    if (isNaN(num)) return 0;
    return Math.round((num + Number.EPSILON) * 100);
  }

  /**
   * Convert paise back to rupees
   */
  static toRupees(paise: number): number {
    return Math.round(paise) / 100;
  }

  /**
   * Safe addition of monetary values
   */
  static add(...values: (number | string)[]): number {
    let sumPaise = 0;
    for (const val of values) {
      sumPaise += CurrencyUtil.toPaise(val);
    }
    return CurrencyUtil.toRupees(sumPaise);
  }

  /**
   * Safe subtraction: a - b
   */
  static subtract(a: number | string, b: number | string): number {
    const paiseA = CurrencyUtil.toPaise(a);
    const paiseB = CurrencyUtil.toPaise(b);
    return CurrencyUtil.toRupees(paiseA - paiseB);
  }

  /**
   * Format amount in Indian Currency Format: ₹ 1,50,000.00
   */
  static formatINR(value: number | string, includeSymbol = true): string {
    const num = CurrencyUtil.round(value);
    const formatted = new Intl.NumberFormat('en-IN', {
      style: includeSymbol ? 'currency' : 'decimal',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num);

    return formatted;
  }
}

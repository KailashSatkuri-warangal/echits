# eChits: Business Rules & Financial Calculations Specification

This document defines the authoritative mathematical and business rules governing the eChits financial engine.

---

## 1. Monetary Storage & Arithmetic Precision
- All monetary values are stored in PostgreSQL using `NUMERIC(12, 2)` or `DECIMAL(12, 2)`.
- **Zero Floating-Point Policy**: All computations are performed using integer cents/paise or high-precision decimal operations with explicit 2-decimal half-up rounding:
  $$\text{round}(x, 2) = \frac{\lfloor x \times 100 + 0.5 \rfloor}{100}$$
- Under no circumstances is currency rounded down or lost.

---

## 2. Chit Structure & Month Sequence
- **Chit Value**: Total corpus of the chit scheme (e.g., ₹5,00,000).
- **Capacity**: Total number of seats (e.g., 20 seats).
- **Duration ($N$)**: Total number of months, computed as:
  $$N = (\text{end\_year} - \text{start\_year}) \times 12 + (\text{end\_month} - \text{start\_month}) + 1$$
- **Default Monthly Installment**:
  $$\text{Installment} = \frac{\text{Total Chit Value}}{N}$$
  (e.g., $\frac{₹5,00,000}{20} = ₹25,000$).
- **ChitMonth Generation**: Automatically generated from sequence $1$ to $N$ with specific calendar month, calendar year, and due dates.

---

## 3. Monthly Ledger & Due Calculation Engine

For every member $m$ in Chit $c$ for Month Sequence $k$:

### 1. Scheduled Due ($\text{SD}_k$)
- Default installment of the chit, or custom installment if overridden for a specific member/lift state.

### 2. Previous Balance ($\text{PB}_k$)
- For $k = 1$: Opening balance assigned to membership (if any).
- For $k > 1$: Outstanding balance remaining on Month $k-1$:
  $$\text{PB}_k = \text{BalanceDue}_{k-1}$$

### 3. Interest Engine ($\text{Int}_k$)
- **Interest Base**: The eligible delinquent previous balance:
  $$\text{InterestBase}_k = \max(0, \text{PB}_k)$$
- **Interest Rate Hierarchy**:
  1. Member-specific authorized override (highest priority)
  2. ChitMonth override (for group-wide rate relief)
  3. Chit default interest %
  4. Global platform default % (2% per month standard)
- **Calculation (No Silent Compounding)**:
  $$\text{Int}_k = \text{round}\left(\text{InterestBase}_k \times \frac{\text{EffectiveRate}}{100}, 2\right)$$

### 4. Late Fee ($\text{LF}_k$)
- Fixed fee applied if payment is made beyond $\text{Due Date} + \text{Grace Period}$.

### 5. Adjustments ($\text{Adj}_k$)
- Approved credits, waivers, or discounts granted by authorized staff with required reason.

### 6. Total Due ($\text{TD}_k$)
$$\text{TD}_k = \text{PB}_k + \text{SD}_k + \text{Int}_k + \text{LF}_k - \text{Adj}_k$$

### 7. Remaining Balance ($\text{Bal}_k$)
$$\text{Bal}_k = \text{TD}_k - \text{Paid}_k$$

### 8. Status Invariant Matrix
| Condition | Status |
| :--- | :--- |
| $\text{Paid}_k \ge \text{TD}_k$ | `PAID` |
| $0 < \text{Paid}_k < \text{TD}_k$ | `PART_PAID` |
| $\text{Paid}_k = 0 \land \text{Today} \le \text{Due Date} + \text{Grace Period}$ | `PENDING` |
| $\text{Paid}_k = 0 \land \text{Today} > \text{Due Date} + \text{Grace Period}$ | `OVERDUE` |
| Waived by authorized Admin | `WAIVED` |

---

## 4. Deterministic Payment Allocation Engine

When a payment of amount $P$ is received for a member against Chit $c$:

1. **Target Selection**:
   - If a specific due month $k$ is chosen, $P$ is applied to month $k$.
   - If multi-month or unassigned, payment is allocated strictly to the **oldest unpaid month first** ($1 \le j \le N$).

2. **Priority of Allocation within a Month**:
   - **Step 1**: Settle outstanding Interest & Late Fees first.
   - **Step 2**: Settle Scheduled Installment Principal.
   - **Step 3**: Any remainder overflows into the next chronological month.

3. **Overpayment & Advance Balance**:
   - If payment $P > \sum_{j=1}^N \text{TotalOutstanding}_j$, the excess $\Delta = P - \text{TotalOutstanding}$ is credited to the member's `member_advances` account.
   - Money is **never discarded or lost**.
   - When the next ChitMonth opens, the advance balance is automatically applied to reduce scheduled dues.

---

## 5. Lift / Auction Financial Engine

- **Lift Event**: An auction where a member bids a discount to receive the pooled chit prize.
- **Fields**:
  - Chit Value (Corpus)
  - Bid / Discount (e.g. ₹1,00,000)
  - Company Commission (e.g. 5% of chit value = ₹25,000)
  - Member Dividend Distribution: $\frac{\text{Bid} - \text{Commission}}{\text{Capacity}}$ distributed as discount to all non-lifted members.
  - Amount Released to Winner: $\text{Chit Value} - \text{Bid}$.
  - Revised Post-Lift Installment for Winner (if non-dividend post-lift terms apply).
- **Historical Invariant**:
  - Dues for Month $< \text{EffectiveMonth}$ **MUST NEVER BE MODIFIED**.
- **Future Invariant**:
  - Dues for Month $\ge \text{EffectiveMonth}$ are regenerated with the updated installment amount and membership status set to `LIFTED`.

---

## 6. Payment Reversal / Void Engine

- **Zero Hard Deletion**: Payments are never dropped from the database.
- **Audit & Linkage**:
  - Creates a `payment_reversals` record linking `original_payment_id`.
  - Flags original payment `is_reversed = true`.
  - Unwinds `payment_allocations`, recalculates `monthly_dues.total_paid` and `monthly_dues.balance_due`, and updates status back to `PENDING` / `PART_PAID` / `OVERDUE`.
  - Records an immutable audit log entry.

---

## 7. Role-Based Access Control (RBAC) Matrix

| Operation | Super Admin | Admin | Collection Staff | Accountant | Viewer |
| :--- | :---: | :---: | :---: | :---: | :---: |
| Search Members & View Dues | ✅ | ✅ | ✅ | ✅ | ✅ |
| Record Payment | ✅ | ✅ | ✅ | ✅ | ❌ |
| Reverse Payment | ✅ | ✅ | ❌ (Request only) | ❌ | ❌ |
| Create / Edit Chit | ✅ | ✅ | ❌ | ❌ | ❌ |
| Create / Edit Member | ✅ | ✅ | ✅ | ❌ | ❌ |
| Approve Lift / Auction | ✅ | ✅ | ❌ | ❌ | ❌ |
| Perform Daily Closing | ✅ | ✅ | ✅ (Own shift) | ✅ | ❌ |
| Grant Interest Waiver / Adjust | ✅ | ✅ | ❌ | ❌ | ❌ |
| View System Audit Logs | ✅ | ❌ | ❌ | ❌ | ❌ |

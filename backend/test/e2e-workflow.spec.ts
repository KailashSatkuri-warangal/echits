import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
const request = require('supertest');
import { AppModule } from '../src/app.module';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { TransformInterceptor } from '../src/common/interceptors/transform.interceptor';

describe('eChits Full Financial Operations E2E Integration Suite', () => {
  let app: INestApplication;
  let authToken: string;
  let testMemberId: string;
  let testChitId: string;
  let recordedPaymentId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    app.useGlobalFilters(new HttpExceptionFilter());
    app.useGlobalInterceptors(new TransformInterceptor());

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('1. Authentication & RBAC', () => {
    it('should authenticate Admin user and issue JWT token', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'admin@echits.com', password: 'Admin@123' })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.accessToken).toBeDefined();
      authToken = res.body.data.accessToken;
    });

    it('should reject unauthenticated access to protected endpoints', async () => {
      await request(app.getHttpServer())
        .get('/api/reports/dashboard-kpis')
        .expect(401);
    });

    it('should allow access to dashboard KPIs with valid JWT token', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/reports/dashboard-kpis')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.kpis).toBeDefined();
    });
  });

  describe('2. Multi-Chit Member Search & Aggregation', () => {
    it('should perform fast search for member "Ravi" and aggregate all 3 chits dues', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/members/search?q=Ravi')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.items.length).toBeGreaterThan(0);

      const ravi = res.body.data.items[0];
      testMemberId = ravi.id;
      expect(ravi.fullName).toBe('Ravi Kumar');
      expect(ravi.chitsCount).toBe(3);
      // Total outstanding across Chit 1 (₹10,000), Chit 2 (₹7,500), Chit 3 (₹5,000) = ₹22,500+
      expect(ravi.totalOutstanding).toBeGreaterThanOrEqual(22500);
    });

    it('should retrieve comprehensive Member 360° profile with chronological ledger', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/members/${testMemberId}/360`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.member).toBeDefined();
      expect(res.body.data.memberships.length).toBe(3);
      testChitId = res.body.data.memberships[0].chitId;
    });
  });

  describe('3. Authoritative Payment Processing & Deterministic Allocation', () => {
    const idempotencyKey = `e2e-test-key-${Date.now()}`;

    it('should record a partial payment of ₹5,000 against Ravi Kumar with receipt generation', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/payments')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          memberId: testMemberId,
          chitId: testChitId,
          amount: 5000,
          paymentMode: 'UPI',
          referenceNumber: 'UPI-TEST-998877',
          notes: 'E2E partial payment test',
          idempotencyKey,
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      const receipt = res.body.data;
      expect(receipt.receiptNumber).toMatch(/^REC-\d{6}-\d{4}$/);
      expect(receipt.amount).toBe(5000);
      expect(receipt.paymentMode).toBe('UPI');
      recordedPaymentId = receipt.payment.id;
    });

    it('should protect against duplicate transactions when repeating the same idempotency key', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/payments')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          memberId: testMemberId,
          chitId: testChitId,
          amount: 5000,
          paymentMode: 'UPI',
          referenceNumber: 'UPI-TEST-998877',
          idempotencyKey, // same key!
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.payment.id).toBe(recordedPaymentId);
    });
  });

  describe('4. Payment Reversals & Ledger Restoration', () => {
    it('should reverse the recorded payment with required reason and restore balance', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/reversals')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          paymentId: recordedPaymentId,
          reason: 'Automated test payment voided',
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.reversal.reason).toBe('Automated test payment voided');
      expect(res.body.data.payment.isReversed).toBe(true);
    });
  });

  describe('5. Daily Closing Reconciliation', () => {
    it('should retrieve current daily closing metrics and reconcile cash register', async () => {
      const todayStr = new Date().toISOString().slice(0, 10);
      const res = await request(app.getHttpServer())
        .get(`/api/daily-closing/${todayStr}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      const expectedCash = res.body.data.metrics.expectedClosingCash;

      const reconcileRes = await request(app.getHttpServer())
        .post(`/api/daily-closing/${todayStr}/reconcile`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          actualClosing: expectedCash,
          notes: 'E2E automated shift reconciliation test',
        })
        .expect(201);

      expect(reconcileRes.body.success).toBe(true);
      expect(reconcileRes.body.data.metrics.status).toBe('CLOSED');
      expect(reconcileRes.body.data.metrics.difference).toBe(0);
    });
  });
});

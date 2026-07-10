import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Booking Platform API (e2e)', () => {
  let app: INestApplication;
  let accessToken: string;
  let serviceId: string;
  let bookingId: string;
  const testEmail = `e2e-${Date.now()}@example.com`;

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    // Apply the same global pipes as main.ts
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: {
          enableImplicitConversion: true,
        },
      }),
    );

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  // ── Authentication ────────────────────────────────────────────────

  describe('POST /auth/register', () => {
    const registerUser = {
      email: testEmail,
      password: 'password123',
      name: 'E2E Test User',
    };

    it('should register a new user', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerUser)
        .expect(201);

      expect(res.body.data).toHaveProperty('accessToken');
      expect(res.body.data).toHaveProperty('refreshToken');
      expect(res.body.data.user.email).toBe(testEmail);
      expect(res.body.data.user.name).toBe('E2E Test User');
    });

    it('should reject duplicate email', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerUser)
        .expect(409);

      expect(res.body.message).toBe('Email already registered');
    });

    it('should reject invalid email format', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/register')
        .send({ email: 'not-an-email', password: 'password123', name: 'Test' })
        .expect(400);

      expect(res.body.message).toBe('Validation failed');
    });

    it('should reject short password', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/register')
        .send({ email: 'short@example.com', password: '123', name: 'Test' })
        .expect(400);

      expect(res.body.message).toBe('Validation failed');
    });

    it('should reject missing name', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/register')
        .send({ email: 'noname@example.com', password: 'password123', name: '' })
        .expect(400);

      expect(res.body.message).toBe('Validation failed');
    });
  });

  describe('POST /auth/login', () => {
    it('should login with correct credentials', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: testEmail, password: 'password123' })
        .expect(200);

      expect(res.body.data).toHaveProperty('accessToken');
      expect(res.body.data).toHaveProperty('refreshToken');
      expect(res.body.data.user.email).toBe(testEmail);
      accessToken = res.body.data.accessToken;
    });

    it('should reject wrong email', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'wrong@example.com', password: 'password123' })
        .expect(401);

      expect(res.body.message).toBe('Invalid credentials');
    });

    it('should reject wrong password', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: testEmail, password: 'wrong-password' })
        .expect(401);

      expect(res.body.message).toBe('Invalid credentials');
    });
  });

  describe('POST /auth/refresh', () => {
    it('should refresh tokens', async () => {
      // First login to get a fresh refresh token
      const loginRes = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: testEmail, password: 'password123' })
        .expect(200);

      const refreshToken = loginRes.body.data.refreshToken;

      const res = await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({ refreshToken })
        .expect(200);

      expect(res.body.data).toHaveProperty('accessToken');
      expect(res.body.data).toHaveProperty('refreshToken');
    });

    it('should reject invalid refresh token', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({ refreshToken: 'invalid-token' })
        .expect(401);

      expect(res.body.message).toBe('Invalid refresh token');
    });
  });

  // ── Users Profile (authenticated) ─────────────────────────────────

  describe('GET /users/profile', () => {
    it('should get profile with valid token', async () => {
      const res = await request(app.getHttpServer())
        .get('/users/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(res.body.data.email).toBe(testEmail);
      expect(res.body.data.name).toBe('E2E Test User');
    });

    it('should reject without token', async () => {
      await request(app.getHttpServer())
        .get('/users/profile')
        .expect(401);
    });

    it('should reject with invalid token', async () => {
      await request(app.getHttpServer())
        .get('/users/profile')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });
  });

  // ── Services ──────────────────────────────────────────────────────

  describe('POST /services', () => {
    it('should create a service when authenticated', async () => {
      const res = await request(app.getHttpServer())
        .post('/services')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: 'E2E Test Haircut',
          description: 'A test service for E2E testing',
          duration: 60,
          price: 49.99,
        })
        .expect(201);

      expect(res.body.data.title).toBe('E2E Test Haircut');
      expect(res.body.data.isActive).toBe(true);
      serviceId = res.body.data.id;
    });

    it('should reject without authentication', async () => {
      await request(app.getHttpServer())
        .post('/services')
        .send({
          title: 'Unauthorized Service',
          duration: 30,
          price: 25.00,
        })
        .expect(401);
    });

    it('should reject invalid data', async () => {
      const res = await request(app.getHttpServer())
        .post('/services')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: '', // empty title
          duration: -1, // negative duration
          price: -10, // negative price
        })
        .expect(400);

      expect(res.body.message).toBe('Validation failed');
    });
  });

  describe('GET /services', () => {
    it('should list all active services (public)', async () => {
      const res = await request(app.getHttpServer())
        .get('/services')
        .expect(200);

      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    });

    it('should search services by title', async () => {
      const res = await request(app.getHttpServer())
        .get('/services?search=Haircut')
        .expect(200);

      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('GET /services/:id', () => {
    it('should get a service by id (public)', async () => {
      const res = await request(app.getHttpServer())
        .get(`/services/${serviceId}`)
        .expect(200);

      expect(res.body.data.id).toBe(serviceId);
      expect(res.body.data.title).toBe('E2E Test Haircut');
    });

    it('should return 404 for non-existent service', async () => {
      await request(app.getHttpServer())
        .get('/services/00000000-0000-0000-0000-000000000000')
        .expect(404);
    });
  });

  describe('PATCH /services/:id', () => {
    it('should update own service', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/services/${serviceId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ title: 'Updated E2E Haircut', price: 59.99 })
        .expect(200);

      expect(res.body.data.title).toBe('Updated E2E Haircut');
      expect(res.body.data.price).toBe(59.99);
    });

    it('should reject without auth', async () => {
      await request(app.getHttpServer())
        .patch(`/services/${serviceId}`)
        .send({ title: 'Hacked' })
        .expect(401);
    });
  });

  // ── Bookings ──────────────────────────────────────────────────────

  describe('POST /bookings (public)', () => {
    it('should create a booking (public)', async () => {
      const res = await request(app.getHttpServer())
        .post('/bookings')
        .send({
          customerName: 'Jane E2E',
          customerEmail: 'jane.e2e@example.com',
          customerPhone: '+1-555-9999',
          serviceId,
          bookingDate: tomorrowStr,
          bookingTime: '14:30',
        })
        .expect(201);

      expect(res.body.data.customerName).toBe('Jane E2E');
      expect(res.body.data.status).toBe('PENDING');
      bookingId = res.body.data.id;
    });

    it('should reject booking with past date', async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      const res = await request(app.getHttpServer())
        .post('/bookings')
        .send({
          customerName: 'Past Booking',
          customerEmail: 'past@example.com',
          customerPhone: '+1-555-0000',
          serviceId,
          bookingDate: yesterdayStr,
          bookingTime: '10:00',
        })
        .expect(400);

      expect(res.body.message).toBe('Booking date must be in the future');
    });

    it('should reject duplicate booking', async () => {
      const res = await request(app.getHttpServer())
        .post('/bookings')
        .send({
          customerName: 'Jane E2E',
          customerEmail: 'jane.e2e@example.com',
          customerPhone: '+1-555-9999',
          serviceId,
          bookingDate: tomorrowStr,
          bookingTime: '14:30',
        })
        .expect(409);

      expect(res.body.message).toContain('already exists');
    });

    it('should reject booking for non-existent service', async () => {
      const res = await request(app.getHttpServer())
        .post('/bookings')
        .send({
          customerName: 'No Service',
          customerEmail: 'noservice@example.com',
          customerPhone: '+1-555-1111',
          serviceId: '00000000-0000-4000-8000-000000000000',
          bookingDate: tomorrowStr,
          bookingTime: '10:00',
        })
        .expect(404);

      expect(res.body.message).toBe('Service not found');
    });

    it('should reject invalid email format', async () => {
      const res = await request(app.getHttpServer())
        .post('/bookings')
        .send({
          customerName: 'Bad Email',
          customerEmail: 'not-an-email',
          customerPhone: '+1-555-1111',
          serviceId,
          bookingDate: tomorrowStr,
          bookingTime: '10:00',
        })
        .expect(400);

      expect(res.body.message).toBe('Validation failed');
    });

    it('should reject invalid time format', async () => {
      const res = await request(app.getHttpServer())
        .post('/bookings')
        .send({
          customerName: 'Bad Time',
          customerEmail: 'badtime@example.com',
          customerPhone: '+1-555-1111',
          serviceId,
          bookingDate: tomorrowStr,
          bookingTime: '25:00',
        })
        .expect(400);

      expect(res.body.message).toBe('Validation failed');
    });
  });

  describe('GET /bookings (authenticated)', () => {
    it('should list bookings with pagination', async () => {
      const res = await request(app.getHttpServer())
        .get('/bookings?page=1&limit=10')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      // The response should have flattened `data` and `meta` at top level
      // (from the TransformInterceptor pagination fix)
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.meta).toBeDefined();
      expect(res.body.meta.total).toBeGreaterThanOrEqual(1);
      expect(res.body.meta.page).toBe(1);
    });

    it('should filter bookings by status', async () => {
      const res = await request(app.getHttpServer())
        .get('/bookings?status=PENDING')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(Array.isArray(res.body.data)).toBe(true);
      res.body.data.forEach((b: any) => {
        expect(b.status).toBe('PENDING');
      });
    });

    it('should search bookings by customer name', async () => {
      const res = await request(app.getHttpServer())
        .get('/bookings?search=Jane')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    });

    it('should reject without auth', async () => {
      await request(app.getHttpServer())
        .get('/bookings')
        .expect(401);
    });
  });

  describe('GET /bookings/:id', () => {
    it('should get a booking by id', async () => {
      const res = await request(app.getHttpServer())
        .get(`/bookings/${bookingId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(res.body.data.id).toBe(bookingId);
      expect(res.body.data.status).toBe('PENDING');
    });

    it('should return 404 for non-existent booking', async () => {
      await request(app.getHttpServer())
        .get('/bookings/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);
    });
  });

  describe('PATCH /bookings/:id/status', () => {
    it('should transition PENDING to CONFIRMED', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/bookings/${bookingId}/status`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ status: 'CONFIRMED' })
        .expect(200);

      expect(res.body.data.status).toBe('CONFIRMED');
    });

    it('should transition CONFIRMED to COMPLETED', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/bookings/${bookingId}/status`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ status: 'COMPLETED' })
        .expect(200);

      expect(res.body.data.status).toBe('COMPLETED');
    });

    it('should reject COMPLETED to CANCELLED', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/bookings/${bookingId}/status`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ status: 'CANCELLED' })
        .expect(400);

      expect(res.body.message).toContain('Cannot change status of a completed booking');
    });

    it('should reject invalid status value', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/bookings/${bookingId}/status`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ status: 'INVALID' })
        .expect(400);

      expect(res.body.message).toBe('Validation failed');
    });
  });

  // ── Cancel Booking ────────────────────────────────────────────────

  describe('DELETE /bookings/:id', () => {
    it('should cancel a PENDING booking', async () => {
      // Create a new PENDING booking to cancel
      const createRes = await request(app.getHttpServer())
        .post('/bookings')
        .send({
          customerName: 'Cancel Test',
          customerEmail: 'cancel@example.com',
          customerPhone: '+1-555-2222',
          serviceId,
          bookingDate: tomorrowStr,
          bookingTime: '16:00',
        })
        .expect(201);

      const cancelBookingId = createRes.body.data.id;

      const res = await request(app.getHttpServer())
        .delete(`/bookings/${cancelBookingId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(res.body.data.booking.status).toBe('CANCELLED');
    });

    it('should reject cancelling without auth', async () => {
      await request(app.getHttpServer())
        .delete(`/bookings/${bookingId}`)
        .expect(401);
    });
  });

  // ── Soft Delete Service ───────────────────────────────────────────

  describe('DELETE /services/:id', () => {
    it('should soft delete own service', async () => {
      const res = await request(app.getHttpServer())
        .delete(`/services/${serviceId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(res.body.data.message).toBe('Service deactivated successfully');
    });

    it('should no longer appear in active services', async () => {
      const res = await request(app.getHttpServer())
        .get('/services')
        .expect(200);

      const deletedService = res.body.data.find(
        (s: any) => s.id === serviceId,
      );
      expect(deletedService).toBeUndefined();
    });

    it('should reject deleting without auth', async () => {
      await request(app.getHttpServer())
        .delete(`/services/${serviceId}`)
        .expect(401);
    });
  });

  // ── Auth after cleanup ────────────────────────────────────────────

  describe('Profile token still valid', () => {
    it('should still access profile after operations', async () => {
      const res = await request(app.getHttpServer())
        .get('/users/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(res.body.data.email).toBe(testEmail);
    });
  });
});

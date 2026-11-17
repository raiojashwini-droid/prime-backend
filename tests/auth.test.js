const request = require('supertest');
const app = require('../src/app');
const db = require('../src/config/db');

describe('Authentication & Users API', () => {
  let accessToken;
  let refreshToken;

  afterAll(async () => {
    // Close db connection after all tests
    await db.destroy();
  });

  describe('POST /api/v1/auth/login', () => {
    it('should fail with 400 when body is invalid', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'not-an-email', password: '' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should fail with 401 when password is incorrect', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'marcus.brody@primeroute.io',
          password: 'WrongPassword999'
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
    });

    it('should succeed with 200 and return tokens on valid credentials', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'marcus.brody@primeroute.io',
          password: 'Password123!'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.refreshToken).toBeDefined();
      expect(res.body.data.user.email).toBe('marcus.brody@primeroute.io');
      expect(res.body.data.user.role).toBe('owner');
      expect(res.body.data.user.password_hash).toBeUndefined();

      accessToken = res.body.data.accessToken;
      refreshToken = res.body.data.refreshToken;
    });
  });

  describe('GET /api/v1/auth/me', () => {
    it('should fail with 401 if no Bearer token is provided', async () => {
      const res = await request(app).get('/api/v1/auth/me');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should return the current user profile when valid token is supplied', async () => {
      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe('marcus.brody@primeroute.io');
      expect(res.body.data.user.name).toBe('Marcus Brody');
      expect(res.body.data.user.role).toBe('owner');
    });
  });

  describe('POST /api/v1/auth/refresh-token', () => {
    it('should generate a new access token using a valid refresh token', async () => {
      const res = await request(app)
        .post('/api/v1/auth/refresh-token')
        .send({ refreshToken });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.accessToken).toBeDefined();
    });
  });

  describe('GET /api/v1/users', () => {
    it('should return list of users when requested by Owner', async () => {
      const res = await request(app)
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.items.length).toBeGreaterThan(0);
      expect(res.body.data.pagination).toBeDefined();
    });
  });
});

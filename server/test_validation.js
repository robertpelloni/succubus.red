import * as chai from 'chai';
import supertest from 'supertest';
import { app, server } from './index.js';

const expect = chai.expect;
const request = supertest(app);

describe('Backend Edge-Case & Validation Tests', () => {
  let authToken;

  before(async () => {
    const res = await request
      .post('/api/auth/login')
      .send({ username: 'validation_tester' });
    authToken = res.body.token;
  });

  after(() => {
    if (server) {
      server.close();
    }
  });

  describe('Authentication Layer', () => {
    it('should reject login without a username', async () => {
      const res = await request.post('/api/auth/login').send({});
      expect(res.status).to.equal(400);
      expect(res.body).to.have.property('error');
    });

    it('should reject login with non-string username type', async () => {
      const res = await request.post('/api/auth/login').send({ username: 12345 });
      expect(res.status).to.equal(400);
    });

    it('should reject access to /api/settings with an invalid token signature', async () => {
      const res = await request.get('/api/settings').set('Authorization', `Bearer fake.jwt.token`);
      expect(res.status).to.equal(403);
    });
  });

  describe('/api/settings Validation', () => {
    it('should reject unknown schema keys during POST', async () => {
      const res = await request
        .post('/api/settings')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ maliciousInjection: true, ttsPitch: 1.0 });

      expect(res.status).to.equal(400);
      expect(res.body).to.have.property('error');
    });

    it('should reject invalid types (e.g. string for a float field)', async () => {
      const res = await request
        .post('/api/settings')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ ttsPitch: "not_a_number" });

      expect(res.status).to.equal(400);
    });
  });

  describe('/api/chat Validation', () => {
    it('should reject chat requests without userMessages array', async () => {
      const res = await request.post('/api/chat').send({ characterSystemPrompt: "Hello" });
      expect(res.status).to.equal(400);
    });

    it('should reject chat requests if userMessages is not an array', async () => {
      const res = await request.post('/api/chat').send({ userMessages: "just a string", characterSystemPrompt: "Hello" });
      expect(res.status).to.equal(400);
    });
  });
});

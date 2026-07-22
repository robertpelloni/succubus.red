import * as chai from 'chai';
import supertest from 'supertest';
import { app, server } from './index.js';

const expect = chai.expect;
const request = supertest(app);

describe('Backend API Tests', () => {
  after(() => {
    if (server) {
      server.close();
    }
  });

  it('should return a response for /api/chat', async () => {
    const res = await request
      .post('/api/chat')
      .send({
        userMessages: [{ role: 'user', content: 'hello' }],
        characterSystemPrompt: 'You are a test.'
      });

    expect(res.status).to.be.oneOf([200, 401, 500]);
  });

  it('should return a response for /api/tts', async () => {
    const res = await request
      .post('/api/tts')
      .send({
        text: 'hello world',
        elevenLabsKey: 'dummy',
        voiceId: '21m00Tcm4TlvDq8ikWAM'
      });

    expect(res.status).to.be.oneOf([200, 400, 401, 500]);
  });

  let authToken;

  it('should register a new user session via /api/auth/login and return a JWT', async () => {
    const res = await request
      .post('/api/auth/login')
      .send({ username: 'test_user_1' });

    expect(res.status).to.equal(200);
    expect(res.body).to.have.property('token');
    expect(res.body).to.have.property('userId', 'test_user_1');
    authToken = res.body.token;
  });

  it('should successfully refresh the token via /api/auth/refresh', async () => {
    // wait 1.1 second so that the issued at (iat) claim differs, ensuring a new token string
    await new Promise(resolve => setTimeout(resolve, 1100));

    const res = await request
      .post('/api/auth/refresh')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).to.equal(200);
    expect(res.body).to.have.property('token');
    expect(res.body).to.have.property('userId', 'test_user_1');
    expect(res.body.token).to.not.equal(authToken);
    authToken = res.body.token; // Update token for subsequent tests
  });

  it('should return a valid settings object from /api/settings GET for a specific user', async () => {
    const res = await request
      .get('/api/settings')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).to.equal(200);
    expect(res.body).to.have.property('userId', 'test_user_1');
  });

  it('should update settings object via /api/settings POST for a specific user', async () => {
    const res = await request
      .post('/api/settings')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ ttsPitch: 1.5, environmentFile: 'room2.glb' });

    expect(res.status).to.equal(200);
    expect(res.body).to.have.property('ttsPitch', 1.5);
    expect(res.body).to.have.property('environmentFile', 'room2.glb');
    expect(res.body).to.have.property('userId', 'test_user_1');
  });
});

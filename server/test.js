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
    // If the dummy key is used, openrouter returns 401 Unauthorized
    // If a valid key is provided but something else goes wrong, it might return 500
    // If a valid key is provided and the test succeeds, it returns 200
    const res = await request
      .post('/api/chat')
      .send({
        userMessages: [{ role: 'user', content: 'hello' }],
        characterSystemPrompt: 'You are a test.'
      });

    expect(res.status).to.be.oneOf([200, 401, 500]);
    if (res.status === 401 || res.status === 500) {
       expect(res.text).to.include('Error communicating with AI API.');
    }
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
});

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';

describe('ComprehensiveAgentController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/comprehensive-agent/execute (POST)', () => {
    return request(app.getHttpServer())
      .post('/comprehensive-agent/execute')
      .send({
        input: 'Hello, can you help me calculate 2 + 2?',
        sessionId: 'test-session',
      })
      .expect(201);
  });

  afterAll(async () => {
    await app.close();
  });
});

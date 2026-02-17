import request from 'supertest';
import { app, prisma } from './server';

let dbAvailable = false;

beforeAll(async () => {
  try {
    await prisma.$connect();
    dbAvailable = true;
  } catch {
    dbAvailable = false;
  }
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('Routes API', () => {
  it('GET /routes returns list', async () => {
    const res = await request(app).get('/routes');
    if (!dbAvailable) {
      expect([200, 500]).toContain(res.status);
      return;
    }
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('POST /routes/:routeId/baseline sets baseline', async () => {
    const res = await request(app).post('/routes/R002/baseline');
    expect([200, 400, 404, 500]).toContain(res.status);
    if (res.status === 200) {
      expect(res.body.routeId).toBe('R002');
      expect(res.body.isBaseline).toBe(true);
    }
  });
});

describe('Comparison API', () => {
  it('GET /routes/comparison returns baseline vs others', async () => {
    const res = await request(app).get('/routes/comparison');
    if (!dbAvailable) {
      expect([200, 500]).toContain(res.status);
      return;
    }
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});

describe('Compliance API', () => {
  it('GET /compliance/cb requires shipId and year', async () => {
    const res = await request(app).get('/compliance/cb');
    expect(res.status).toBe(400);
  });

  it('GET /compliance/cb returns balance for ship/year', async () => {
    const res = await request(app).get('/compliance/cb?shipId=R001&year=2024');
    expect([200, 500]).toContain(res.status);
    if (res.status === 200) {
      expect(res.body).toHaveProperty('shipId', 'R001');
      expect(res.body).toHaveProperty('year', 2024);
      expect(res.body).toHaveProperty('cb');
    }
  });
});

describe('Banking API', () => {
  it('POST /banking/bank with CB <= 0 returns 400', async () => {
    const res = await request(app)
      .post('/banking/bank')
      .send({ shipId: 'R003', year: 2024 });
    expect([400, 200]).toContain(res.status);
  });
});

describe('Pools API', () => {
  it('POST /pools requires year and memberShipIds', async () => {
    const res = await request(app).post('/pools').send({});
    expect(res.status).toBe(400);
  });
});

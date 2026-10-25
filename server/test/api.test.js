// HTTP tests for routing, validation and error handling. These never reach MongoDB:
// every request here is rejected before a database call is made.
import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import { localDaysFromToday } from '@mab/shared';
import { createApp } from '../src/app.js';

let server;
let baseUrl;

before(async () => {
  server = createApp({ clientOrigins: ['http://localhost:5173'] }).listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  baseUrl = `http://localhost:${server.address().port}/api`;
});

after(() => server.close());

const send = async (method, path, body) => {
  const res = await fetch(baseUrl + path, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });
  return { status: res.status, body: await res.json() };
};

const ID = '507f1f77bcf86cd799439011';

test('health check responds ok with a request id', async () => {
  const res = await fetch(`${baseUrl}/health`);
  assert.equal(res.status, 200);
  assert.ok(res.headers.get('x-request-id'));
});

test('invalid patient is rejected with a message per field', async () => {
  const { status, body } = await send('POST', '/patients', { fullName: 'A', nic: '123', gender: 'Robot' });
  assert.equal(status, 400);
  assert.equal(body.error.code, 'VALIDATION_ERROR');
  assert.equal(body.error.fieldErrors.fullName, 'Full name must be at least 2 characters');
  assert.match(body.error.fieldErrors.nic, /valid NIC/);
  assert.equal(body.error.fieldErrors.gender, 'Choose a gender');
  assert.equal(body.error.fieldErrors.phone, 'Phone number is required');
});

test('doctor with impossible working hours is rejected', async () => {
  const { status, body } = await send('POST', '/doctors', {
    fullName: 'Test Doctor',
    specialty: 'ENT',
    registrationNo: '12345',
    email: 'test@example.com',
    phone: '0771234567',
    consultationFee: 1000,
    availableDays: ['Monday'],
    startTime: '12:00',
    endTime: '11:00',
    slotMinutes: 15,
  });
  assert.equal(status, 400);
  assert.match(body.error.fieldErrors.endTime, /after the start time/);
});

test('appointments in the past or with unknown fields are rejected', async () => {
  const past = await send('POST', '/appointments', {
    patient: ID,
    doctor: ID,
    date: localDaysFromToday(-2),
    time: '09:00',
    reason: 'Headache',
  });
  assert.equal(past.status, 400);
  assert.equal(past.body.error.fieldErrors.date, 'The date cannot be in the past');

  const extra = await send('POST', '/appointments', { patient: ID, doctor: ID, status: 'Completed' });
  assert.equal(extra.status, 400);
  assert.match(extra.body.error.message, /status/);
});

test('malformed JSON returns 400, not 500', async () => {
  const { status, body } = await send('POST', '/patients', '{"fullName":');
  assert.equal(status, 400);
  assert.equal(body.error.code, 'INVALID_JSON');
});

test('bad list and slot query parameters are rejected', async () => {
  assert.equal((await send('GET', '/patients?limit=1000')).status, 400);
  assert.equal((await send('GET', '/appointments?when=tomorrow')).status, 400);
  assert.equal((await send('GET', `/doctors/${ID}/slots?date=next-week`)).status, 400);
});

test('malformed ids and unknown routes return 404', async () => {
  assert.equal((await send('GET', '/doctors/not-an-id')).status, 404);
  assert.equal((await send('DELETE', '/appointments/123')).status, 404);
  assert.equal((await send('GET', '/nurses')).status, 404);
});

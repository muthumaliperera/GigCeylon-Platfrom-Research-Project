import { check, sleep } from 'k6';
import { SEEKER_PASS, SEEKER_USER, login } from './common.js';

export const options = {
  vus: 10,
  duration: '1m',
  thresholds: {
    'http_req_duration{scenario:default}': ['p(95)<300'],
    'http_req_failed': ['rate<0.01'],
  },
};

export default function () {
  const token = login(SEEKER_USER, SEEKER_PASS);
  check(token, { 'token obtained': (t) => typeof t === 'string' && t.length > 10 });
  sleep(1);
}
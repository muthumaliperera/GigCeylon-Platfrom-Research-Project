import { check, sleep } from 'k6';
import http from 'k6/http';
import { ADMIN_PASS, ADMIN_USER, BASE_URL, login } from './common.js';

export const options = {
  vus: 25,
  duration: '1m',
  thresholds: {
    'http_req_duration{endpoint:admin_stats}': ['p(95)<300'],
    'http_req_failed{endpoint:admin_stats}': ['rate<0.01'],
  },
};

export function setup() {
  return { token: login(ADMIN_USER, ADMIN_PASS) };
}

export default function ({ token }) {
  const res = http.get(`${BASE_URL}/admin/dashboard/stats`, {
    headers: { Authorization: `Bearer ${token}` },
    tags: { endpoint: 'admin_stats', name: 'GET /admin/dashboard/stats' },
  });
  check(res, { '200 OK': (r) => r.status === 200 });
  sleep(0.5);
}
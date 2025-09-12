import { check, sleep } from 'k6';
import http from 'k6/http';
import { BASE_URL } from './common.js';

export const options = {
  stages: [
    { duration: '2m', target: 10 },
    { duration: '3m', target: 50 },
    { duration: '3m', target: 100 },
    { duration: '2m', target: 200 },
    { duration: '2m', target: 0 },
  ],
  thresholds: {
    'http_req_failed': ['rate<0.02'],
    'http_req_duration': ['p(95)<800'],
  },
};

export default function () {
  const res = http.get(`${BASE_URL}/jobs/public?page=1`, { tags: { name: 'GET /jobs/public' } });
  check(res, { '200 OK': (r) => r.status === 200 });
  sleep(0.2);
}
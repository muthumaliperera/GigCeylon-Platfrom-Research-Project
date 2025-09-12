import { check, sleep } from 'k6';
import http from 'k6/http';
import { BASE_URL } from './common.js';

export const options = {
  scenarios: {
    ramping_load: {
      executor: 'ramping-arrival-rate',
      startRate: 20,
      timeUnit: '1s',
      preAllocatedVUs: 50,
      maxVUs: 300,
      stages: [
        { target: 20, duration: '30s' },   // warm-up
        { target: 60, duration: '30s' },   // light
        { target: 120, duration: '30s' },  // moderate
        { target: 180, duration: '30s' },  // high
        { target: 220, duration: '30s' },  // peak
      ],
    },
  },
  thresholds: {
    'http_req_duration{endpoint:jobs_list}': ['p(95)<500'],
    'http_req_failed{endpoint:jobs_list}': ['rate<0.01'],
  },
};

export default function () {
  const res = http.get(`${BASE_URL}/jobs/public?page=1`, { tags: { endpoint: 'jobs_list', name: 'GET /jobs/public' }, timeout: '60s' });
  check(res, { '200 OK': (r) => r.status === 200 });
  sleep(0.2);
}
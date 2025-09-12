// tests/perf/common.js
import { check } from 'k6';
import http from 'k6/http';

export const BASE_URL = __ENV.BASE_URL || 'https://flexera-production.up.railway.app'; // backend API base
export const ADMIN_USER = __ENV.ADMIN_USER || 'admin@example.com';
export const ADMIN_PASS = __ENV.ADMIN_PASS || 'password';
export const SEEKER_USER = __ENV.SEEKER_USER || 'seeker@example.com';
export const SEEKER_PASS = __ENV.SEEKER_PASS || 'password';

export function login(username, password) {
  const res = http.post(`${BASE_URL}/auth/login`, JSON.stringify({ email: username, password }), {
    headers: { 'Content-Type': 'application/json' },
    tags: { name: 'POST /auth/login' },
  });
  // Some responses might have an empty body if the connection was closed prematurely; guard JSON parsing
  let json;
  try {
    json = res.body && res.body.length > 0 ? res.json() : null;
  } catch (e) {
    json = null;
  }
  // Support both { token } and { access_token } response shapes
  const token = json && (json.token || json.access_token);
  check(res, {
    'login status 200/201': (r) => r.status === 200 || r.status === 201,
    'has token': () => typeof token === 'string' && token.length > 0,
  });
  return token;
}
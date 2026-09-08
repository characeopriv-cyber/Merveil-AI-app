import http from 'k6/http';
import { check, sleep } from 'k6';

const base = (__ENV.MACHINE_CONNECT_BASE_URL || 'http://localhost:4100').replace(/\/$/, '');

export const options = {
  scenarios: {
    smoke: { executor: 'constant-vus', vus: Number(__ENV.VUS || 2), duration: __ENV.DURATION || '30s' },
  },
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<1000'],
  },
};

export default function () {
  const response = http.get(`${base}/api/health`);
  check(response, { 'health is 200': (r) => r.status === 200 });
  sleep(1);
}

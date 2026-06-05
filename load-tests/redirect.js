import http from "k6/http";
import { check } from "k6";

export const options = {
  scenarios: {
    redirect_rps: {
      executor: "constant-arrival-rate",
      rate: Number(__ENV.RATE ?? 5000),
      timeUnit: "1s",
      duration: __ENV.DURATION ?? "1m",
      preAllocatedVUs: Number(__ENV.VUS ?? 1000),
      maxVUs: Number(__ENV.MAX_VUS ?? 3000)
    }
  },
  thresholds: {
    http_req_failed: ["rate<0.01"],
    http_req_duration: ["p(95)<100"]
  }
};

const BASE_URL = __ENV.BASE_URL ?? "http://localhost:4000";
const CODE = __ENV.CODE ?? "1";

export default function () {
  const response = http.get(`${BASE_URL}/${CODE}`, {
    redirects: 0
  });

  check(response, {
    "redirects with 301": (res) => res.status === 301,
    "has location header": (res) => Boolean(res.headers.Location)
  });
}

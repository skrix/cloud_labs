# Load test report

- Target: http://iot-hub-alb-1166736911.eu-north-1.elb.amazonaws.com
- Profile: ramp 0→40 VUs in 3m, 5m at 40 VUs, ramp down in 2m
- History: 1440 readings per device (uploaded in setup, not measured)
- Devices scenario: 200 readings/s from 50 devices
- Finished: 2026-11-10T20:13:06.667Z

| Metric | Value |
|---|---|
| Requests | 38650 |
| Throughput | 60.6 req/s |
| Iterations (1 write + 9 reads) | 3865 |
| Stats cache hits | 92.3 % |
| Error rate | 0.00 % |
| Latency p50 | 158 ms |
| Latency p95 | 439 ms |
| Latency p99 | 885 ms |
| Latency max | 18450 ms |
| New reading readable right after the write | 16.5 % |
| Previous reading readable one iteration later | 31.5 % |
| Devices: readings sent | 86103 (135.0 req/s) |
| Devices: error rate | 0.00 % |
| Devices: latency p50 / p95 / p99 | 191 ms / 454 ms / 1775 ms |

| Endpoint | p50 | p95 | p99 |
|---|---|---|---|
| `POST /ingest` | 172 ms | 382 ms | 664 ms |
| `GET /user-devices/:id/readings/:readingId (just written)` | 209 ms | 542 ms | 1483 ms |
| `GET /user-devices/:id/readings/:readingId` | 208 ms | 548 ms | 1263 ms |
| `GET /user-devices/:id/readings` | 201 ms | 520 ms | 1066 ms |
| `GET /user-devices/:id/readings/stats` | 162 ms | 391 ms | 774 ms |
| `GET /user-devices/:id` | 140 ms | 336 ms | 714 ms |
| `GET /user-devices` | 136 ms | 339 ms | 693 ms |
| `GET /devices/:id` | 139 ms | 344 ms | 727 ms |
| `GET /devices` | 137 ms | 331 ms | 698 ms |
| `GET /firmwares?deviceId=` | 136 ms | 336 ms | 683 ms |

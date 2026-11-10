# Load test report

- Target: http://iot-hub-alb-1166736911.eu-north-1.elb.amazonaws.com
- Profile: ramp 0→100 VUs in 3m, 5m at 100 VUs, ramp down in 2m
- History: 1440 readings per device (uploaded in setup, not measured)
- Finished: 2026-11-10T12:27:15.853Z

| Metric | Value |
|---|---|
| Requests | 85210 |
| Throughput | 130.4 req/s |
| Iterations (1 write + 9 reads) | 8521 |
| Error rate | 0.01 % |
| Latency p50 | 249 ms |
| Latency p95 | 636 ms |
| Latency p99 | 1035 ms |
| Latency max | 4041 ms |

| Endpoint | p50 | p95 | p99 |
|---|---|---|---|
| `POST /ingest` | 450 ms | 800 ms | 1305 ms |
| `GET /user-devices/:id/readings/:readingId` | 383 ms | 688 ms | 1158 ms |
| `GET /user-devices/:id/readings` | 383 ms | 684 ms | 1149 ms |
| `GET /user-devices/:id/readings/stats` | 400 ms | 712 ms | 1193 ms |
| `GET /user-devices/:id` | 201 ms | 413 ms | 768 ms |
| `GET /user-devices` | 207 ms | 421 ms | 745 ms |
| `GET /devices/:id` | 207 ms | 416 ms | 743 ms |
| `GET /devices` | 202 ms | 419 ms | 745 ms |
| `GET /firmwares?deviceId=` | 201 ms | 418 ms | 748 ms |

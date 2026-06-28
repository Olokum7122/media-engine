# Pipeline Diagram

```text
Client App
  |
  | create request
  v
Media Request
  |
  | register rights/origin
  v
Rights Policy
  |
  | register original
  v
Original Media
  |
  | queue job
  v
Processing Worker
  |
  | variants
  v
Media Variants
  |
  | validate ready
  v
Ready Payload
  |
  | consume
  v
Antojados Post / Feed / Sponsor / Event
```

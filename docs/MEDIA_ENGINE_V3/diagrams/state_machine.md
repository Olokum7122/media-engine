# State Machine

```text
received -> uploading -> uploaded -> queued -> processing -> ready

processing -> failed
processing -> rejected
received -> canceled
queued -> canceled
processing -> canceled
ready -> removed only by administrative takedown flow outside normal status
```

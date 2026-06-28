# Processing Flow

```text
Image:
original -> metadata -> exif fix -> strip metadata -> thumb/grid/feed/full -> watermark policy -> ready payload

Video:
original -> metadata -> transcode -> preview -> short/feed_video -> watermark policy -> ready payload

External:
original -> metadata -> preserve external watermark -> normalized variants -> no Antojados watermark by default -> restricted/demo policy
```

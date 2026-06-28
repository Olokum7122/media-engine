'use strict';
/**
 * mediaProcessor.js — Procesamiento de imágenes y videos en variantes.
 *
 * Imágenes (sharp):
 *   thumb  → 400 px   WebP q80   (listas, thumbnails, avatares)
 *   feed   → 1080 px  WebP q82   (feed normal)
 *   full   → 1920 px  WebP q85   (fullscreen tap)
 *
 * Videos (ffmpeg-static + fluent-ffmpeg):
 *   thumb_frame → 400 px  JPG   (primer frame, poster)
 *   video_720   → 720p    MP4   (feed)
 *   video_1080  → 1080p   MP4   (fullscreen)
 *
 * Todas las funciones reciben la ruta del raw file y devuelven { variantPath, url }.
 * El caller (mediaIntakeWorker) es responsable de borrar el raw file al terminar.
 */

const sharp       = require('sharp');
const ffmpeg      = require('fluent-ffmpeg');
const ffmpegPath  = require('ffmpeg-static');
const ffprobePath = require('@ffprobe-installer/ffprobe').path;
const pathMod     = require('path');
const fs          = require('fs');

ffmpeg.setFfmpegPath(ffmpegPath);
ffmpeg.setFfprobePath(ffprobePath);

// ─── Configuración de variantes ───────────────────────────────────────────────

const IMAGE_VARIANTS = [
  { key: 'thumb', suffix: '_thumb', width: 400,  quality: 80 },
  { key: 'feed',  suffix: '_feed',  width: 1080, quality: 82 },
  { key: 'full',  suffix: '_full',  width: 1920, quality: 85 },
];

const VIDEO_VARIANTS = [
  { key: 'video_720', suffix: '_720', height: 720, videoBitrate: '1500k', audioBitrate: '128k' },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function _buildUrl(baseUrl, filename) {
  const base = String(baseUrl || '').trim().replace(/\/+$/, '');
  return base ? `${base}/uploads/${filename}` : `/uploads/${filename}`;
}

function _variantPath(uploadsDir, basename, suffix, ext) {
  return pathMod.join(uploadsDir, `${basename}${suffix}.${ext}`);
}

// ─── Procesamiento de imágenes ────────────────────────────────────────────────

/**
 * Genera las 3 variantes WebP de una imagen.
 *
 * @param {string} rawPath   - ruta absoluta al archivo crudo
 * @param {string} uploadsDir
 * @param {string} baseUrl   - API_BASE_URL del servidor
 * @returns {Promise<{ thumb_url, feed_url, full_url }>}
 */
async function processImage(rawPath, uploadsDir, baseUrl) {
  const basename = pathMod.basename(rawPath, pathMod.extname(rawPath));
  const results  = {};

  for (const v of IMAGE_VARIANTS) {
    const filename    = `${basename}${v.suffix}.webp`;
    const outputPath  = pathMod.join(uploadsDir, filename);

    await sharp(rawPath)
      .resize({ width: v.width, withoutEnlargement: true })
      .webp({ quality: v.quality })
      .toFile(outputPath);

    results[`${v.key}_url`] = _buildUrl(baseUrl, filename);
  }

  // thumb_url → feed_url → full_url
  return {
    thumb_url: results.thumb_url,
    feed_url:  results.feed_url,
    full_url:  results.full_url,
  };
}

// ─── Procesamiento de videos ──────────────────────────────────────────────────

/**
 * Genera el frame thumbnail JPG y las 2 variantes MP4 de un video.
 *
 * @param {string} rawPath
 * @param {string} uploadsDir
 * @param {string} baseUrl
 * @returns {Promise<{ thumb_url, video_720_url, video_1080_url }>}
 */
async function processVideo(rawPath, uploadsDir, baseUrl) {
  const basename = pathMod.basename(rawPath, pathMod.extname(rawPath));

  // 1. Thumbnail JPG del primer frame
  const thumbFilename = `${basename}_thumb.jpg`;
  const thumbPath     = pathMod.join(uploadsDir, thumbFilename);
  await _extractVideoThumb(rawPath, thumbPath, uploadsDir);

  // 2. Variantes MP4
  const videoUrls = {};
  for (const v of VIDEO_VARIANTS) {
    const filename   = `${basename}${v.suffix}.mp4`;
    const outputPath = pathMod.join(uploadsDir, filename);
    await _transcodeVideo(rawPath, outputPath, v);
    videoUrls[`${v.key}_url`] = _buildUrl(baseUrl, filename);
  }

  return {
    thumb_url:     _buildUrl(baseUrl, thumbFilename),
    video_720_url: videoUrls.video_720_url,
  };
}

function _extractVideoThumb(inputPath, outputPath, uploadsDir) {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .screenshots({
        count:    1,
        folder:   uploadsDir,
        filename: pathMod.basename(outputPath),
        size:     '400x?',
      })
      .on('end',   () => { console.log('[mediaProcessor] thumb OK:', outputPath); resolve(); })
      .on('error', (err) => { console.error('[mediaProcessor] thumb ERROR:', err.message); reject(err); });
  });
}

function _transcodeVideo(inputPath, outputPath, variant) {
  return new Promise((resolve, reject) => {
    console.log(`[mediaProcessor] transcode ${variant.height}p: ${inputPath} -> ${outputPath}`);
    ffmpeg(inputPath)
      .output(outputPath)
      .videoCodec('libx264')
      .audioCodec('aac')
      .size(`?x${variant.height}`)
      .videoBitrate(variant.videoBitrate)
      .audioBitrate(variant.audioBitrate)
      .outputOptions(['-movflags', '+faststart', '-pix_fmt', 'yuv420p'])
      .on('end',   () => { console.log('[mediaProcessor] transcode OK:', outputPath); resolve(); })
      .on('error', (err) => { console.error('[mediaProcessor] transcode ERROR:', err.message); reject(err); })
      .on('stderr', (line) => { if (line.includes('Error') || line.includes('error')) console.warn('[ffmpeg]', line); })
      .run();
  });
}

module.exports = { processImage, processVideo };

const express = require('express');
const router = express.Router();
const db = require('../db');
const { generateCode, normalizeUrl } = require('../utils/urlHelpers');

/**
 * POST /shorten or /api/shorten
 * Body: { longUrl: string }
 */
router.post('/shorten', async (req, res) => {
  try {
    const rawUrl = req.body.longUrl || req.body.url;
    const longUrl = normalizeUrl(rawUrl);

    if (!longUrl) {
      return res.status(400).json({
        success: false,
        error: 'Invalid URL format. Please provide a valid web link (e.g. https://example.com).'
      });
    }

    // 1. Check if URL already exists in database (No Duplicates requirement)
    const existingResult = await db.query(
      'SELECT id, long_url, short_code, clicks, created_at FROM urls WHERE long_url = $1',
      [longUrl]
    );

    const baseUrl = (process.env.BASE_URL || `${req.protocol}://${req.get('host')}`).replace(/\/$/, '');

    if (existingResult.rows.length > 0) {
      const existingRecord = existingResult.rows[0];
      return res.status(200).json({
        success: true,
        isExisting: true,
        shortCode: existingRecord.short_code,
        shortUrl: `${baseUrl}/${existingRecord.short_code}`,
        longUrl: existingRecord.long_url,
        clicks: existingRecord.clicks,
        createdAt: existingRecord.created_at
      });
    }

    // 2. Generate unique short code with collision handling
    let shortCode = '';
    let isUnique = false;
    let attempts = 0;
    const maxAttempts = 10;

    while (!isUnique && attempts < maxAttempts) {
      shortCode = generateCode(6);
      attempts++;
      const checkCode = await db.query('SELECT id FROM urls WHERE short_code = $1', [shortCode]);
      if (checkCode.rows.length === 0) {
        isUnique = true;
      }
    }

    if (!isUnique) {
      return res.status(500).json({
        success: false,
        error: 'Failed to generate a unique short code. Please try again.'
      });
    }

    // 3. Save new URL mapping in PostgreSQL
    const insertResult = await db.query(
      'INSERT INTO urls (long_url, short_code) VALUES ($1, $2) RETURNING id, long_url, short_code, clicks, created_at',
      [longUrl, shortCode]
    );

    const newRecord = insertResult.rows[0];

    return res.status(201).json({
      success: true,
      isExisting: false,
      shortCode: newRecord.short_code,
      shortUrl: `${baseUrl}/${newRecord.short_code}`,
      longUrl: newRecord.long_url,
      clicks: newRecord.clicks,
      createdAt: newRecord.created_at
    });
  } catch (error) {
    console.error('Error in /shorten:', error);
    return res.status(500).json({
      success: false,
      error: 'An internal server error occurred while shortening the URL.'
    });
  }
});

/**
 * GET /api/stats/:shortcode
 * Fetch analytics data for a given short code
 */
router.get('/api/stats/:shortcode', async (req, res) => {
  try {
    const { shortcode } = req.params;
    const result = await db.query(
      'SELECT id, long_url, short_code, clicks, created_at FROM urls WHERE short_code = $1',
      [shortcode]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Short URL not found.'
      });
    }

    const record = result.rows[0];
    const baseUrl = (process.env.BASE_URL || `${req.protocol}://${req.get('host')}`).replace(/\/$/, '');

    return res.status(200).json({
      success: true,
      shortCode: record.short_code,
      shortUrl: `${baseUrl}/${record.short_code}`,
      longUrl: record.long_url,
      clicks: record.clicks,
      createdAt: record.created_at
    });
  } catch (error) {
    console.error('Error in /api/stats:', error);
    return res.status(500).json({ success: false, error: 'Database query error.' });
  }
});

module.exports = router;

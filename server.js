const express = require('express');
const path = require('path');
const cors = require('cors');
require('dotenv').config();

// Supabase database adapter
const db = require('./db');

const urlRoutes = require('./routes/urlRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static frontend files
app.use(express.static(path.join(__dirname, 'public')));

// Mount API & Shorten Routes (Supports both POST /shorten and POST /api/shorten)
app.use('/', urlRoutes);
app.use('/api', urlRoutes);

/**
 * GET /:shortcode
 * Redirects shortcode to the original long URL with 302 Found
 */
app.get('/:shortcode', async (req, res, next) => {
  const { shortcode } = req.params;

  // Ignore static assets or system requests like favicon.ico
  if (shortcode === 'favicon.ico' || shortcode === 'robots.txt') {
    return res.status(404).end();
  }

  try {
    // 1. Look up shortcode in PostgreSQL
    const result = await db.query(
      'SELECT id, long_url, clicks FROM urls WHERE short_code = $1',
      [shortcode]
    );

    if (result.rows.length === 0) {
      // Clean 404 Not Found page
      return res.status(404).send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>404 - Link Not Found</title>
          <link rel="stylesheet" href="/style.css">
          <link rel="preconnect" href="https://fonts.googleapis.com">
          <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
          <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700&display=swap" rel="stylesheet">
        </head>
        <body class="error-body">
          <div class="glass-card error-card">
            <div class="error-icon">⚡</div>
            <h1>404 - Link Not Found</h1>
            <p>The short link <code>${req.params.shortcode}</code> does not exist or has been removed.</p>
            <a href="/" class="primary-btn flex-center">Back to URL Shortener</a>
          </div>
        </body>
        </html>
      `);
    }

    const record = result.rows[0];

    // 2. Increment click count asynchronously
    db.query('UPDATE urls SET clicks = clicks + 1 WHERE id = $1', [record.id]).catch(err => {
      console.error('Failed to update click count:', err);
    });

    // 3. 302 Redirect to long URL
    return res.redirect(302, record.long_url);
  } catch (error) {
    console.error('Error handling redirect:', error);
    return res.status(500).send('Internal Server Error');
  }
});

// Initialize database and start listening
db.initDb().then(() => {
  app.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(`🚀 URL Shortener Server running on http://localhost:${PORT}`);
    console.log(`====================================================`);
  });
});

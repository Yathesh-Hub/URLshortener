const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_ANON_KEY in .env');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Initialize database schema
async function initDb() {
  try {
    // Check if table exists (PGRST205 = relation does not exist)
    const { error } = await supabase.from('urls').select('id').limit(1);

    if (error) {
      if (error.code === 'PGRST205') {
        console.warn('⚠️  urls table not found. Please create it in Supabase SQL Editor:');
        console.warn(`
          CREATE TABLE urls (
            id BIGSERIAL PRIMARY KEY,
            long_url TEXT NOT NULL UNIQUE,
            short_code VARCHAR(10) NOT NULL UNIQUE,
            clicks INTEGER DEFAULT 0 NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
          );
          CREATE INDEX idx_urls_short_code ON urls(short_code);
          CREATE INDEX idx_urls_long_url ON urls(long_url);
        `);
        return;
      }
      console.error('Error initializing Supabase:', error.message);
      return;
    }
    console.log('✅ Connected successfully to Supabase database.');
  } catch (err) {
    console.error('Error initializing Supabase:', err.message);
  }
}

// Query helper that mimics the pg pool interface
async function query(text, params = []) {
  try {
    const sql = text.trim().toUpperCase();

    // SELECT queries
    if (sql.startsWith('SELECT')) {
      let queryBuilder = supabase.from('urls').select('*');

      if (sql.includes('WHERE LONG_URL')) {
        queryBuilder = queryBuilder.eq('long_url', params[0]);
      } else if (sql.includes('WHERE SHORT_CODE')) {
        queryBuilder = queryBuilder.eq('short_code', params[0]);
      } else if (sql.includes('WHERE ID')) {
        queryBuilder = queryBuilder.eq('id', params[0]);
      }

      const { data, error } = await queryBuilder;
      if (error) throw error;
      return { rows: data || [] };
    }

    // INSERT queries
    if (sql.startsWith('INSERT')) {
      const { data, error } = await supabase
        .from('urls')
        .insert([{ long_url: params[0], short_code: params[1] }])
        .select();
      
      if (error) throw error;
      return { rows: data || [] };
    }

    // UPDATE queries (increment clicks)
    if (sql.startsWith('UPDATE') && sql.includes('CLICKS = CLICKS + 1')) {
      // Fetch current clicks
      const { data: current, error: fetchError } = await supabase
        .from('urls')
        .select('clicks')
        .eq('id', params[0])
        .single();
      
      if (fetchError) throw fetchError;
      
      // Update with incremented value
      const { data: updated, error: updateError } = await supabase
        .from('urls')
        .update({ clicks: (current?.clicks || 0) + 1 })
        .eq('id', params[0])
        .select();
      
      if (updateError) throw updateError;
      return { rows: updated || [] };
    }

    return { rows: [] };
  } catch (err) {
    console.error('Supabase query error:', err);
    throw err;
  }
}

module.exports = {
  query,
  supabase,
  initDb
};

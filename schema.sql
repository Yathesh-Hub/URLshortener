-- Database Schema for URL Shortener

CREATE DATABASE urlshortener;

\c urlshortener;

CREATE TABLE IF NOT EXISTS urls (
    id SERIAL PRIMARY KEY,
    long_url TEXT NOT NULL UNIQUE,
    short_code VARCHAR(10) NOT NULL UNIQUE,
    clicks INTEGER DEFAULT 0 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Index for ultrafast lookups by short_code and long_url
CREATE INDEX IF NOT EXISTS idx_urls_short_code ON urls(short_code);
CREATE INDEX IF NOT EXISTS idx_urls_long_url ON urls(long_url);

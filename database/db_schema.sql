CREATE SCHEMA IF NOT EXISTS learning;
SET search_path TO learning, public;

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS dictionary_words (
    id SERIAL PRIMARY KEY,
    word VARCHAR(255) NOT NULL UNIQUE,
    hint_image_url_1 TEXT,
    hint_image_url_2 TEXT,
    hint_image_url_3 TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_progress (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    word_id INTEGER NOT NULL,
    score INTEGER DEFAULT 0 CHECK (score >= 0),
    lives_lost INTEGER DEFAULT 0 CHECK (lives_lost >= 0),
    last_interaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (word_id) REFERENCES dictionary_words(id) ON DELETE RESTRICT,

    UNIQUE (user_id, word_id)
);

CREATE INDEX IF NOT EXISTS idx_user_progress_user_id ON learning.user_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_word_id ON learning.user_progress(word_id);
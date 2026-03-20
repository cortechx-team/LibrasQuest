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
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS word_images (
    id SERIAL PRIMARY KEY,
    word_id INTEGER NOT NULL,
    image_url TEXT NOT NULL,
    position SMALLINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (word_id) REFERENCES dictionary_words(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_word_images_word_id ON learning.word_images(word_id);

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
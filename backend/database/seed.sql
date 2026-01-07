-- ============================================================================
-- Movie Explorer Platform - Complete Database Setup with Large-Scale Seed Data
-- PostgreSQL Database - Schema + 10K Movies + 5K Actors + 5K Directors + Photos
-- ============================================================================

-- ========== CLEANUP - START FRESH ==========
DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public;

DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE ' Starting Complete Database Setup';
    RAISE NOTICE '========================================';
END $$;

-- ========== TABLES ==========

-- Genres table
CREATE TABLE genres (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Directors table
CREATE TABLE directors (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    birth_date DATE,
    biography TEXT,
    photo_url VARCHAR(500),
    nationality VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Actors table
CREATE TABLE actors (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    birth_date DATE,
    biography TEXT,
    photo_url VARCHAR(500),
    nationality VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Movies table (DECIMAL(4,2) to support 10.0 rating)
CREATE TABLE movies (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    release_year INTEGER NOT NULL,
    description TEXT,
    duration_minutes INTEGER,
    rating DECIMAL(4,2) DEFAULT 0.00 CHECK (rating >= 0 AND rating <= 10),
    poster_url VARCHAR(500),
    director_id INTEGER REFERENCES directors(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Reviews table (DECIMAL(4,2) to support 10.0 rating)
CREATE TABLE reviews (
    id SERIAL PRIMARY KEY,
    movie_id INTEGER NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
    reviewer_name VARCHAR(255) NOT NULL,
    rating DECIMAL(4,2) NOT NULL CHECK (rating >= 0 AND rating <= 10),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Junction tables
CREATE TABLE movie_genre (
    movie_id INTEGER REFERENCES movies(id) ON DELETE CASCADE,
    genre_id INTEGER REFERENCES genres(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (movie_id, genre_id)
);

CREATE TABLE movie_actor (
    movie_id INTEGER REFERENCES movies(id) ON DELETE CASCADE,
    actor_id INTEGER REFERENCES actors(id) ON DELETE CASCADE,
    role VARCHAR(200),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (movie_id, actor_id)
);

-- Favorites table
CREATE TABLE favorites (
    id SERIAL PRIMARY KEY,
    entity_type VARCHAR(50) NOT NULL CHECK (entity_type IN ('movie', 'actor', 'director')),
    entity_id INTEGER NOT NULL,
    user_id VARCHAR(255) DEFAULT 'default_user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(entity_type, entity_id, user_id)
);

DO $$
BEGIN
    RAISE NOTICE ' Tables created successfully';
END $$;

-- ========== INDEXES ==========

-- Performance indexes for common queries
CREATE INDEX idx_movies_title ON movies(title);
CREATE INDEX idx_movies_release_year ON movies(release_year);
CREATE INDEX idx_favorites_entity ON favorites(entity_type, entity_id);
CREATE INDEX idx_favorites_user ON favorites(user_id);
CREATE INDEX idx_movies_rating ON movies(rating DESC);
CREATE INDEX idx_movies_director ON movies(director_id);
CREATE INDEX idx_actors_name ON actors(name);
CREATE INDEX idx_directors_name ON directors(name);
CREATE INDEX idx_genres_name ON genres(name);
CREATE INDEX idx_reviews_movie ON reviews(movie_id);
CREATE INDEX idx_reviews_rating ON reviews(rating);
CREATE INDEX idx_movie_genre_genre ON movie_genre(genre_id);
CREATE INDEX idx_movie_actor_actor ON movie_actor(actor_id);

-- Full-text search indexes
CREATE INDEX idx_movies_title_fulltext ON movies USING GIN(to_tsvector('english', title));
CREATE INDEX idx_actors_name_fulltext ON actors USING GIN(to_tsvector('english', name));
CREATE INDEX idx_directors_name_fulltext ON directors USING GIN(to_tsvector('english', name));

-- Additional indexes for large dataset
CREATE INDEX idx_movies_title_lower ON movies(LOWER(title));
CREATE INDEX idx_reviews_movie_rating ON reviews(movie_id, rating DESC);
CREATE INDEX idx_directors_name_lower ON directors(LOWER(name));
CREATE INDEX idx_actors_name_lower ON actors(LOWER(name));

DO $$
BEGIN
    RAISE NOTICE ' Indexes created successfully';
END $$;

-- ========== UTILITY FUNCTIONS ==========

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate average movie rating
CREATE OR REPLACE FUNCTION calculate_movie_rating(p_movie_id INTEGER)
RETURNS DECIMAL(4,2) AS $$
DECLARE
    avg_rating DECIMAL(4,2);
BEGIN
    SELECT COALESCE(ROUND(AVG(rating)::NUMERIC, 2), 0.00)
    INTO avg_rating
    FROM reviews
    WHERE movie_id = p_movie_id;
    
    RETURN avg_rating;
END;
$$ LANGUAGE plpgsql;

-- Function to get director photo with fallback
CREATE OR REPLACE FUNCTION get_director_photo(p_director_id INTEGER)
RETURNS VARCHAR AS $$
DECLARE
    v_photo_url VARCHAR;
    v_name VARCHAR;
BEGIN
    SELECT photo_url, name INTO v_photo_url, v_name
    FROM directors
    WHERE id = p_director_id;
    
    IF v_photo_url IS NULL OR v_photo_url = '' THEN
        RETURN 'https://ui-avatars.com/api/?name=' || REPLACE(v_name, ' ', '+') || '&size=200&background=4A5568&color=fff';
    END IF;
    
    RETURN v_photo_url;
END;
$$ LANGUAGE plpgsql;

-- Function to get actor photo with fallback
CREATE OR REPLACE FUNCTION get_actor_photo(p_actor_id INTEGER)
RETURNS VARCHAR AS $$
DECLARE
    v_photo_url VARCHAR;
    v_name VARCHAR;
BEGIN
    SELECT photo_url, name INTO v_photo_url, v_name
    FROM actors
    WHERE id = p_actor_id;
    
    IF v_photo_url IS NULL OR v_photo_url = '' THEN
        RETURN 'https://ui-avatars.com/api/?name=' || REPLACE(v_name, ' ', '+') || '&size=200&background=2D3748&color=fff';
    END IF;
    
    RETURN v_photo_url;
END;
$$ LANGUAGE plpgsql;

-- Function to get movie poster with fallback
CREATE OR REPLACE FUNCTION get_movie_poster(p_movie_id INTEGER)
RETURNS VARCHAR AS $$
DECLARE
    v_poster_url VARCHAR;
    v_title VARCHAR;
BEGIN
    SELECT poster_url, title INTO v_poster_url, v_title
    FROM movies
    WHERE id = p_movie_id;
    
    IF v_poster_url IS NULL OR v_poster_url = '' THEN
        RETURN 'https://placehold.co/300x450/1A202C/FFFFFF?text=' || REPLACE(LEFT(v_title, 25), ' ', '+');
    END IF;
    
    RETURN v_poster_url;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
    RAISE NOTICE ' Utility functions created successfully';
END $$;

-- ========== MOVIE CRUD FUNCTIONS ==========

-- Create new movie
CREATE OR REPLACE FUNCTION create_movie(
    p_title VARCHAR,
    p_release_year INTEGER,
    p_description TEXT,
    p_duration_minutes INTEGER,
    p_poster_url VARCHAR DEFAULT NULL,
    p_director_id INTEGER DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
    v_movie_id INTEGER;
BEGIN
    INSERT INTO movies (title, release_year, description, duration_minutes, poster_url, director_id)
    VALUES (p_title, p_release_year, p_description, p_duration_minutes, p_poster_url, p_director_id)
    RETURNING id INTO v_movie_id;
    
    RETURN v_movie_id;
END;
$$ LANGUAGE plpgsql;

-- Update movie
CREATE OR REPLACE FUNCTION update_movie(
    p_movie_id INTEGER,
    p_title VARCHAR DEFAULT NULL,
    p_release_year INTEGER DEFAULT NULL,
    p_description TEXT DEFAULT NULL,
    p_duration_minutes INTEGER DEFAULT NULL,
    p_poster_url VARCHAR DEFAULT NULL,
    p_director_id INTEGER DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE movies
    SET 
        title = COALESCE(p_title, title),
        release_year = COALESCE(p_release_year, release_year),
        description = COALESCE(p_description, description),
        duration_minutes = COALESCE(p_duration_minutes, duration_minutes),
        poster_url = COALESCE(p_poster_url, poster_url),
        director_id = COALESCE(p_director_id, director_id)
    WHERE id = p_movie_id;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Delete movie
CREATE OR REPLACE FUNCTION delete_movie(p_movie_id INTEGER)
RETURNS BOOLEAN AS $$
BEGIN
    DELETE FROM movies WHERE id = p_movie_id;
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Get movie by ID with photos
CREATE OR REPLACE FUNCTION get_movie_by_id(p_movie_id INTEGER)
RETURNS TABLE (
    id INTEGER,
    title VARCHAR,
    release_year INTEGER,
    description TEXT,
    duration_minutes INTEGER,
    rating DECIMAL,
    poster_url VARCHAR,
    director_id INTEGER,
    director_name VARCHAR,
    director_photo VARCHAR,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        m.id,
        m.title,
        m.release_year,
        m.description,
        m.duration_minutes,
        m.rating,
        COALESCE(m.poster_url, get_movie_poster(m.id)),
        m.director_id,
        d.name as director_name,
        COALESCE(d.photo_url, get_director_photo(d.id)) as director_photo,
        m.created_at,
        m.updated_at
    FROM movies m
    LEFT JOIN directors d ON m.director_id = d.id
    WHERE m.id = p_movie_id;
END;
$$ LANGUAGE plpgsql;

-- ========== REVIEW CRUD FUNCTIONS ==========

-- Add review
CREATE OR REPLACE FUNCTION add_review(
    p_movie_id INTEGER,
    p_reviewer_name VARCHAR,
    p_rating DECIMAL,
    p_comment TEXT DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
    v_review_id INTEGER;
BEGIN
    INSERT INTO reviews (movie_id, reviewer_name, rating, comment)
    VALUES (p_movie_id, p_reviewer_name, p_rating, p_comment)
    RETURNING id INTO v_review_id;
    
    RETURN v_review_id;
END;
$$ LANGUAGE plpgsql;

-- Update review
CREATE OR REPLACE FUNCTION update_review(
    p_review_id INTEGER,
    p_rating DECIMAL DEFAULT NULL,
    p_comment TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE reviews
    SET 
        rating = COALESCE(p_rating, rating),
        comment = COALESCE(p_comment, comment)
    WHERE id = p_review_id;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Delete review
CREATE OR REPLACE FUNCTION delete_review(p_review_id INTEGER)
RETURNS BOOLEAN AS $$
BEGIN
    DELETE FROM reviews WHERE id = p_review_id;
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- ========== GENRE FUNCTIONS ==========

-- Create genre
CREATE OR REPLACE FUNCTION create_genre(
    p_name VARCHAR,
    p_description TEXT DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
    v_genre_id INTEGER;
BEGIN
    INSERT INTO genres (name, description)
    VALUES (p_name, p_description)
    RETURNING id INTO v_genre_id;
    
    RETURN v_genre_id;
END;
$$ LANGUAGE plpgsql;

-- Assign genre to movie
CREATE OR REPLACE FUNCTION assign_genre_to_movie(
    p_movie_id INTEGER,
    p_genre_id INTEGER
)
RETURNS BOOLEAN AS $$
BEGIN
    INSERT INTO movie_genre (movie_id, genre_id)
    VALUES (p_movie_id, p_genre_id)
    ON CONFLICT DO NOTHING;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Remove genre from movie
CREATE OR REPLACE FUNCTION remove_genre_from_movie(
    p_movie_id INTEGER,
    p_genre_id INTEGER
)
RETURNS BOOLEAN AS $$
BEGIN
    DELETE FROM movie_genre 
    WHERE movie_id = p_movie_id AND genre_id = p_genre_id;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- ========== ACTOR FUNCTIONS ==========

-- Create actor
CREATE OR REPLACE FUNCTION create_actor(
    p_name VARCHAR,
    p_birth_date DATE DEFAULT NULL,
    p_biography TEXT DEFAULT NULL,
    p_photo_url VARCHAR DEFAULT NULL,
    p_nationality VARCHAR DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
    v_actor_id INTEGER;
BEGIN
    INSERT INTO actors (name, birth_date, biography, photo_url, nationality)
    VALUES (p_name, p_birth_date, p_biography, p_photo_url, p_nationality)
    RETURNING id INTO v_actor_id;
    
    RETURN v_actor_id;
END;
$$ LANGUAGE plpgsql;

-- Assign actor to movie
CREATE OR REPLACE FUNCTION assign_actor_to_movie(
    p_movie_id INTEGER,
    p_actor_id INTEGER,
    p_role VARCHAR DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
    INSERT INTO movie_actor (movie_id, actor_id, role)
    VALUES (p_movie_id, p_actor_id, p_role)
    ON CONFLICT DO NOTHING;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Remove actor from movie
CREATE OR REPLACE FUNCTION remove_actor_from_movie(
    p_movie_id INTEGER,
    p_actor_id INTEGER
)
RETURNS BOOLEAN AS $$
BEGIN
    DELETE FROM movie_actor 
    WHERE movie_id = p_movie_id AND actor_id = p_actor_id;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- ========== DIRECTOR FUNCTIONS ==========

-- Create director
CREATE OR REPLACE FUNCTION create_director(
    p_name VARCHAR,
    p_birth_date DATE DEFAULT NULL,
    p_biography TEXT DEFAULT NULL,
    p_photo_url VARCHAR DEFAULT NULL,
    p_nationality VARCHAR DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
    v_director_id INTEGER;
BEGIN
    INSERT INTO directors (name, birth_date, biography, photo_url, nationality)
    VALUES (p_name, p_birth_date, p_biography, p_photo_url, p_nationality)
    RETURNING id INTO v_director_id;
    
    RETURN v_director_id;
END;
$$ LANGUAGE plpgsql;

-- Update director
CREATE OR REPLACE FUNCTION update_director(
    p_director_id INTEGER,
    p_name VARCHAR DEFAULT NULL,
    p_birth_date DATE DEFAULT NULL,
    p_biography TEXT DEFAULT NULL,
    p_photo_url VARCHAR DEFAULT NULL,
    p_nationality VARCHAR DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE directors
    SET 
        name = COALESCE(p_name, name),
        birth_date = COALESCE(p_birth_date, birth_date),
        biography = COALESCE(p_biography, biography),
        photo_url = COALESCE(p_photo_url, photo_url),
        nationality = COALESCE(p_nationality, nationality)
    WHERE id = p_director_id;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- ========== QUERY FUNCTIONS ==========

-- Get movies by genre
CREATE OR REPLACE FUNCTION get_movies_by_genre(p_genre_name VARCHAR)
RETURNS TABLE (
    movie_id INTEGER,
    movie_title VARCHAR,
    release_year INTEGER,
    rating DECIMAL,
    poster_url VARCHAR,
    director_name VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        m.id,
        m.title,
        m.release_year,
        m.rating,
        COALESCE(m.poster_url, get_movie_poster(m.id)),
        d.name
    FROM movies m
    INNER JOIN movie_genre mg ON m.id = mg.movie_id
    INNER JOIN genres g ON mg.genre_id = g.id
    LEFT JOIN directors d ON m.director_id = d.id
    WHERE g.name ILIKE '%' || p_genre_name || '%'
    ORDER BY m.rating DESC, m.release_year DESC;
END;
$$ LANGUAGE plpgsql;

-- Get movies by director
CREATE OR REPLACE FUNCTION get_movies_by_director(p_director_name VARCHAR)
RETURNS TABLE (
    movie_id INTEGER,
    movie_title VARCHAR,
    release_year INTEGER,
    rating DECIMAL,
    poster_url VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        m.id,
        m.title,
        m.release_year,
        m.rating,
        COALESCE(m.poster_url, get_movie_poster(m.id))
    FROM movies m
    INNER JOIN directors d ON m.director_id = d.id
    WHERE d.name ILIKE '%' || p_director_name || '%'
    ORDER BY m.release_year DESC;
END;
$$ LANGUAGE plpgsql;

-- Get movies by actor
CREATE OR REPLACE FUNCTION get_movies_by_actor(p_actor_name VARCHAR)
RETURNS TABLE (
    movie_id INTEGER,
    movie_title VARCHAR,
    release_year INTEGER,
    poster_url VARCHAR,
    actor_role VARCHAR,
    actor_photo VARCHAR,
    rating DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        m.id,
        m.title,
        m.release_year,
        COALESCE(m.poster_url, get_movie_poster(m.id)),
        ma.role,
        COALESCE(a.photo_url, get_actor_photo(a.id)),
        m.rating
    FROM movies m
    INNER JOIN movie_actor ma ON m.id = ma.movie_id
    INNER JOIN actors a ON ma.actor_id = a.id
    WHERE a.name ILIKE '%' || p_actor_name || '%'
    ORDER BY m.release_year DESC;
END;
$$ LANGUAGE plpgsql;

-- Search movies with full-text search
CREATE OR REPLACE FUNCTION search_movies(p_search_term VARCHAR)
RETURNS TABLE (
    movie_id INTEGER,
    movie_title VARCHAR,
    release_year INTEGER,
    rating DECIMAL,
    poster_url VARCHAR,
    director_name VARCHAR,
    director_photo VARCHAR,
    relevance REAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        m.id,
        m.title,
        m.release_year,
        m.rating,
        COALESCE(m.poster_url, get_movie_poster(m.id)),
        d.name,
        COALESCE(d.photo_url, get_director_photo(d.id)),
        ts_rank(to_tsvector('english', m.title), plainto_tsquery('english', p_search_term)) as relevance
    FROM movies m
    LEFT JOIN directors d ON m.director_id = d.id
    WHERE to_tsvector('english', m.title) @@ plainto_tsquery('english', p_search_term)
    ORDER BY relevance DESC, m.rating DESC;
END;
$$ LANGUAGE plpgsql;

-- Get all movies with pagination
CREATE OR REPLACE FUNCTION get_all_movies(
    p_limit INTEGER DEFAULT 20,
    p_offset INTEGER DEFAULT 0,
    p_order_by VARCHAR DEFAULT 'release_year',
    p_order_dir VARCHAR DEFAULT 'DESC'
)
RETURNS TABLE (
    movie_id INTEGER,
    movie_title VARCHAR,
    release_year INTEGER,
    rating DECIMAL,
    duration_minutes INTEGER,
    poster_url VARCHAR,
    director_name VARCHAR,
    director_photo VARCHAR,
    review_count BIGINT
) AS $$
DECLARE
    v_query TEXT;
BEGIN
    v_query := format('
        SELECT 
            m.id,
            m.title,
            m.release_year,
            m.rating,
            m.duration_minutes,
            COALESCE(m.poster_url, get_movie_poster(m.id)),
            d.name,
            COALESCE(d.photo_url, get_director_photo(d.id)),
            COUNT(r.id) as review_count
        FROM movies m
        LEFT JOIN directors d ON m.director_id = d.id
        LEFT JOIN reviews r ON m.id = r.movie_id
        GROUP BY m.id, m.title, m.release_year, m.rating, m.duration_minutes, m.poster_url, d.name, d.id, d.photo_url
        ORDER BY %I %s
        LIMIT %s OFFSET %s',
        p_order_by, p_order_dir, p_limit, p_offset
    );
    
    RETURN QUERY EXECUTE v_query;
END;
$$ LANGUAGE plpgsql;

-- Get top rated movies
CREATE OR REPLACE FUNCTION get_top_rated_movies(p_limit INTEGER DEFAULT 10)
RETURNS TABLE (
    movie_id INTEGER,
    movie_title VARCHAR,
    rating DECIMAL,
    poster_url VARCHAR,
    review_count BIGINT,
    director_name VARCHAR,
    director_photo VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        m.id,
        m.title,
        m.rating,
        COALESCE(m.poster_url, get_movie_poster(m.id)),
        COUNT(r.id) as review_count,
        d.name,
        COALESCE(d.photo_url, get_director_photo(d.id))
    FROM movies m
    LEFT JOIN reviews r ON m.id = r.movie_id
    LEFT JOIN directors d ON m.director_id = d.id
    GROUP BY m.id, m.title, m.rating, m.poster_url, d.name, d.id, d.photo_url
    HAVING COUNT(r.id) > 0
    ORDER BY m.rating DESC, review_count DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Get recent movies
CREATE OR REPLACE FUNCTION get_recent_movies(p_limit INTEGER DEFAULT 10)
RETURNS TABLE (
    movie_id INTEGER,
    movie_title VARCHAR,
    release_year INTEGER,
    rating DECIMAL,
    poster_url VARCHAR,
    director_name VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        m.id,
        m.title,
        m.release_year,
        m.rating,
        COALESCE(m.poster_url, get_movie_poster(m.id)),
        d.name
    FROM movies m
    LEFT JOIN directors d ON m.director_id = d.id
    ORDER BY m.release_year DESC, m.created_at DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Get movie statistics
CREATE OR REPLACE FUNCTION get_movie_statistics(p_movie_id INTEGER)
RETURNS TABLE (
    total_reviews BIGINT,
    average_rating DECIMAL,
    max_rating DECIMAL,
    min_rating DECIMAL,
    rating_distribution JSON
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(r.id)::BIGINT as total_reviews,
        COALESCE(ROUND(AVG(r.rating)::NUMERIC, 2), 0.00) as average_rating,
        COALESCE(MAX(r.rating), 0.00) as max_rating,
        COALESCE(MIN(r.rating), 0.00) as min_rating,
        json_build_object(
            'excellent', COUNT(CASE WHEN r.rating >= 8 THEN 1 END),
            'good', COUNT(CASE WHEN r.rating >= 6 AND r.rating < 8 THEN 1 END),
            'average', COUNT(CASE WHEN r.rating >= 4 AND r.rating < 6 THEN 1 END),
            'poor', COUNT(CASE WHEN r.rating < 4 THEN 1 END)
        ) as rating_distribution
    FROM reviews r
    WHERE r.movie_id = p_movie_id;
END;
$$ LANGUAGE plpgsql;

-- Get movies by year range
CREATE OR REPLACE FUNCTION get_movies_by_year_range(
    p_start_year INTEGER,
    p_end_year INTEGER
)
RETURNS TABLE (
    movie_id INTEGER,
    movie_title VARCHAR,
    release_year INTEGER,
    rating DECIMAL,
    poster_url VARCHAR,
    director_name VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        m.id,
        m.title,
        m.release_year,
        m.rating,
        COALESCE(m.poster_url, get_movie_poster(m.id)),
        d.name
    FROM movies m
    LEFT JOIN directors d ON m.director_id = d.id
    WHERE m.release_year BETWEEN p_start_year AND p_end_year
    ORDER BY m.release_year DESC, m.rating DESC;
END;
$$ LANGUAGE plpgsql;

-- Get all reviews for a movie
CREATE OR REPLACE FUNCTION get_movie_reviews(p_movie_id INTEGER)
RETURNS TABLE (
    review_id INTEGER,
    reviewer_name VARCHAR,
    rating DECIMAL,
    comment TEXT,
    created_at TIMESTAMP
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        r.id,
        r.reviewer_name,
        r.rating,
        r.comment,
        r.created_at
    FROM reviews r
    WHERE r.movie_id = p_movie_id
    ORDER BY r.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Get all actors with photos
CREATE OR REPLACE FUNCTION get_all_actors_with_photos(
    p_limit INTEGER DEFAULT 50,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
    actor_id INTEGER,
    actor_name VARCHAR,
    photo_url VARCHAR,
    birth_date DATE,
    nationality VARCHAR,
    movie_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        a.id,
        a.name,
        COALESCE(a.photo_url, get_actor_photo(a.id)),
        a.birth_date,
        a.nationality,
        COUNT(ma.movie_id) as movie_count
    FROM actors a
    LEFT JOIN movie_actor ma ON a.id = ma.actor_id
    GROUP BY a.id, a.name, a.photo_url, a.birth_date, a.nationality
    ORDER BY a.name
    LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql;

-- Get all directors with photos
CREATE OR REPLACE FUNCTION get_all_directors_with_photos(
    p_limit INTEGER DEFAULT 50,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
    director_id INTEGER,
    director_name VARCHAR,
    photo_url VARCHAR,
    birth_date DATE,
    nationality VARCHAR,
    movie_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        d.id,
        d.name,
        COALESCE(d.photo_url, get_director_photo(d.id)),
        d.birth_date,
        d.nationality,
        COUNT(m.id) as movie_count
    FROM directors d
    LEFT JOIN movies m ON d.id = m.director_id
    GROUP BY d.id, d.name, d.photo_url, d.birth_date, d.nationality
    ORDER BY d.name
    LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
    RAISE NOTICE ' Query functions created successfully';
END $$;

-- ========== TRIGGERS ==========

-- Trigger to auto-update updated_at on movies
CREATE TRIGGER update_movies_updated_at
    BEFORE UPDATE ON movies
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger to auto-update updated_at on actors
CREATE TRIGGER update_actors_updated_at
    BEFORE UPDATE ON actors
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger to auto-update updated_at on directors
CREATE TRIGGER update_directors_updated_at
    BEFORE UPDATE ON directors
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger to auto-update updated_at on genres
CREATE TRIGGER update_genres_updated_at
    BEFORE UPDATE ON genres
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger to auto-update updated_at on reviews
CREATE TRIGGER update_reviews_updated_at
    BEFORE UPDATE ON reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger function to update movie rating when review is added/updated/deleted
CREATE OR REPLACE FUNCTION update_movie_rating_on_review_change()
RETURNS TRIGGER AS $$
DECLARE
    v_movie_id INTEGER;
BEGIN
    IF TG_OP = 'DELETE' THEN
        v_movie_id := OLD.movie_id;
    ELSE
        v_movie_id := NEW.movie_id;
    END IF;
    
    UPDATE movies
    SET rating = calculate_movie_rating(v_movie_id)
    WHERE id = v_movie_id;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger to update movie rating on review changes
CREATE TRIGGER update_movie_rating_on_review
    AFTER INSERT OR UPDATE OR DELETE ON reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_movie_rating_on_review_change();

DO $$
BEGIN
    RAISE NOTICE ' Triggers created successfully';
END $$;

-- ========== VIEWS ==========

-- View for movies with full details
CREATE OR REPLACE VIEW movie_details_view AS
SELECT 
    m.id,
    m.title,
    m.release_year,
    m.description,
    m.duration_minutes,
    m.rating,
    COALESCE(m.poster_url, get_movie_poster(m.id)) as poster_url,
    d.name as director_name,
    d.id as director_id,
    COALESCE(d.photo_url, get_director_photo(d.id)) as director_photo,
    COUNT(DISTINCT r.id) as review_count,
    COUNT(DISTINCT ma.actor_id) as actor_count,
    COUNT(DISTINCT mg.genre_id) as genre_count,
    STRING_AGG(DISTINCT g.name, ', ' ORDER BY g.name) as genres,
    m.created_at,
    m.updated_at
FROM movies m
LEFT JOIN directors d ON m.director_id = d.id
LEFT JOIN reviews r ON m.id = r.movie_id
LEFT JOIN movie_actor ma ON m.id = ma.movie_id
LEFT JOIN movie_genre mg ON m.id = mg.movie_id
LEFT JOIN genres g ON mg.genre_id = g.id
GROUP BY m.id, m.title, m.release_year, m.description, m.duration_minutes, 
         m.rating, m.poster_url, d.name, d.id, d.photo_url, m.created_at, m.updated_at;

-- View for actor statistics
CREATE OR REPLACE VIEW actor_statistics_view AS
SELECT 
    a.id,
    a.name,
    a.nationality,
    COALESCE(a.photo_url, get_actor_photo(a.id)) as photo_url,
    COUNT(DISTINCT ma.movie_id) as movie_count,
    COALESCE(ROUND(AVG(m.rating)::NUMERIC, 2), 0.00) as average_movie_rating,
    STRING_AGG(DISTINCT g.name, ', ') as genres_worked_in
FROM actors a
LEFT JOIN movie_actor ma ON a.id = ma.actor_id
LEFT JOIN movies m ON ma.movie_id = m.id
LEFT JOIN movie_genre mg ON m.id = mg.movie_id
LEFT JOIN genres g ON mg.genre_id = g.id
GROUP BY a.id, a.name, a.nationality, a.photo_url;

-- View for director statistics
CREATE OR REPLACE VIEW director_statistics_view AS
SELECT 
    d.id,
    d.name,
    d.nationality,
    COALESCE(d.photo_url, get_director_photo(d.id)) as photo_url,
    COUNT(DISTINCT m.id) as movie_count,
    COALESCE(ROUND(AVG(m.rating)::NUMERIC, 2), 0.00) as average_movie_rating,
    MAX(m.release_year) as latest_movie_year,
    MIN(m.release_year) as earliest_movie_year
FROM directors d
LEFT JOIN movies m ON d.id = m.director_id
GROUP BY d.id, d.name, d.nationality, d.photo_url;

-- View for genre statistics
CREATE OR REPLACE VIEW genre_statistics_view AS
SELECT 
    g.id,
    g.name,
    COUNT(DISTINCT mg.movie_id) as movie_count,
    COALESCE(ROUND(AVG(m.rating)::NUMERIC, 2), 0.00) as average_rating
FROM genres g
LEFT JOIN movie_genre mg ON g.id = mg.genre_id
LEFT JOIN movies m ON mg.movie_id = m.id
GROUP BY g.id, g.name;

DO $$
BEGIN
    RAISE NOTICE ' Views created successfully';
END $$;

-- ============================================================================
-- SEED DATA GENERATION STARTS HERE
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE ' Starting Data Generation';
    RAISE NOTICE ' Target: 10K Movies, 5K Actors, 5K Directors';
    RAISE NOTICE ' This may take 2-3 minutes...';
    RAISE NOTICE '========================================';
END $$;

-- ========== GENRES (500 variations) ==========
DO $$
DECLARE
    base_genres TEXT[] := ARRAY[
        'Action', 'Comedy', 'Drama', 'Horror', 'Science Fiction',
        'Romance', 'Thriller', 'Fantasy', 'Crime', 'Documentary',
        'Animation', 'Adventure', 'Mystery', 'Western', 'Musical',
        'War', 'Biography', 'Historical', 'Noir', 'Sports'
    ];
    modifiers TEXT[] := ARRAY[
        'Classic', 'Modern', 'Dark', 'Light', 'Epic', 'Indie',
        'Foreign', 'Art House', 'Cult', 'Mainstream', 'Underground',
        'Experimental', 'Neo', 'Retro', 'Contemporary', 'Traditional',
        'Psychological', 'Supernatural', 'Urban', 'Rural', 'Cosmic',
        'Dystopian', 'Utopian', 'Post-Apocalyptic', 'Cyberpunk'
    ];
    i INTEGER;
    genre_name TEXT;
BEGIN
    FOR i IN 1..500 LOOP
        genre_name := modifiers[1 + (i % array_length(modifiers, 1))] || ' ' || 
                      base_genres[1 + (i % array_length(base_genres, 1))];
        
        INSERT INTO genres (name, description)
        VALUES (
            genre_name || ' ' || i,
            'A ' || genre_name || ' genre focusing on unique storytelling elements. Category ' || i
        )
        ON CONFLICT DO NOTHING;
    END LOOP;
    
    RAISE NOTICE ' Generated % genres', (SELECT COUNT(*) FROM genres);
END $$;

-- ========== DIRECTORS (5,000 with Photos) ==========
DO $$
DECLARE
    first_names TEXT[] := ARRAY[
        'James', 'John', 'Robert', 'Michael', 'William', 'David', 'Richard', 'Joseph',
        'Thomas', 'Christopher', 'Mary', 'Patricia', 'Jennifer', 'Linda', 'Elizabeth',
        'Barbara', 'Susan', 'Jessica', 'Sarah', 'Karen', 'Nancy', 'Lisa', 'Betty',
        'Margaret', 'Sandra', 'Ashley', 'Kimberly', 'Emily', 'Donna', 'Michelle',
        'Alexander', 'Daniel', 'Matthew', 'Anthony', 'Mark', 'Donald', 'Steven',
        'Paul', 'Andrew', 'Joshua', 'Kenneth', 'Kevin', 'Brian', 'George', 'Timothy',
        'Ronald', 'Edward', 'Jason', 'Jeffrey', 'Ryan', 'Jacob', 'Gary', 'Nicholas',
        'Eric', 'Jonathan', 'Stephen', 'Larry', 'Justin', 'Scott', 'Brandon', 'Benjamin'
    ];
    last_names TEXT[] := ARRAY[
        'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
        'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson',
        'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson',
        'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson', 'Walker',
        'Young', 'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores',
        'Green', 'Adams', 'Nelson', 'Baker', 'Hall', 'Rivera', 'Campbell', 'Mitchell',
        'Carter', 'Roberts', 'Gomez', 'Phillips', 'Evans', 'Turner', 'Diaz', 'Parker',
        'Cruz', 'Edwards', 'Collins', 'Reyes', 'Stewart', 'Morris', 'Morales', 'Murphy'
    ];
    countries TEXT[] := ARRAY[
        'American', 'British', 'Canadian', 'French', 'German', 'Italian', 'Spanish',
        'Japanese', 'South Korean', 'Chinese', 'Indian', 'Australian', 'Mexican',
        'Brazilian', 'Russian', 'Swedish', 'Norwegian', 'Danish', 'Dutch', 'Belgian',
        'Irish', 'Scottish', 'Polish', 'Austrian', 'Swiss', 'Portuguese', 'Greek'
    ];
    base_urls TEXT[] := ARRAY[
        'https://randomuser.me/api/portraits/men/',
        'https://randomuser.me/api/portraits/women/'
    ];
    i INTEGER;
    director_name TEXT;
BEGIN
    FOR i IN 1..5000 LOOP
        director_name := first_names[1 + (i % array_length(first_names, 1))] || ' ' || 
                        last_names[1 + ((i * 7) % array_length(last_names, 1))];
        
        INSERT INTO directors (name, birth_date, biography, nationality, photo_url)
        VALUES (
            director_name,
            DATE '1940-01-01' + (i % 25000),
            'Award-winning director with ' || (i % 50) || ' years of experience in filmmaking. Known for innovative storytelling and visual artistry.',
            countries[1 + (i % array_length(countries, 1))],
            base_urls[1 + (i % 2)] || ((i % 99) + 1) || '.jpg'
        );
        
        IF i % 1000 = 0 THEN
            RAISE NOTICE '  ... Generated % directors so far', i;
        END IF;
    END LOOP;
    
    RAISE NOTICE ' Generated % directors with photos', (SELECT COUNT(*) FROM directors);
END $$;

-- ========== ACTORS (5,000 with Photos) ==========
DO $$
DECLARE
    first_names TEXT[] := ARRAY[
        'Emma', 'Olivia', 'Ava', 'Isabella', 'Sophia', 'Charlotte', 'Mia', 'Amelia',
        'Harper', 'Evelyn', 'Liam', 'Noah', 'Oliver', 'Elijah', 'William', 'James',
        'Benjamin', 'Lucas', 'Henry', 'Alexander', 'Mason', 'Michael', 'Ethan', 'Daniel',
        'Jacob', 'Logan', 'Jackson', 'Levi', 'Sebastian', 'Mateo', 'Jack', 'Owen',
        'Theodore', 'Aiden', 'Samuel', 'Joseph', 'John', 'David', 'Wyatt', 'Matthew',
        'Luke', 'Asher', 'Carter', 'Julian', 'Grayson', 'Leo', 'Jayden', 'Gabriel',
        'Isaac', 'Lincoln', 'Anthony', 'Hudson', 'Dylan', 'Ezra', 'Thomas', 'Charles',
        'Christopher', 'Jaxon', 'Maverick', 'Josiah', 'Isaiah', 'Andrew', 'Elias', 'Joshua'
    ];
    last_names TEXT[] := ARRAY[
        'Anderson', 'Thompson', 'Martinez', 'Robinson', 'Clark', 'Rodriguez', 'Lewis',
        'Walker', 'Hall', 'Allen', 'Young', 'King', 'Wright', 'Lopez', 'Hill', 'Scott',
        'Green', 'Adams', 'Baker', 'Gonzalez', 'Nelson', 'Carter', 'Mitchell', 'Perez',
        'Roberts', 'Turner', 'Phillips', 'Campbell', 'Parker', 'Evans', 'Edwards', 'Collins',
        'Stewart', 'Sanchez', 'Morris', 'Rogers', 'Reed', 'Cook', 'Morgan', 'Bell',
        'Murphy', 'Bailey', 'Rivera', 'Cooper', 'Richardson', 'Cox', 'Howard', 'Ward',
        'Torres', 'Peterson', 'Gray', 'Ramirez', 'James', 'Watson', 'Brooks', 'Kelly',
        'Sanders', 'Price', 'Bennett', 'Wood', 'Barnes', 'Ross', 'Henderson', 'Coleman'
    ];
    countries TEXT[] := ARRAY[
        'American', 'British', 'Canadian', 'Australian', 'French', 'German', 'Italian',
        'Spanish', 'Japanese', 'South Korean', 'Chinese', 'Indian', 'Mexican', 'Brazilian',
        'Irish', 'Swedish', 'Norwegian', 'Dutch', 'Belgian', 'New Zealand'
    ];
    base_urls TEXT[] := ARRAY[
        'https://randomuser.me/api/portraits/men/',
        'https://randomuser.me/api/portraits/women/'
    ];
    i INTEGER;
    actor_name TEXT;
BEGIN
    FOR i IN 1..5000 LOOP
        actor_name := first_names[1 + (i % array_length(first_names, 1))] || ' ' || 
                     last_names[1 + ((i * 13) % array_length(last_names, 1))];
        
        INSERT INTO actors (name, birth_date, biography, nationality, photo_url)
        VALUES (
            actor_name,
            DATE '1950-01-01' + (i % 20000),
            'Versatile actor with ' || (i % 30) || ' years in the industry. Known for compelling performances across multiple genres.',
            countries[1 + (i % array_length(countries, 1))],
            base_urls[1 + (i % 2)] || ((i % 99) + 1) || '.jpg'
        );
        
        IF i % 1000 = 0 THEN
            RAISE NOTICE '  ... Generated % actors so far', i;
        END IF;
    END LOOP;
    
    RAISE NOTICE ' Generated % actors with photos', (SELECT COUNT(*) FROM actors);
END $$;

-- ========== MOVIES (10,000 with Posters) ==========
DO $$
DECLARE
    adjectives TEXT[] := ARRAY[
        'The Last', 'The First', 'The Dark', 'The Bright', 'The Lost', 'The Found',
        'The Hidden', 'The Secret', 'The Forgotten', 'The Eternal', 'The Silent',
        'The Loud', 'The Ancient', 'The Modern', 'The Wild', 'The Tame', 'The Broken',
        'The Perfect', 'The Twisted', 'The Straight', 'The Rising', 'The Falling',
        'The Sacred', 'The Cursed', 'The Blessed', 'The Damned', 'The Frozen', 'The Burning'
    ];
    nouns TEXT[] := ARRAY[
        'Shadow', 'Light', 'Night', 'Day', 'Storm', 'Calm', 'Journey', 'Destination',
        'Beginning', 'End', 'Truth', 'Lie', 'Dream', 'Nightmare', 'Hope', 'Despair',
        'Love', 'Hate', 'War', 'Peace', 'Hero', 'Villain', 'Angel', 'Demon',
        'King', 'Queen', 'Prince', 'Princess', 'Warrior', 'Sage', 'Dragon', 'Phoenix',
        'Legend', 'Myth', 'Mystery', 'Revelation', 'Quest', 'Adventure', 'Chronicle', 'Saga'
    ];
    i INTEGER;
    movie_title TEXT;
    poster_color TEXT;
BEGIN
    FOR i IN 1..10000 LOOP
        movie_title := adjectives[1 + (i % array_length(adjectives, 1))] || ' ' || 
                       nouns[1 + ((i * 3) % array_length(nouns, 1))];
        
        IF i % 5 = 0 THEN
            movie_title := movie_title || ' ' || (1 + (i / 1000));
        END IF;
        
        -- Generate color based on movie ID
        poster_color := CASE (i % 10)
            WHEN 0 THEN '1e293b/94a3b8'
            WHEN 1 THEN 'dc2626/fecaca'
            WHEN 2 THEN '7c3aed/ddd6fe'
            WHEN 3 THEN '059669/6ee7b7'
            WHEN 4 THEN 'ea580c/fed7aa'
            WHEN 5 THEN '0891b2/a5f3fc'
            WHEN 6 THEN 'be123c/fecdd3'
            WHEN 7 THEN '4f46e5/c7d2fe'
            WHEN 8 THEN 'ca8a04/fef08a'
            ELSE '64748b/cbd5e1'
        END;
        
        INSERT INTO movies (title, release_year, description, duration_minutes, rating, director_id, poster_url)
        VALUES (
            movie_title,
            1950 + (i % 74),
            'An epic tale of ' || lower(nouns[1 + (i % array_length(nouns, 1))]) || 
            ' and redemption. This gripping narrative explores themes of ' ||
            lower(adjectives[1 + ((i+1) % array_length(adjectives, 1))]) || 
            ' destiny and human resilience.',
            80 + (i % 120),
            0.00,
            1 + (i % 5000),
            'https://placehold.co/300x450/' || poster_color || '?text=' || 
            REPLACE(LEFT(movie_title, 15), ' ', '+') || '&font=raleway'
        );
        
        IF i % 2000 = 0 THEN
            RAISE NOTICE '  ... Generated % movies so far', i;
        END IF;
    END LOOP;
    
    RAISE NOTICE ' Generated % movies with posters', (SELECT COUNT(*) FROM movies);
END $$;

-- ========== MOVIE-GENRE RELATIONSHIPS (30,000) ==========
DO $$
DECLARE
    i INTEGER;
    movie_id_val INTEGER;
    genre_id_val INTEGER;
    genre_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO genre_count FROM genres;
    
    FOR i IN 1..30000 LOOP
        movie_id_val := 1 + ((i * 7) % 10000);
        genre_id_val := 1 + (i % genre_count);
        
        INSERT INTO movie_genre (movie_id, genre_id)
        VALUES (movie_id_val, genre_id_val)
        ON CONFLICT DO NOTHING;
    END LOOP;
    
    RAISE NOTICE ' Generated % movie-genre relationships', (SELECT COUNT(*) FROM movie_genre);
END $$;

-- ========== MOVIE-ACTOR RELATIONSHIPS (40,000) ==========
DO $$
DECLARE
    i INTEGER;
    movie_id_val INTEGER;
    actor_id_val INTEGER;
    roles TEXT[] := ARRAY[
        'Lead Role', 'Supporting Role', 'Antagonist', 'Protagonist', 'Mentor',
        'Sidekick', 'Love Interest', 'Comic Relief', 'Narrator', 'Cameo',
        'Villain', 'Hero', 'Anti-Hero', 'Deuteragonist', 'Tritagonist'
    ];
BEGIN
    FOR i IN 1..40000 LOOP
        movie_id_val := 1 + ((i * 11) % 10000);
        actor_id_val := 1 + (i % 5000);
        
        INSERT INTO movie_actor (movie_id, actor_id, role)
        VALUES (
            movie_id_val,
            actor_id_val,
            roles[1 + (i % array_length(roles, 1))]
        )
        ON CONFLICT DO NOTHING;
    END LOOP;
    
    RAISE NOTICE ' Generated % movie-actor relationships', (SELECT COUNT(*) FROM movie_actor);
END $$;

-- ========== REVIEWS (50,000) ==========
DO $$
DECLARE
    i INTEGER;
    movie_id_val INTEGER;
    reviewer_names TEXT[] := ARRAY[
        'Film Critic Pro', 'Movie Buff', 'Cinema Lover', 'Rotten Tomatoes Fan',
        'IMDB Regular', 'Letterboxd User', 'Metacritic Reviewer', 'Roger Ebert Fan',
        'Siskel Follower', 'Pauline Kael Admirer', 'Leonard Maltin Reader', 'Peter Travers Fan',
        'A.O. Scott Follower', 'Richard Roeper Reader', 'Kenneth Turan Fan', 'Lisa Schwarzbaum Reader',
        'David Edelstein Follower', 'Stephanie Zacharek Fan', 'Ty Burr Reader', 'Manohla Dargis Fan',
        'Joe Morgenstern Follower', 'Ann Hornaday Reader', 'Michael Phillips Fan', 'Claudia Puig Follower'
    ];
    comments TEXT[] := ARRAY[
        'An absolute masterpiece that redefines cinema!',
        'Visually stunning with powerful performances.',
        'A thought-provoking narrative that stays with you.',
        'Expertly crafted with attention to every detail.',
        'The director''s vision truly shines through.',
        'Acting performances are top-notch across the board.',
        'A must-watch for any cinema enthusiast.',
        'Brilliantly executed with perfect pacing.',
        'The cinematography is breathtaking.',
        'A compelling story told with artistry.',
        'Outstanding direction and screenplay.',
        'Emotionally resonant and beautifully filmed.',
        'A tour de force in modern filmmaking.',
        'Captivating from start to finish.',
        'Innovative storytelling at its finest.',
        'The performances elevate an already great script.',
        'A cinematic achievement worth celebrating.',
        'Powerful, moving, and unforgettable.',
        'Masterful blend of technical skill and artistry.',
        'Sets a new standard for the genre.',
        'Exceptional in every aspect of production.',
        'A timeless classic in the making.',
        'Riveting narrative with stellar execution.',
        'Profound and impactful storytelling.'
    ];
BEGIN
    FOR i IN 1..50000 LOOP
        movie_id_val := 1 + (i % 10000);
        
        INSERT INTO reviews (movie_id, reviewer_name, rating, comment)
        VALUES (
            movie_id_val,
            reviewer_names[1 + (i % array_length(reviewer_names, 1))] || ' #' || i,
            ROUND((6.0 + (random() * 4.0))::NUMERIC, 2),
            comments[1 + (i % array_length(comments, 1))]
        );
        
        IF i % 10000 = 0 THEN
            RAISE NOTICE '  ... Generated % reviews so far', i;
        END IF;
    END LOOP;
    
    RAISE NOTICE ' Generated % reviews', (SELECT COUNT(*) FROM reviews);
END $$;

-- ========== OPTIMIZE DATABASE ==========
ANALYZE movies;
ANALYZE reviews;
ANALYZE directors;
ANALYZE actors;
ANALYZE genres;
ANALYZE movie_genre;
ANALYZE movie_actor;

-- ========== FINAL STATISTICS ==========
DO $$
DECLARE
    v_movies_count INTEGER;
    v_reviews_count INTEGER;
    v_directors_count INTEGER;
    v_actors_count INTEGER;
    v_genres_count INTEGER;
    v_movie_genres INTEGER;
    v_movie_actors INTEGER;
    v_avg_rating DECIMAL;
    v_max_rating DECIMAL;
    v_min_rating DECIMAL;
    v_directors_with_photos INTEGER;
    v_actors_with_photos INTEGER;
    v_movies_with_posters INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_movies_count FROM movies;
    SELECT COUNT(*) INTO v_reviews_count FROM reviews;
    SELECT COUNT(*) INTO v_directors_count FROM directors;
    SELECT COUNT(*) INTO v_actors_count FROM actors;
    SELECT COUNT(*) INTO v_genres_count FROM genres;
    SELECT COUNT(*) INTO v_movie_genres FROM movie_genre;
    SELECT COUNT(*) INTO v_movie_actors FROM movie_actor;
    SELECT AVG(rating) INTO v_avg_rating FROM movies WHERE rating > 0;
    SELECT MAX(rating) INTO v_max_rating FROM reviews;
    SELECT MIN(rating) INTO v_min_rating FROM reviews;
    SELECT COUNT(*) INTO v_directors_with_photos FROM directors WHERE photo_url IS NOT NULL;
    SELECT COUNT(*) INTO v_actors_with_photos FROM actors WHERE photo_url IS NOT NULL;
    SELECT COUNT(*) INTO v_movies_with_posters FROM movies WHERE poster_url IS NOT NULL;
    
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE ' DATABASE SETUP COMPLETE!';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE ' Table Statistics:';
    RAISE NOTICE '   - Movies: %', v_movies_count;
    RAISE NOTICE '   - Reviews: %', v_reviews_count;
    RAISE NOTICE '   - Directors: %', v_directors_count;
    RAISE NOTICE '   - Actors: %', v_actors_count;
    RAISE NOTICE '   - Genres: %', v_genres_count;
    RAISE NOTICE '   - Movie-Genre Relations: %', v_movie_genres;
    RAISE NOTICE '   - Movie-Actor Relations: %', v_movie_actors;
    RAISE NOTICE '';
    RAISE NOTICE ' Photo Statistics:';
    RAISE NOTICE '   - Directors with photos: %', v_directors_with_photos;
    RAISE NOTICE '   - Actors with photos: %', v_actors_with_photos;
    RAISE NOTICE '   - Movies with posters: %', v_movies_with_posters;
    RAISE NOTICE '';
    RAISE NOTICE ' Rating Statistics:';
    RAISE NOTICE '   - Average Movie Rating: %', ROUND(v_avg_rating, 2);
    RAISE NOTICE '   - Highest Review Rating: %', v_max_rating;
    RAISE NOTICE '   - Lowest Review Rating: %', v_min_rating;
    RAISE NOTICE '';
    RAISE NOTICE ' Sample Test Queries:';
    RAISE NOTICE '';
    RAISE NOTICE '-- Get paginated movies with photos:';
    RAISE NOTICE 'SELECT * FROM get_all_movies(20, 0, ''rating'', ''DESC'');';
    RAISE NOTICE '';
    RAISE NOTICE '-- Search movies:';
    RAISE NOTICE 'SELECT * FROM search_movies(''dark'');';
    RAISE NOTICE '';
    RAISE NOTICE '-- Get top rated movies:';
    RAISE NOTICE 'SELECT * FROM get_top_rated_movies(10);';
    RAISE NOTICE '';
    RAISE NOTICE '-- Get actors with photos:';
    RAISE NOTICE 'SELECT * FROM get_all_actors_with_photos(20, 0);';
    RAISE NOTICE '';
    RAISE NOTICE '-- Get directors with photos:';
    RAISE NOTICE 'SELECT * FROM get_all_directors_with_photos(20, 0);';
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE ' Database is ready for use!';
    RAISE NOTICE '========================================';
END $$;
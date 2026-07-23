-- ══════════════════════════════════════════════════════════════
--  Xzily Blog — Library Schema
--  Run this in your Supabase project SQL editor
-- ══════════════════════════════════════════════════════════════

-- 1. Library uploader profiles
CREATE TABLE IF NOT EXISTS library_profiles (
  id              UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name    TEXT        NOT NULL DEFAULT '',
  bio             TEXT        NOT NULL DEFAULT '',
  avatar_url      TEXT        NOT NULL DEFAULT '',
  cover_url       TEXT        NOT NULL DEFAULT '',
  location        TEXT        NOT NULL DEFAULT '',
  website         TEXT        NOT NULL DEFAULT '',
  books_count     INT         NOT NULL DEFAULT 0,
  followers_count INT         NOT NULL DEFAULT 0,
  following_count INT         NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Books
CREATE TABLE IF NOT EXISTS books (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  title          TEXT        NOT NULL,
  author_name    TEXT        NOT NULL DEFAULT '',
  description    TEXT        NOT NULL DEFAULT '',
  cover_url      TEXT        NOT NULL DEFAULT '',
  file_url       TEXT        NOT NULL DEFAULT '',
  external_url   TEXT        NOT NULL DEFAULT '',
  is_external    BOOLEAN     NOT NULL DEFAULT FALSE,
  category       TEXT        NOT NULL DEFAULT 'fiction',
  tags           TEXT[]      NOT NULL DEFAULT '{}',
  uploader_id    UUID        REFERENCES library_profiles(id) ON DELETE SET NULL,
  status         TEXT        NOT NULL DEFAULT 'pending'
                             CHECK (status IN ('pending','published','rejected')),
  views          INT         NOT NULL DEFAULT 0,
  likes_count    INT         NOT NULL DEFAULT 0,
  comments_count INT         NOT NULL DEFAULT 0,
  language       TEXT        NOT NULL DEFAULT 'English',
  published_year INT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Book likes
CREATE TABLE IF NOT EXISTS book_likes (
  book_id    UUID        NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  user_id    UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (book_id, user_id)
);

-- 4. Book comments
CREATE TABLE IF NOT EXISTS book_comments (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id      UUID        NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  parent_id    UUID        REFERENCES book_comments(id) ON DELETE CASCADE,
  user_id      UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  display_name TEXT        NOT NULL DEFAULT 'Anonymous',
  text         TEXT        NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Library follows (users following uploaders)
CREATE TABLE IF NOT EXISTS library_follows (
  follower_id  UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  following_id UUID        NOT NULL REFERENCES library_profiles(id) ON DELETE CASCADE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (follower_id, following_id)
);

-- ══════════════════════════════════════════════════════════════
--  Indexes for performance
-- ══════════════════════════════════════════════════════════════
CREATE INDEX IF NOT EXISTS books_status_cat_idx    ON books (status, category);
CREATE INDEX IF NOT EXISTS books_uploader_idx      ON books (uploader_id);
CREATE INDEX IF NOT EXISTS books_created_idx       ON books (created_at DESC);
CREATE INDEX IF NOT EXISTS book_comments_book_idx  ON book_comments (book_id);
CREATE INDEX IF NOT EXISTS book_likes_book_idx     ON book_likes (book_id);
CREATE INDEX IF NOT EXISTS lib_follows_following_idx ON library_follows (following_id);

-- ══════════════════════════════════════════════════════════════
--  RPC helper functions (called by library-store.js)
-- ══════════════════════════════════════════════════════════════

-- Increment book views
CREATE OR REPLACE FUNCTION increment_book_views(book_id UUID)
RETURNS void LANGUAGE sql AS $$
  UPDATE books SET views = views + 1 WHERE id = book_id;
$$;

-- Increment book likes
CREATE OR REPLACE FUNCTION increment_book_likes(book_id UUID)
RETURNS void LANGUAGE sql AS $$
  UPDATE books SET likes_count = likes_count + 1 WHERE id = book_id;
$$;

-- Decrement book likes
CREATE OR REPLACE FUNCTION decrement_book_likes(book_id UUID)
RETURNS void LANGUAGE sql AS $$
  UPDATE books SET likes_count = GREATEST(0, likes_count - 1) WHERE id = book_id;
$$;

-- Increment book comments
CREATE OR REPLACE FUNCTION increment_book_comments(book_id UUID)
RETURNS void LANGUAGE sql AS $$
  UPDATE books SET comments_count = comments_count + 1 WHERE id = book_id;
$$;

-- Increment follower count on a library profile
CREATE OR REPLACE FUNCTION increment_lib_followers(profile_id UUID)
RETURNS void LANGUAGE sql AS $$
  UPDATE library_profiles SET followers_count = followers_count + 1 WHERE id = profile_id;
$$;

-- Decrement follower count on a library profile
CREATE OR REPLACE FUNCTION decrement_lib_followers(profile_id UUID)
RETURNS void LANGUAGE sql AS $$
  UPDATE library_profiles SET followers_count = GREATEST(0, followers_count - 1) WHERE id = profile_id;
$$;

-- Increment book count on a library profile
CREATE OR REPLACE FUNCTION increment_lib_books(profile_id UUID)
RETURNS void LANGUAGE sql AS $$
  UPDATE library_profiles SET books_count = books_count + 1 WHERE id = profile_id;
$$;

-- ══════════════════════════════════════════════════════════════
--  Row Level Security (RLS)
-- ══════════════════════════════════════════════════════════════

-- library_profiles: public read; owner can update own row
ALTER TABLE library_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_public_read"  ON library_profiles FOR SELECT USING (true);
CREATE POLICY "profiles_owner_write"  ON library_profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_owner_update" ON library_profiles FOR UPDATE USING (auth.uid() = id);

-- books: public read of published; uploader can manage own; admin can manage all
ALTER TABLE books ENABLE ROW LEVEL SECURITY;
CREATE POLICY "books_published_read" ON books FOR SELECT USING (status = 'published' OR auth.uid() = uploader_id);
CREATE POLICY "books_uploader_insert" ON books FOR INSERT WITH CHECK (auth.uid() = uploader_id);
CREATE POLICY "books_uploader_update" ON books FOR UPDATE USING (auth.uid() = uploader_id OR
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));
CREATE POLICY "books_uploader_delete" ON books FOR DELETE USING (auth.uid() = uploader_id OR
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));

-- book_likes: public read; authenticated users manage own
ALTER TABLE book_likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "likes_public_read"  ON book_likes FOR SELECT USING (true);
CREATE POLICY "likes_auth_insert"  ON book_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "likes_auth_delete"  ON book_likes FOR DELETE USING (auth.uid() = user_id);

-- book_comments: public read; anyone can insert (guest or logged in); owner can delete
ALTER TABLE book_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "comments_public_read"  ON book_comments FOR SELECT USING (true);
CREATE POLICY "comments_public_insert" ON book_comments FOR INSERT WITH CHECK (true);
CREATE POLICY "comments_owner_delete" ON book_comments FOR DELETE USING (auth.uid() = user_id OR
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));

-- library_follows: public read; authenticated users manage own
ALTER TABLE library_follows ENABLE ROW LEVEL SECURITY;
CREATE POLICY "follows_public_read" ON library_follows FOR SELECT USING (true);
CREATE POLICY "follows_auth_insert" ON library_follows FOR INSERT WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "follows_auth_delete" ON library_follows FOR DELETE USING (auth.uid() = follower_id);

-- ══════════════════════════════════════════════════════════════
--  cloudinaryBooksPreset column in site_settings (if needed)
--  Only run if you have a site_settings table
-- ══════════════════════════════════════════════════════════════
-- ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS cloudinary_books_preset TEXT NOT NULL DEFAULT '';

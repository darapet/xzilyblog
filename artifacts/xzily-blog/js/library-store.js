// ═══════════════════════════════════════════════════════
//  Xzily Blog — Library Data Layer  (Supabase-backed)
// ═══════════════════════════════════════════════════════
import { supabase } from './supabase-client.js';

export const BOOK_CATEGORIES = [
  { slug: 'fiction',    name: 'Fiction & Literature',    icon: '📖' },
  { slug: 'religion',   name: 'Religion & Spirituality', icon: '🕊️' },
  { slug: 'science',    name: 'Science & Technology',    icon: '🔬' },
  { slug: 'textbooks',  name: 'Textbooks',                icon: '📚' },
  { slug: 'mathematics', name: 'Mathematics',             icon: '➗' },
  { slug: 'biology',    name: 'Biology',                  icon: '🧬' },
  { slug: 'chemistry',  name: 'Chemistry',                icon: '⚗️' },
  { slug: 'physics',    name: 'Physics',                  icon: '⚛️' },
  { slug: 'computer-science', name: 'Computer Science',   icon: '💻' },
  { slug: 'engineering', name: 'Engineering',             icon: '⚙️' },
  { slug: 'economics',  name: 'Economics',                icon: '📈' },
  { slug: 'accounting', name: 'Accounting',               icon: '🧾' },
  { slug: 'commerce',   name: 'Commerce & Trade',          icon: '🛒' },
  { slug: 'agriculture', name: 'Agriculture',              icon: '🌾' },
  { slug: 'medicine',   name: 'Medicine & Nursing',        icon: '🩺' },
  { slug: 'history',    name: 'History & Biography',     icon: '🏛️' },
  { slug: 'business',   name: 'Business & Finance',      icon: '💼' },
  { slug: 'self-help',  name: 'Self-Help & Motivation',  icon: '🌱' },
  { slug: 'health',     name: 'Health & Wellness',       icon: '❤️' },
  { slug: 'education',  name: 'Education & Academic',    icon: '🎓' },
  { slug: 'travel',     name: 'Travel & Culture',        icon: '🌍' },
  { slug: 'arts',       name: 'Arts & Entertainment',    icon: '🎨' },
  { slug: 'children',   name: 'Children & Young Adult',  icon: '🌟' },
  { slug: 'law',        name: 'Law & Politics',          icon: '⚖️' },
  { slug: 'philosophy', name: 'Philosophy',              icon: '🤔' },
  { slug: 'comics',     name: 'Comics & Manga',          icon: '🎭' },
  { slug: 'sports',     name: 'Sports & Athletics',      icon: '🏅' },
  { slug: 'emotional-wellbeing', name: 'Emotional Wellbeing', icon: '💛' },
];

export function getCategoryBySlug(slug) {
  return BOOK_CATEGORIES.find(c => c.slug === slug) || {
    slug,
    name: String(slug || 'Other').replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
    icon: '📚',
  };
}

export async function getAvailableCategories() {
  const { data, error } = await supabase
    .from('books')
    .select('category')
    .eq('status', 'published')
    .limit(1000);
  if (error) throw error;

  const discovered = [...new Set((data || [])
    .map(row => row.category)
    .filter(Boolean))]
    .map(slug => getCategoryBySlug(slug));
  const known = new Map(BOOK_CATEGORIES.map(category => [category.slug, category]));
  for (const category of discovered) known.set(category.slug, category);
  return [...known.values()];
}

// ── Category guesser (used for external books) ─────────────
export function guessCategory(text = '') {
  const s = (Array.isArray(text) ? text.join(' ') : String(text)).toLowerCase();
  if (/sport|athletic|football|soccer|basketball|baseball|tennis|olympic|coaching/.test(s)) return 'sports';
  if (/emotional|mental health|psycholog|well-being|wellbeing|anxiety|depression|resilien/.test(s)) return 'emotional-wellbeing';
  if (/accounting|bookkeeping|auditing/.test(s)) return 'accounting';
  if (/commerce|commercial law|retail|trade|entrepreneurship/.test(s)) return 'commerce';
  if (/economics|economic|econometric|macroeconom|microeconom/.test(s)) return 'economics';
  if (/engineering|mechanical engineer|civil engineer|electrical engineer|chemical engineer/.test(s)) return 'engineering';
  if (/computer science|programming|software|coding|informatics|data science|artificial intelligence/.test(s)) return 'computer-science';
  if (/agriculture|agricultural|farming|horticulture|veterinary|soil science/.test(s)) return 'agriculture';
  if (/medicine|medical|nursing|clinical|anatomy|physiology|pharmacology|public health/.test(s)) return 'medicine';
  if (/biology|biological|botany|zoology|microbiology|genetics|ecology/.test(s)) return 'biology';
  if (/chemistry|chemical science|organic chemistry|inorganic chemistry|biochemistry/.test(s)) return 'chemistry';
  if (/physics|physical science|mechanics|thermodynamics|quantum|electromagnet/.test(s)) return 'physics';
  if (/mathematics|mathematical|algebra|calculus|geometry|trigonometry|statistics|probability/.test(s)) return 'mathematics';
  if (/textbook|college textbook|open textbook|study guide|curriculum/.test(s)) return 'textbooks';
  if (/fiction|novel|stories|poetry|drama|literature/.test(s))   return 'fiction';
  if (/religion|bible|quran|spiritual|christian|islam|buddhis|theology|hindu/.test(s)) return 'religion';
  if (/science|physics|chemistry|biology|mathematics|astronomy|technology|computer/.test(s)) return 'science';
  if (/histor|biography|war|ancient|civiliz/.test(s)) return 'history';
  if (/business|economics|finance|commerce|management|marketing/.test(s)) return 'business';
  if (/self.help|personal development|motivation|success|productivity|mindfulness/.test(s)) return 'self-help';
  if (/health|medicine|medical|wellness|nutrition|fitness/.test(s)) return 'health';
  if (/education|learning|teaching|school|university|academic/.test(s)) return 'education';
  if (/travel|geography|explorat|adventure/.test(s)) return 'travel';
  if (/\bart\b|music|film|entertainment|photography|design/.test(s)) return 'arts';
  if (/child|juvenile|young adult|picture book/.test(s)) return 'children';
  if (/law|legal|court|politics|government|constitution/.test(s)) return 'law';
  if (/philosophy|ethics|logic|metaphysics/.test(s)) return 'philosophy';
  return 'fiction';
}

function mapBook(row) {
  return {
    id:           row.id,
    title:        row.title,
    authorName:   row.author_name,
    description:  row.description,
    coverUrl:     row.cover_url,
    fileUrl:      row.file_url,
    externalUrl:  row.external_url,
    isExternal:   row.is_external,
    category:     row.category,
    tags:         row.tags || [],
    uploaderId:   row.uploader_id,
    status:       row.status,
    views:        row.views        || 0,
    likesCount:   row.likes_count  || 0,
    commentsCount:row.comments_count || 0,
    language:     row.language     || 'English',
    publishedYear:row.published_year,
    createdAt:    row.created_at,
  };
}

function mapProfile(row) {
  return {
    id:             row.id,
    displayName:    row.display_name    || 'Anonymous',
    bio:            row.bio             || '',
    avatarUrl:      row.avatar_url      || '',
    coverUrl:       row.cover_url       || '',
    location:       row.location        || '',
    website:        row.website         || '',
    booksCount:     row.books_count     || 0,
    followersCount: row.followers_count || 0,
    followingCount: row.following_count || 0,
    createdAt:      row.created_at,
  };
}

function mapComment(row) {
  return {
    id:          row.id,
    bookId:      row.book_id,
    parentId:    row.parent_id,
    userId:      row.user_id,
    displayName: row.display_name || 'Anonymous',
    text:        row.text,
    createdAt:   row.created_at,
    replies:     [],
  };
}

export const libStore = {

  // ── Profiles ──────────────────────────────────────────────
  async getProfile(userId) {
    const KEY = `__xzily_libprofile_${userId}__`;
    const TTL = 5 * 60 * 1000; // 5 minutes
    try {
      const cached = sessionStorage.getItem(KEY);
      if (cached) {
        const { data, ts } = JSON.parse(cached);
        if (Date.now() - ts < TTL) return data;
      }
    } catch(_) {}
    const { data, error } = await supabase
      .from('library_profiles').select('*').eq('id', userId).maybeSingle();
    if (error) throw error;
    const profile = data ? mapProfile(data) : null;
    if (profile) {
      try { sessionStorage.setItem(KEY, JSON.stringify({ data: profile, ts: Date.now() })); } catch(_) {}
    }
    return profile;
  },

  async saveProfile(userId, patch) {
    const record = { id: userId };
    if (patch.displayName !== undefined) record.display_name = patch.displayName;
    if (patch.bio         !== undefined) record.bio          = patch.bio;
    if (patch.location    !== undefined) record.location     = patch.location;
    if (patch.website     !== undefined) record.website      = patch.website;
    if (patch.avatarUrl   !== undefined) record.avatar_url   = patch.avatarUrl;
    if (patch.coverUrl    !== undefined) record.cover_url    = patch.coverUrl;
    const { data, error } = await supabase
      .from('library_profiles').upsert(record, { onConflict: 'id' }).select().single();
    if (error) throw error;
    return mapProfile(data);
  },

  // ── Books ──────────────────────────────────────────────────
  async getBooks({ category = null, status = 'published', search = null, uploaderId = null, limit = 200 } = {}) {
    let q = supabase.from('books').select('*').order('created_at', { ascending: false });
    if (status !== 'all') q = q.eq('status', status);
    if (category)   q = q.eq('category', category);
    if (uploaderId) q = q.eq('uploader_id', uploaderId);
    if (search) {
      // Search only title + author — including description causes a slow full-table scan
      const s = search.replace(/'/g, "''");
      q = q.or(`title.ilike.%${s}%,author_name.ilike.%${s}%`);
    }
    if (limit) q = q.limit(limit);
    const { data, error } = await q;
    if (error) throw error;
    return (data || []).map(mapBook);
  },

  async getBookById(id) {
    const KEY = `__xzily_book_${id}__`;
    const TTL = 5 * 60 * 1000; // 5 minutes
    try {
      const cached = sessionStorage.getItem(KEY);
      if (cached) {
        const { data, ts } = JSON.parse(cached);
        if (Date.now() - ts < TTL) return data;
      }
    } catch(_) {}
    const { data, error } = await supabase.from('books').select('*').eq('id', id).maybeSingle();
    if (error) throw error;
    const book = data ? mapBook(data) : null;
    if (book) {
      try { sessionStorage.setItem(KEY, JSON.stringify({ data: book, ts: Date.now() })); } catch(_) {}
    }
    return book;
  },

  async createBook(book) {
    const record = {
      title:         book.title,
      author_name:   book.authorName   || '',
      description:   book.description  || '',
      cover_url:     book.coverUrl     || '',
      file_url:      book.fileUrl      || '',
      external_url:  book.externalUrl  || '',
      is_external:   book.isExternal   || false,
      category:      book.category     || 'fiction',
      tags:          book.tags         || [],
      uploader_id:   book.uploaderId,
      status:        'pending',
      language:      book.language     || 'English',
      published_year:book.publishedYear || null,
    };
    const { data, error } = await supabase.from('books').insert(record).select().single();
    if (error) throw error;
    await supabase.rpc('increment_lib_books', { profile_id: book.uploaderId }).catch(() => {});
    return mapBook(data);
  },

  async updateBook(id, patch) {
    const record = { updated_at: new Date().toISOString() };
    if (patch.title         !== undefined) record.title          = patch.title;
    if (patch.authorName    !== undefined) record.author_name    = patch.authorName;
    if (patch.description   !== undefined) record.description    = patch.description;
    if (patch.coverUrl      !== undefined) record.cover_url      = patch.coverUrl;
    if (patch.fileUrl       !== undefined) record.file_url       = patch.fileUrl;
    if (patch.externalUrl   !== undefined) record.external_url   = patch.externalUrl;
    if (patch.isExternal    !== undefined) record.is_external    = patch.isExternal;
    if (patch.category      !== undefined) record.category       = patch.category;
    if (patch.tags          !== undefined) record.tags           = patch.tags;
    if (patch.status        !== undefined) record.status         = patch.status;
    if (patch.language      !== undefined) record.language       = patch.language;
    if (patch.publishedYear !== undefined) record.published_year = patch.publishedYear;
    const { data, error } = await supabase.from('books').update(record).eq('id', id).select().single();
    if (error) throw error;
    return mapBook(data);
  },

  async deleteBook(id) {
    const { error } = await supabase.from('books').delete().eq('id', id);
    if (error) throw error;
  },

  async incrementViews(id) {
    await supabase.rpc('increment_book_views', { book_id: id }).catch(() => {});
  },

  // ── Likes ──────────────────────────────────────────────────
  async getLikeStatus(bookId, userId) {
    const { data } = await supabase.from('book_likes')
      .select('book_id').eq('book_id', bookId).eq('user_id', userId).maybeSingle();
    return !!data;
  },

  async toggleLike(bookId, userId) {
    const liked = await this.getLikeStatus(bookId, userId);
    if (liked) {
      await supabase.from('book_likes').delete().eq('book_id', bookId).eq('user_id', userId);
      await supabase.rpc('decrement_book_likes', { book_id: bookId }).catch(() => {});
    } else {
      await supabase.from('book_likes').insert({ book_id: bookId, user_id: userId });
      await supabase.rpc('increment_book_likes', { book_id: bookId }).catch(() => {});
    }
    return !liked;
  },

  // ── Comments ───────────────────────────────────────────────
  async getComments(bookId) {
    const { data, error } = await supabase.from('book_comments')
      .select('*').eq('book_id', bookId).order('created_at', { ascending: true });
    if (error) throw error;
    const mapped = (data || []).map(mapComment);
    const byId   = new Map(mapped.map(c => [c.id, c]));
    const roots  = [];
    for (const c of mapped) {
      if (c.parentId && byId.has(c.parentId)) byId.get(c.parentId).replies.push(c);
      else roots.push(c);
    }
    return roots.reverse();
  },

  async addComment(bookId, parentId, userId, displayName, text) {
    const record = {
      book_id:      bookId,
      parent_id:    parentId || null,
      user_id:      userId   || null,
      display_name: displayName || 'Anonymous',
      text,
    };
    const { data, error } = await supabase.from('book_comments').insert(record).select().single();
    if (error) throw error;
    await supabase.rpc('increment_book_comments', { book_id: bookId }).catch(() => {});
    return mapComment(data);
  },

  async deleteComment(id) {
    const { error } = await supabase.from('book_comments').delete().eq('id', id);
    if (error) throw error;
  },

  // ── Follows ────────────────────────────────────────────────
  async getFollowStatus(followerId, followingId) {
    const { data } = await supabase.from('library_follows')
      .select('follower_id').eq('follower_id', followerId).eq('following_id', followingId).maybeSingle();
    return !!data;
  },

  async toggleFollow(followerId, followingId) {
    const isFollowing = await this.getFollowStatus(followerId, followingId);
    if (isFollowing) {
      await supabase.from('library_follows').delete()
        .eq('follower_id', followerId).eq('following_id', followingId);
      await supabase.rpc('decrement_lib_followers', { profile_id: followingId }).catch(() => {});
    } else {
      await supabase.from('library_follows').insert({ follower_id: followerId, following_id: followingId });
      await supabase.rpc('increment_lib_followers', { profile_id: followingId }).catch(() => {});
    }
    return !isFollowing;
  },

  // ── External Books (Archive.org / Gutenberg) ───────────────

  async fetchArchiveMeta(identifier) {
    const res = await fetch(`https://archive.org/metadata/${encodeURIComponent(identifier)}`);
    if (!res.ok) throw new Error('Could not find this book on Internet Archive.');
    const data = await res.json();
    if (!data.metadata) throw new Error('No metadata found for this Archive.org item.');
    const m   = data.metadata;
    const arr = v => Array.isArray(v) ? v[0] : (v || '');
    const subjects = Array.isArray(m.subject) ? m.subject : (m.subject ? [m.subject] : []);
    const year = parseInt(arr(m.date) || arr(m.year)) || null;
    return {
      title:        arr(m.title).replace(/<[^>]+>/g, '').trim() || 'Unknown Title',
      authorName:   arr(m.creator).replace(/<[^>]+>/g, '').trim() || 'Unknown Author',
      description:  arr(m.description).replace(/<[^>]+>/g, '').slice(0, 800),
      coverUrl:     `https://archive.org/services/img/${identifier}`,
      externalUrl:  `https://archive.org/details/${identifier}`,
      category:     guessCategory(subjects.join(' ')),
      language:     arr(m.language) || 'English',
      publishedYear:year,
      source:       'archive',
    };
  },

  async fetchGutenbergMeta(bookId) {
    const res = await fetch(`https://gutendex.com/books/${encodeURIComponent(bookId)}`);
    if (!res.ok) throw new Error('Could not find this book on Project Gutenberg.');
    const b = await res.json();
    const subjects   = b.subjects || [];
    const htmlEntry  = Object.entries(b.formats || {}).find(([k]) => k.startsWith('text/html') && !k.includes('zip'));
    return {
      title:            (b.title || 'Unknown Title').trim(),
      authorName:       (b.authors?.[0]?.name || 'Unknown Author').replace(/,\s*\d+.*$/, '').trim(),
      description:      subjects.slice(0, 5).join(', '),
      coverUrl:         b.formats?.['image/jpeg'] || '',
      externalUrl:      `https://www.gutenberg.org/ebooks/${bookId}`,
      gutenbergHtmlUrl: htmlEntry?.[1] || null,
      category:         guessCategory(subjects.join(' ')),
      language:         'English',
      publishedYear:    null,
      source:           'gutenberg',
    };
  },

  async checkExternalExists(externalUrl) {
    const { data } = await supabase.from('books')
      .select('id').eq('external_url', externalUrl).maybeSingle();
    return !!data;
  },

  async createExternalBook(book) {
    // External books from Archive.org / Gutenberg go live immediately — no approval step
    const record = {
      title:          book.title,
      author_name:    book.authorName          || '',
      description:    book.description         || '',
      cover_url:      book.coverUrl            || '',
      file_url:       book.gutenbergHtmlUrl    || '',   // Gutenberg HTML URL for the reader
      external_url:   book.externalUrl         || '',
      is_external:    true,
      category:       book.category            || 'fiction',
      tags:           [],
      uploader_id:    book.uploaderId          || null,
      status:         'published',
      language:       book.language            || 'English',
      published_year: book.publishedYear       || null,
    };
    const { data, error } = await supabase.from('books').insert(record).select().single();
    if (error) throw error;
    if (book.uploaderId) {
      await supabase.rpc('increment_lib_books', { profile_id: book.uploaderId }).catch(() => {});
    }
    return mapBook(data);
  },

  // ── Admin profile lookup — cached in sessionStorage to avoid repeated DB hits
  async getAdminProfile() {
    const KEY = '__xzily_admin__';
    try {
      const cached = sessionStorage.getItem(KEY);
      if (cached) return JSON.parse(cached);
    } catch(_) {}
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .ilike('display_name', 'xzily')
      .limit(1)
      .single();
    if (error) throw error;
    const profile = mapProfile(data);
    try { sessionStorage.setItem(KEY, JSON.stringify(profile)); } catch(_) {}
    return profile;
  },

  // ── Cloudinary Uploads ─────────────────────────────────────
  async uploadCover(file, settings) {
    if (!settings.cloudinaryCloudName || !settings.cloudinaryUploadPreset) {
      throw new Error('Cloudinary not configured. Set Cloud Name and Upload Preset in Admin → Settings.');
    }
    const form = new FormData();
    form.append('file', file);
    form.append('upload_preset', settings.cloudinaryUploadPreset);
    form.append('folder', 'xzily/book-covers');
    const res  = await fetch(`https://api.cloudinary.com/v1_1/${settings.cloudinaryCloudName}/image/upload`, { method: 'POST', body: form });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error?.message || 'Cover upload failed');
    return json.secure_url;
  },

  async uploadPdf(file, settings) {
    const preset = settings.cloudinaryBooksPreset || settings.cloudinaryUploadPreset;
    if (!settings.cloudinaryCloudName || !preset) {
      throw new Error('Cloudinary Books Preset not configured. Set it in Admin → Settings.');
    }
    const form = new FormData();
    form.append('file', file);
    form.append('upload_preset', preset);
    form.append('folder', 'xzily/books');
    const res  = await fetch(`https://api.cloudinary.com/v1_1/${settings.cloudinaryCloudName}/raw/upload`, { method: 'POST', body: form });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error?.message || 'PDF upload failed');
    return json.secure_url;
  },
};

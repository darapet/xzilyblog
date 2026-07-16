// Real data layer backed by Supabase (Postgres + Auth). Replaces the old
// localStorage mock. Every method is async because it talks to the network --
// callers must `await` it. See supabase/schema.sql for the table definitions
// and RLS rules that back these calls.
import { supabase } from './supabase-client.js';
import { USERS } from './data.js';

export class AuthRequiredError extends Error {
  constructor(message = 'You need to sign in first.') {
    super(message);
    this.name = 'AuthRequiredError';
  }
}

let cachedSession; // undefined = not loaded yet, null = signed out

async function loadSession() {
  const { data } = await supabase.auth.getSession();
  const user = data.session?.user;
  if (!user) {
    cachedSession = null;
    return null;
  }
  const { data: profile } = await supabase
    .from('profiles')
    .select('name, is_admin')
    .eq('id', user.id)
    .maybeSingle();
  cachedSession = {
    id: user.id,
    email: user.email,
    name: profile?.name || (user.email || '').split('@')[0],
    isAdmin: !!profile?.is_admin,
  };
  return cachedSession;
}

supabase.auth.onAuthStateChange(() => {
  cachedSession = undefined;
});

function mapPost(row) {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    content: row.content,
    coverImage: row.cover_image,
    authorId: row.author_id,
    categoryId: row.category_id,
    tags: row.tags || [],
    status: row.status,
    createdAt: row.created_at,
    readingTime: row.reading_time,
    views: row.views,
    likes: row.likes,
    featured: row.featured,
    popular: row.popular,
  };
}

const POST_FIELD_MAP = {
  title: 'title',
  excerpt: 'excerpt',
  content: 'content',
  coverImage: 'cover_image',
  authorId: 'author_id',
  categoryId: 'category_id',
  tags: 'tags',
  status: 'status',
  featured: 'featured',
  popular: 'popular',
};

function toPostRecord(patch) {
  const record = {};
  for (const [key, value] of Object.entries(patch)) {
    if (POST_FIELD_MAP[key]) record[POST_FIELD_MAP[key]] = value;
  }
  return record;
}

function mapComment(row) {
  return {
    id: row.id,
    postId: row.post_id,
    parentId: row.parent_id,
    authorId: row.author_id,
    authorName: row.author_name,
    content: row.content,
    createdAt: row.created_at,
    likes: row.likes,
    replies: [],
  };
}

function buildCommentTree(rows) {
  const mapped = rows.map(mapComment);
  const byId = new Map(mapped.map((c) => [c.id, c]));
  const roots = [];
  for (const c of mapped) {
    if (c.parentId && byId.has(c.parentId)) {
      byId.get(c.parentId).replies.push(c);
    } else {
      roots.push(c);
    }
  }
  return roots.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

function slugify(str) {
  const base = str.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  return `${base}-${Math.random().toString(36).slice(2, 6)}`;
}

// Module-level caches so category/author lists are only fetched once per page.
let _catsCache = null;
let _authorsCache = null;

function mapCategory(row) {
  return { id: row.id, slug: row.slug, name: row.name, icon: row.icon || 'sparkle', description: row.description || '' };
}
function mapAuthor(row) {
  return { id: row.id, name: row.name, email: row.email || '', avatar: row.avatar_url || 'images/avatar-1.jpg', avatarUrl: row.avatar_url || 'images/avatar-1.jpg', role: row.role || '', bio: row.bio || '' };
}

function mapSettings(row) {
  return {
    cloudinaryCloudName:   row?.cloudinary_cloud_name   || '',
    cloudinaryUploadPreset: row?.cloudinary_upload_preset || '',
    groqApiKey1: row?.groq_api_key_1 || '',
    groqApiKey2: row?.groq_api_key_2 || '',
    groqApiKey3: row?.groq_api_key_3 || '',
    groqApiKey4: row?.groq_api_key_4 || '',
    groqApiKey5: row?.groq_api_key_5 || '',
    // Site identity
    siteName:     row?.site_name     || 'The Educative Blog',
    footerCredit: row?.footer_credit || 'Built by Darapet Technology plc',
    // Contact
    contactEmail:   row?.contact_email   || '',
    contactPhone:   row?.contact_phone   || '',
    contactAddress: row?.contact_address || '',
    // Socials
    fbUrl:               row?.fb_url                || '',
    twitterUrl:          row?.twitter_url           || '',
    instagramUrl:        row?.instagram_url         || '',
    whatsappNumber:      row?.whatsapp_number       || '',
    whatsappChannelUrl:  row?.whatsapp_channel_url  || '',
    // About page
    aboutText:     row?.about_text     || '',
    statsReaders:  row?.stats_readers  || '85k+',
    statsStories:  row?.stats_stories  || '10+',
    statsSections: row?.stats_sections || '6',
    statsWriters:  row?.stats_writers  || '4',
  };
}

// Unsigned upload -- only the cloud name + a preset (both non-secret,
// configured for unsigned uploads in the Cloudinary dashboard) ever reach
// the browser. No API secret is needed or stored anywhere for this to work.
async function uploadToCloudinary(file, folder, settings) {
  const form = new FormData();
  form.append('file', file);
  form.append('upload_preset', settings.cloudinaryUploadPreset);
  form.append('folder', `xzily/${folder}`);
  const res = await fetch(`https://api.cloudinary.com/v1_1/${settings.cloudinaryCloudName}/image/upload`, {
    method: 'POST',
    body: form,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || 'Cloudinary upload failed');
  return data.secure_url;
}

export const store = {
  // ---------------- Auth ----------------
  async getSession() {
    if (cachedSession === undefined) await loadSession();
    return cachedSession;
  },
  async login(email, password) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return await loadSession();
  },
  async register(name, email, password) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    });
    if (error) throw error;
    if (!data.session) return null; // email confirmation required
    return await loadSession();
  },
  async loginAdmin(email, password) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return null;
    const session = await loadSession();
    if (!session || !session.isAdmin) {
      await supabase.auth.signOut();
      cachedSession = null;
      return null;
    }
    return session;
  },
  async logout() {
    await supabase.auth.signOut();
    cachedSession = null;
  },

  // ---------------- Notification opt-in (local browser preference only) ----------------
  getNotificationOptIn() {
    return localStorage.getItem('xzily_notif_opt_in') === '1';
  },
  setNotificationOptIn(value) {
    localStorage.setItem('xzily_notif_opt_in', value ? '1' : '0');
  },

  // ---------------- Posts ----------------
  async getPosts({ status = 'published' } = {}) {
    let query = supabase.from('posts').select('*').order('created_at', { ascending: false });
    if (status !== 'all') query = query.eq('status', status);
    const { data, error } = await query;
    if (error) throw error;
    return (data || []).map(mapPost);
  },
  async getPostBySlug(slug) {
    const { data, error } = await supabase.from('posts').select('*').eq('slug', slug).maybeSingle();
    if (error) throw error;
    return data ? mapPost(data) : null;
  },
  async getPostById(id) {
    const { data, error } = await supabase.from('posts').select('*').eq('id', id).maybeSingle();
    if (error) throw error;
    return data ? mapPost(data) : null;
  },
  async createPost(post) {
    const record = {
      slug: slugify(post.title || 'story'),
      title: post.title,
      excerpt: post.excerpt || '',
      content: post.content || '',
      cover_image: post.coverImage || 'images/cover-1.jpg',
      author_id: post.authorId || 'u1',
      category_id: post.categoryId,
      tags: post.tags || [],
      status: post.status || 'draft',
      reading_time: Math.max(1, Math.round((post.content || '').split(/\s+/).length / 200)),
    };
    const { data, error } = await supabase.from('posts').insert(record).select().single();
    if (error) throw error;
    return mapPost(data);
  },
  async updatePost(id, patch) {
    const { data, error } = await supabase.from('posts').update(toPostRecord(patch)).eq('id', id).select().single();
    if (error) throw error;
    return mapPost(data);
  },
  async deletePost(id) {
    const { error } = await supabase.from('posts').delete().eq('id', id);
    if (error) throw error;
  },
  async incrementViews(id) {
    const { error } = await supabase.rpc('increment_post_views', { p_id: id });
    if (error) throw error;
  },

  // ---------------- Likes / bookmarks (require sign-in) ----------------
  async isLiked(postId) {
    const session = await store.getSession();
    if (!session) return false;
    const { data } = await supabase.from('post_likes').select('post_id').eq('post_id', postId).eq('user_id', session.id).maybeSingle();
    return !!data;
  },
  async toggleLike(postId) {
    const session = await store.getSession();
    if (!session) throw new AuthRequiredError();
    const liked = await store.isLiked(postId);
    if (liked) {
      await supabase.from('post_likes').delete().eq('post_id', postId).eq('user_id', session.id);
    } else {
      await supabase.from('post_likes').insert({ post_id: postId, user_id: session.id });
    }
    return !liked;
  },
  async isBookmarked(postId) {
    const session = await store.getSession();
    if (!session) return false;
    const { data } = await supabase.from('bookmarks').select('post_id').eq('post_id', postId).eq('user_id', session.id).maybeSingle();
    return !!data;
  },
  async toggleBookmark(postId) {
    const session = await store.getSession();
    if (!session) throw new AuthRequiredError();
    const marked = await store.isBookmarked(postId);
    if (marked) {
      await supabase.from('bookmarks').delete().eq('post_id', postId).eq('user_id', session.id);
    } else {
      await supabase.from('bookmarks').insert({ post_id: postId, user_id: session.id });
    }
    return !marked;
  },
  async getBookmarkedPosts() {
    const session = await store.getSession();
    if (!session) return [];
    const { data, error } = await supabase.from('bookmarks').select('post_id, posts(*)').eq('user_id', session.id);
    if (error) throw error;
    return (data || []).filter((r) => r.posts).map((r) => mapPost(r.posts));
  },

  // ---------------- Comments (require sign-in to write) ----------------
  async getCommentsForPost(postId) {
    const { data, error } = await supabase.from('comments').select('*').eq('post_id', postId).order('created_at', { ascending: true });
    if (error) throw error;
    return buildCommentTree(data || []);
  },
  async addComment(postId, content, parentId = null) {
    const session = await store.getSession();
    if (!session) throw new AuthRequiredError();
    const record = { post_id: postId, parent_id: parentId, author_id: session.id, author_name: session.name, content };
    const { data, error } = await supabase.from('comments').insert(record).select().single();
    if (error) throw error;
    return mapComment(data);
  },
  async deleteComment(commentId) {
    const { error } = await supabase.from('comments').delete().eq('id', commentId);
    if (error) throw error;
  },
  async isCommentLiked(commentId) {
    const session = await store.getSession();
    if (!session) return false;
    const { data } = await supabase.from('comment_likes').select('comment_id').eq('comment_id', commentId).eq('user_id', session.id).maybeSingle();
    return !!data;
  },
  async toggleCommentLike(commentId) {
    const session = await store.getSession();
    if (!session) throw new AuthRequiredError();
    const liked = await store.isCommentLiked(commentId);
    if (liked) {
      await supabase.from('comment_likes').delete().eq('comment_id', commentId).eq('user_id', session.id);
    } else {
      await supabase.from('comment_likes').insert({ comment_id: commentId, user_id: session.id });
    }
    return !liked;
  },
  async likedCommentIdsForPost(postId) {
    const session = await store.getSession();
    if (!session) return new Set();
    const { data: comments, error: cErr } = await supabase.from('comments').select('id').eq('post_id', postId);
    if (cErr) throw cErr;
    const ids = (comments || []).map((c) => c.id);
    if (ids.length === 0) return new Set();
    const { data, error } = await supabase.from('comment_likes').select('comment_id').eq('user_id', session.id).in('comment_id', ids);
    if (error) throw error;
    return new Set((data || []).map((r) => r.comment_id));
  },
  async allComments() {
    const { data, error } = await supabase.from('comments').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []).map(mapComment);
  },

  // ---------------- Newsletter / contact (public writes) ----------------
  async addSubscriber(email) {
    const { error } = await supabase.from('subscribers').insert({ email });
    if (error && error.code !== '23505') throw error; // ignore duplicate subscribe
  },
  async getSubscribers() {
    const { data, error } = await supabase.from('subscribers').select('*').order('subscribed_at', { ascending: false });
    if (error) throw error;
    return (data || []).map((s) => ({ email: s.email, subscribedAt: s.subscribed_at }));
  },
  async removeSubscriber(email) {
    const { error } = await supabase.from('subscribers').delete().eq('email', email);
    if (error) throw error;
  },
  async addContactMessage(msg) {
    const { error } = await supabase.from('contacts').insert({
      name: msg.name,
      email: msg.email,
      subject: msg.subject,
      message: msg.message,
    });
    if (error) throw error;
  },

  // ---------------- Image uploads (admin only) ----------------
  // Uploads to Cloudinary when it's configured in Settings (unsigned upload
  // preset, so no API secret ever touches the browser); falls back to
  // Supabase Storage otherwise so the editor keeps working before Cloudinary
  // is set up.
  async uploadImage(file, folder = 'covers') {
    const session = await store.getSession();
    if (!session || !session.isAdmin) throw new AuthRequiredError('Sign in as an admin to upload images.');
    const settings = await store.getSettings();
    if (settings.cloudinaryCloudName && settings.cloudinaryUploadPreset) {
      return await uploadToCloudinary(file, folder, settings);
    }
    const ext = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
    const id = (crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2));
    const path = `${folder}/${id}.${ext}`;
    const { error } = await supabase.storage.from('post-images').upload(path, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type || undefined,
    });
    if (error) throw error;
    const { data } = supabase.storage.from('post-images').getPublicUrl(path);
    return data.publicUrl;
  },

  // ---------------- Site settings (admin only: Cloudinary + Groq) ----------------
  async getSettings() {
    const { data, error } = await supabase.from('site_settings').select('*').eq('id', true).maybeSingle();
    if (error) throw error;
    return mapSettings(data);
  },
  async saveSettings(patch) {
    const record = {};
    const strField = (src, dst) => { if (src in patch) record[dst] = (patch[src] || '').trim(); };
    strField('cloudinaryCloudName',   'cloudinary_cloud_name');
    strField('cloudinaryUploadPreset','cloudinary_upload_preset');
    for (let i = 1; i <= 5; i++) strField(`groqApiKey${i}`, `groq_api_key_${i}`);
    strField('siteName',           'site_name');
    strField('footerCredit',       'footer_credit');
    strField('contactEmail',       'contact_email');
    strField('contactPhone',       'contact_phone');
    strField('contactAddress',     'contact_address');
    strField('fbUrl',              'fb_url');
    strField('twitterUrl',         'twitter_url');
    strField('instagramUrl',       'instagram_url');
    strField('whatsappNumber',     'whatsapp_number');
    strField('whatsappChannelUrl', 'whatsapp_channel_url');
    strField('aboutText',          'about_text');
    strField('statsReaders',       'stats_readers');
    strField('statsStories',       'stats_stories');
    strField('statsSections',      'stats_sections');
    strField('statsWriters',       'stats_writers');
    record.updated_at = new Date().toISOString();
    const { data, error } = await supabase.from('site_settings').update(record).eq('id', true).select().single();
    if (error) throw error;
    return mapSettings(data);
  },

  // ---------------- AI Write (Groq) ----------------
  // Tries each configured key in order (1-5), skipping to the next on an
  // auth/quota error so one exhausted free-tier key doesn't block writing.
  async aiWrite(topic) {
    const settings = await store.getSettings();
    const keys = [1, 2, 3, 4, 5].map((i) => settings[`groqApiKey${i}`]).filter(Boolean);
    if (keys.length === 0) throw new Error('No Groq API key configured yet. Add one in Settings.');

    const prompt = `Write a blog post draft for "The Educative Blog" about: ${topic}\n\n` +
      `Respond with strict JSON only, no markdown fences, in this exact shape:\n` +
      `{"title": "...", "excerpt": "one or two sentence summary", "bodyHtml": "<h2>...</h2><p>...</p> using only h2, h3, p, ul, li, blockquote, strong, em tags"}`;

    let lastError;
    for (const key of keys) {
      try {
        const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
          body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages: [
              { role: 'system', content: 'You are a skilled editorial writer. Always respond with strict JSON only.' },
              { role: 'user', content: prompt },
            ],
            temperature: 0.7,
          }),
        });
        if (!res.ok) {
          const status = res.status;
          lastError = new Error(`Groq request failed (${status})`);
          if (status === 401 || status === 429) continue; // try next key
          throw lastError;
        }
        const data = await res.json();
        const raw = data.choices?.[0]?.message?.content || '';
        const cleaned = raw.trim().replace(/^```(json)?/i, '').replace(/```$/, '').trim();
        const parsed = JSON.parse(cleaned);
        return {
          title: parsed.title || '',
          excerpt: parsed.excerpt || '',
          bodyHtml: parsed.bodyHtml || '',
        };
      } catch (err) {
        lastError = err;
      }
    }
    throw lastError || new Error('AI write failed.');
  },

  // Editorial "author" metadata (Marcus Chen, Elena Rostova, etc.) is a
  // fixed staff list, not tied to reader/admin auth accounts.
  userById(id) {
    return USERS.find((u) => u.id === id) || null;
  },

  // ---------------- Categories (DB-backed, cached per page load) ----------------
  async getCategories() {
    if (_catsCache) return _catsCache;
    try {
      const { data, error } = await supabase.from('categories').select('*').order('sort_order');
      if (error) throw error;
      _catsCache = (data || []).map(mapCategory);
    } catch (_) {
      _catsCache = CATEGORIES.map(mapCategory);
    }
    return _catsCache;
  },
  async categoryById(id) {
    return (await store.getCategories()).find((c) => c.id === id) || null;
  },
  async categoryBySlug(slug) {
    return (await store.getCategories()).find((c) => c.slug === slug) || null;
  },
  async createCategory(cat) {
    const id = 'c' + Date.now().toString(36);
    const record = { id, slug: cat.slug || cat.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'), name: cat.name, icon: cat.icon || 'sparkle', description: cat.description || '', sort_order: cat.sortOrder || 0 };
    const { data, error } = await supabase.from('categories').insert(record).select().single();
    if (error) throw error;
    _catsCache = null;
    return mapCategory(data);
  },
  async updateCategory(id, patch) {
    const record = {};
    if (patch.name !== undefined) record.name = patch.name;
    if (patch.slug !== undefined) record.slug = patch.slug;
    if (patch.icon !== undefined) record.icon = patch.icon;
    if (patch.description !== undefined) record.description = patch.description;
    if (patch.sortOrder !== undefined) record.sort_order = patch.sortOrder;
    const { data, error } = await supabase.from('categories').update(record).eq('id', id).select().single();
    if (error) throw error;
    _catsCache = null;
    return mapCategory(data);
  },
  async deleteCategory(id) {
    const { error } = await supabase.from('categories').delete().eq('id', id);
    if (error) throw error;
    _catsCache = null;
  },

  // ---------------- Authors (DB-backed, cached per page load) ----------------
  async getAuthors() {
    if (_authorsCache) return _authorsCache;
    try {
      const { data, error } = await supabase.from('authors').select('*').order('sort_order');
      if (error) throw error;
      _authorsCache = (data || []).map(mapAuthor);
    } catch (_) {
      _authorsCache = USERS.map((u) => mapAuthor({ id: u.id, name: u.name, email: u.email, avatar_url: u.avatar, role: u.bio?.split('.')[0] || '', bio: u.bio }));
    }
    return _authorsCache;
  },
  async authorById(id) {
    return (await store.getAuthors()).find((a) => a.id === id) || null;
  },
  async createAuthor(author) {
    const id = 'u' + Date.now().toString(36);
    const record = { id, name: author.name, email: author.email || '', avatar_url: author.avatarUrl || '', role: author.role || '', bio: author.bio || '', sort_order: author.sortOrder || 0 };
    const { data, error } = await supabase.from('authors').insert(record).select().single();
    if (error) throw error;
    _authorsCache = null;
    return mapAuthor(data);
  },
  async updateAuthor(id, patch) {
    const record = {};
    if (patch.name !== undefined) record.name = patch.name;
    if (patch.email !== undefined) record.email = patch.email;
    if (patch.avatarUrl !== undefined) record.avatar_url = patch.avatarUrl;
    if (patch.role !== undefined) record.role = patch.role;
    if (patch.bio !== undefined) record.bio = patch.bio;
    if (patch.sortOrder !== undefined) record.sort_order = patch.sortOrder;
    const { data, error } = await supabase.from('authors').update(record).eq('id', id).select().single();
    if (error) throw error;
    _authorsCache = null;
    return mapAuthor(data);
  },
  async deleteAuthor(id) {
    const { error } = await supabase.from('authors').delete().eq('id', id);
    if (error) throw error;
    _authorsCache = null;
  },

  // Editorial author lookup (sync compat wrapper — prefer authorById() for fresh data)
  userById(id) {
    return USERS.find((u) => u.id === id) || null;
  },
};

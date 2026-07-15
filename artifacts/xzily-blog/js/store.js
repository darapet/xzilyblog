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

  // ---------------- Image uploads (admin only, Supabase Storage) ----------------
  async uploadImage(file, folder = 'covers') {
    const session = await store.getSession();
    if (!session || !session.isAdmin) throw new AuthRequiredError('Sign in as an admin to upload images.');
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

  // Editorial "author" metadata (Marcus Chen, Elena Rostova, etc.) is a
  // fixed staff list, not tied to reader/admin auth accounts.
  userById(id) {
    return USERS.find((u) => u.id === id) || null;
  },
};

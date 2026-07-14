// Client-side data store backed by localStorage.
// This simulates persistence until a real backend is wired up.
// Nothing here talks to a server -- it is intentionally frontend-only.
import { POSTS, COMMENTS, USERS } from './data.js';

const KEY = 'xzily_store_v1';

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('Xzily store: failed to parse localStorage, resetting.', e);
  }
  return {
    posts: POSTS,
    comments: COMMENTS,
    likedPosts: [],
    bookmarkedPosts: [],
    likedComments: [],
    subscribers: [],
    contacts: [],
    session: null, // { email, name, isAdmin }
    notificationsOptedIn: false,
  };
}

let state = load();

function persist() {
  localStorage.setItem(KEY, JSON.stringify(state));
}

export const store = {
  getState() {
    return state;
  },

  // ---------------- Posts ----------------
  getPosts({ status = 'published' } = {}) {
    const list = state.posts;
    return status === 'all' ? list : list.filter((p) => p.status === status);
  },
  getPostBySlug(slug) {
    return state.posts.find((p) => p.slug === slug);
  },
  getPostById(id) {
    return state.posts.find((p) => p.id === id);
  },
  createPost(post) {
    const id = 'p' + (Date.now());
    const slug = slugify(post.title) + '-' + id.slice(-4);
    const record = {
      id,
      slug,
      title: post.title,
      excerpt: post.excerpt,
      content: post.content,
      coverImage: post.coverImage || '/images/cover-1.jpg',
      authorId: post.authorId || 'u1',
      categoryId: post.categoryId,
      tags: post.tags || [],
      status: post.status || 'draft',
      createdAt: new Date().toISOString(),
      readingTime: Math.max(1, Math.round((post.content || '').split(' ').length / 200)),
      views: 0,
      likes: 0,
      featured: false,
      popular: false,
    };
    state.posts = [record, ...state.posts];
    persist();
    return record;
  },
  updatePost(id, patch) {
    state.posts = state.posts.map((p) => (p.id === id ? { ...p, ...patch } : p));
    persist();
    return state.posts.find((p) => p.id === id);
  },
  deletePost(id) {
    state.posts = state.posts.filter((p) => p.id !== id);
    persist();
  },
  incrementViews(id) {
    state.posts = state.posts.map((p) => (p.id === id ? { ...p, views: (p.views || 0) + 1 } : p));
    persist();
  },

  // ---------------- Likes / bookmarks ----------------
  isLiked(postId) {
    return state.likedPosts.includes(postId);
  },
  toggleLike(postId) {
    const liked = state.likedPosts.includes(postId);
    if (liked) {
      state.likedPosts = state.likedPosts.filter((id) => id !== postId);
      state.posts = state.posts.map((p) => (p.id === postId ? { ...p, likes: Math.max(0, p.likes - 1) } : p));
    } else {
      state.likedPosts = [...state.likedPosts, postId];
      state.posts = state.posts.map((p) => (p.id === postId ? { ...p, likes: p.likes + 1 } : p));
    }
    persist();
    return !liked;
  },
  isBookmarked(postId) {
    return state.bookmarkedPosts.includes(postId);
  },
  toggleBookmark(postId) {
    const marked = state.bookmarkedPosts.includes(postId);
    state.bookmarkedPosts = marked
      ? state.bookmarkedPosts.filter((id) => id !== postId)
      : [...state.bookmarkedPosts, postId];
    persist();
    return !marked;
  },
  getBookmarkedPosts() {
    return state.posts.filter((p) => state.bookmarkedPosts.includes(p.id));
  },

  // ---------------- Comments ----------------
  getCommentsForPost(postId) {
    return state.comments.filter((c) => c.postId === postId);
  },
  addComment(postId, content, parentId = null) {
    const comment = {
      id: 'cmt' + Date.now(),
      postId,
      authorId: state.session ? 'guest' : 'guest',
      authorName: state.session ? state.session.name : 'Guest Reader',
      content,
      createdAt: new Date().toISOString(),
      likes: 0,
      replies: [],
    };
    if (parentId) {
      state.comments = state.comments.map((c) => {
        if (c.id === parentId) {
          return { ...c, replies: [...c.replies, comment] };
        }
        return c;
      });
    } else {
      state.comments = [comment, ...state.comments];
    }
    persist();
    return comment;
  },
  deleteComment(commentId) {
    state.comments = state.comments
      .filter((c) => c.id !== commentId)
      .map((c) => ({ ...c, replies: c.replies.filter((r) => r.id !== commentId) }));
    persist();
  },
  toggleCommentLike(commentId) {
    const liked = state.likedComments.includes(commentId);
    const bump = (c) => (c.id === commentId ? { ...c, likes: c.likes + (liked ? -1 : 1) } : c);
    state.comments = state.comments.map((c) => ({ ...bump(c), replies: c.replies.map(bump) }));
    state.likedComments = liked
      ? state.likedComments.filter((id) => id !== commentId)
      : [...state.likedComments, commentId];
    persist();
    return !liked;
  },
  allComments() {
    const flat = [];
    state.comments.forEach((c) => {
      flat.push(c);
      c.replies.forEach((r) => flat.push(r));
    });
    return flat;
  },

  // ---------------- Auth (demo only) ----------------
  getSession() {
    return state.session;
  },
  login(email, _password) {
    const name = email.split('@')[0].replace(/[._]/g, ' ');
    state.session = { email, name: capitalize(name), isAdmin: false };
    persist();
    return state.session;
  },
  register(name, email, _password) {
    state.session = { email, name, isAdmin: false };
    persist();
    return state.session;
  },
  loginAdmin(email, password) {
    // Demo-only bypass credential, clearly documented for the owner.
    if (email === 'admin@xzily.com' && password === 'xzily-admin') {
      state.session = { email, name: 'Elena Rostova', isAdmin: true };
      persist();
      return state.session;
    }
    return null;
  },
  logout() {
    state.session = null;
    persist();
  },

  // ---------------- Newsletter / contact ----------------
  addSubscriber(email) {
    if (!state.subscribers.some((s) => s.email === email)) {
      state.subscribers = [...state.subscribers, { email, subscribedAt: new Date().toISOString() }];
      persist();
    }
  },
  getSubscribers() {
    return state.subscribers;
  },
  removeSubscriber(email) {
    state.subscribers = state.subscribers.filter((s) => s.email !== email);
    persist();
  },
  addContactMessage(msg) {
    state.contacts = [{ ...msg, id: 'msg' + Date.now(), createdAt: new Date().toISOString() }, ...state.contacts];
    persist();
  },

  // ---------------- Notifications (real browser Notification API) ----------------
  getNotificationOptIn() {
    return state.notificationsOptedIn;
  },
  setNotificationOptIn(v) {
    state.notificationsOptedIn = v;
    persist();
  },

  userById(id) {
    return USERS.find((u) => u.id === id) || { id, name: 'Guest Reader', avatar: '/images/avatar-1.jpg' };
  },

  reset() {
    localStorage.removeItem(KEY);
    state = load();
  },
};

function slugify(str) {
  return str.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}
function capitalize(s) {
  return s.split(' ').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

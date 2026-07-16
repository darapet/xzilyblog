import { mountLayout, formatDate, timeAgo, formatCount, qs, escapeHtml, toast, getCatColor } from './common.js';
import { icon } from './icons.js';
import { store, AuthRequiredError } from './store.js';

await mountLayout('article.html');

const [AUTHORS, CATEGORIES] = await Promise.all([store.getAuthors(), store.getCategories()]);
const userById = (id) => AUTHORS.find((u) => u.id === id) || { name: 'Staff Writer', avatar: 'images/avatar-1.jpg', avatarUrl: 'images/avatar-1.jpg', bio: '' };
const categoryById = (id) => CATEGORIES.find((c) => c.id === id) || null;

const slug = qs('slug');
const isPreview = qs('preview') === '1';
const post = slug ? await store.getPostBySlug(slug) : null;

if (isPreview) renderPreviewBanner(post);

if (!post) {
  document.getElementById('articleRoot').innerHTML = notFoundHtml();
  document.getElementById('articleSidebar').innerHTML = '';
} else {
  if (!isPreview) await store.incrementViews(post.id);
  await render(post);
}

function renderPreviewBanner(p) {
  const bar = document.createElement('div');
  bar.className = 'preview-banner';
  const statusNote = p && p.status !== 'published' ? `This story is still a <strong>${p.status}</strong> — only admins can see this link.` : "You're previewing this published story as an admin.";
  bar.innerHTML = `
    <span>${icon('eye', 15)} ${statusNote}</span>
    ${p ? `<a class="btn btn-outline btn-sm" href="admin/editor.html?id=${p.id}">${icon('edit', 14)} Edit story</a>` : ''}`;
  document.body.prepend(bar);
}

function notFoundHtml() {
  return `
    <div class="empty-state">
      <div class="icon-wrap">${icon('alertTriangle', 26)}</div>
      <h3>Story not found</h3>
      <p>That article may have been moved or unpublished.</p>
      <p style="margin-top:18px;"><a class="btn btn-primary" href="index.html">Back to home</a></p>
    </div>`;
}

async function render(p) {
  const isNews = p.authorId === 'news-bot';
  const author = isNews ? null : userById(p.authorId);
  const cat = categoryById(p.categoryId);
  document.getElementById('pageTitle').textContent = `${p.title} — The Educative Blog`;
  document.getElementById('pageDesc').setAttribute('content', p.excerpt);

  const [liked, bookmarked] = await Promise.all([store.isLiked(p.id), store.isBookmarked(p.id)]);

  document.getElementById('articleRoot').innerHTML = `
    <div class="article-header">
      <div class="breadcrumb">
        <a href="index.html">HOME</a> ${icon('chevronRight', 12)}
        <a href="category.html?slug=${cat ? cat.slug : ''}">${cat ? cat.name : ''}</a>
      </div>
      <h1>${p.title}</h1>
      <p class="article-subtitle">${p.excerpt}</p>
      
      <div class="article-meta-bar">
        <div class="author-info">
          ${author ? `<img src="${author.avatar}" alt="${author.name}" /><div><div class="author-name">${author.name}</div>` : '<div>'}
            <div class="publish-date">${formatDate(p.createdAt)} &middot; ${p.readingTime} MIN READ</div>
          </div>
        </div>
        <div class="social-share">
          <a class="icon-btn" href="https://wa.me/?text=${encodeURIComponent(p.title + ' — ' + shareUrl(p))}" target="_blank" rel="noopener" title="Share on WhatsApp">${icon('whatsapp', 16)}</a>
          <a class="icon-btn" href="https://twitter.com/intent/tweet?text=${encodeURIComponent(p.title)}&url=${encodeURIComponent(shareUrl(p))}" target="_blank" rel="noopener" title="Share on X">${icon('x', 16)}</a>
          <a class="icon-btn" href="https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl(p))}" target="_blank" rel="noopener" title="Share on Facebook">${icon('facebook', 16)}</a>
          <button class="icon-btn" id="copyLinkBtn" title="Copy link">${icon('copy', 16)}</button>
        </div>
      </div>
    </div>
    
    <img class="article-cover" src="${p.coverImage}" alt="${escapeHtml(p.title)}" />
    
    <div class="article-body">
      ${p.content}
    </div>
    
    <div class="article-tags">
      ${p.tags.map((t) => `<a class="tag-chip" href="search.html?q=${encodeURIComponent(t)}">${t}</a>`).join('')}
    </div>
    
    <div class="engage-bar">
      <button class="icon-btn ${liked ? 'is-active' : ''}" id="likeBtn">${icon('heart', 18)} <span id="likeCount">${formatCount(p.likes)}</span></button>
      <button class="icon-btn ${bookmarked ? 'is-active' : ''}" id="bookmarkBtn">${icon('bookmark', 18)} Save</button>
    </div>
    
    ${author ? `
    <div class="author-box">
      <img src="${author.avatar}" alt="${author.name}" />
      <div>
        <h4>${author.name}</h4>
        <p>${author.bio || ''}</p>
      </div>
    </div>` : ''}
    
    <section class="comments-section" id="commentsSection"></section>
  `;

  document.getElementById('articleSidebar').innerHTML = await sidebarHtml(p);

  document.getElementById('likeBtn').addEventListener('click', async () => {
    try {
      const nowLiked = await store.toggleLike(p.id);
      const btn = document.getElementById('likeBtn');
      btn.classList.toggle('is-active', nowLiked);
      const fresh = await store.getPostById(p.id);
      document.getElementById('likeCount').textContent = formatCount(fresh.likes);
      toast(nowLiked ? 'Added to your likes' : 'Removed from likes', 'heart');
    } catch (err) {
      handleAuthError(err, 'Sign in to like stories');
    }
  });
  document.getElementById('bookmarkBtn').addEventListener('click', async () => {
    try {
      const marked = await store.toggleBookmark(p.id);
      document.getElementById('bookmarkBtn').classList.toggle('is-active', marked);
      toast(marked ? 'Saved to bookmarks' : 'Removed from bookmarks', 'bookmark');
    } catch (err) {
      handleAuthError(err, 'Sign in to save stories');
    }
  });
  document.getElementById('copyLinkBtn').addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(shareUrl(p));
      toast('Link copied to clipboard', 'copy');
    } catch {
      toast('Could not copy link');
    }
  });

  await renderComments(p.id);
  initReadingProgress();
}

function handleAuthError(err, message) {
  if (err instanceof AuthRequiredError) {
    toast(message);
    setTimeout(() => (window.location.href = 'login.html'), 900);
  } else {
    toast('Something went wrong');
  }
}

function initReadingProgress() {
  const bar = document.getElementById('readingProgress');
  if (!bar) return;
  const onScroll = () => {
    const doc = document.documentElement;
    const scrollable = doc.scrollHeight - doc.clientHeight;
    const pct = scrollable > 0 ? (doc.scrollTop / scrollable) * 100 : 0;
    bar.style.width = `${Math.min(100, Math.max(0, pct))}%`;
  };
  document.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

function shareUrl(p) {
  // Preserve the GitHub Pages subpath (e.g. /xzilyblog/) so shared links
  // don't drop the repo name and 404. Works on any host or subpath.
  const base = window.location.href.split('?')[0].replace(/[^/]+$/, '');
  return `${base}article.html?slug=${p.slug}`;
}

async function sidebarHtml(p) {
  const related = (await store.getPosts({ status: 'published' })).filter((x) => x.categoryId === p.categoryId && x.id !== p.id).slice(0, 5);
  return `
    <div class="widget">
      <h3 class="widget-title">Related News</h3>
      <div class="trending-list">
        ${related.map((r, i) => `
          <a class="trending-item" href="article.html?slug=${r.slug}">
            <span class="trending-rank">${i + 1}</span>
            <div class="trending-info">
              <h4>${r.title}</h4>
              <div class="trending-meta">${formatDate(r.createdAt)}</div>
            </div>
          </a>`).join('') || '<span style="font-size:13px;color:var(--text-muted);">No related stories yet.</span>'}
      </div>
    </div>
    <div class="widget newsletter-widget">
      <h3 class="widget-title">Subscribe</h3>
      <p>Never miss a story. Get our weekly newsletter.</p>
      <form class="newsletter-form" style="margin-top: 15px;">
        <input type="email" placeholder="Email address" required />
        <button class="btn btn-primary btn-block" type="submit" style="margin-top: 10px;">Sign Up</button>
      </form>
    </div>`;
}

async function renderComments(postId) {
  const section = document.getElementById('commentsSection');
  const comments = await store.getCommentsForPost(postId);
  const total = comments.reduce((sum, c) => sum + 1 + c.replies.length, 0);
  section.innerHTML = `
    <h3 class="comments-header">${total} Comments</h3>
    <div class="comment-form">
      <textarea id="commentInput" placeholder="Share your thoughts..."></textarea>
      <div class="comment-form-actions">
        <button class="btn btn-primary" id="postCommentBtn">Post comment</button>
      </div>
    </div>
    <div id="commentList"></div>`;

  await renderCommentList(postId);

  document.getElementById('postCommentBtn').addEventListener('click', async () => {
    const input = document.getElementById('commentInput');
    if (!input.value.trim()) return;
    try {
      await store.addComment(postId, input.value.trim());
      input.value = '';
      await renderCommentList(postId);
      toast('Comment posted');
    } catch (err) {
      handleAuthError(err, 'Sign in to leave a comment');
    }
  });
}

async function renderCommentList(postId) {
  const list = document.getElementById('commentList');
  const [comments, likedIds, session] = await Promise.all([
    store.getCommentsForPost(postId),
    store.likedCommentIdsForPost(postId),
    store.getSession(),
  ]);
  list.innerHTML = comments.map((c) => commentHtml(c, likedIds, session)).join('') || '<p style="color:var(--text-muted);font-size:14px;padding:20px 0;">Be the first to comment.</p>';

  list.querySelectorAll('[data-like]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      try {
        const liked = await store.toggleCommentLike(btn.dataset.like);
        btn.classList.toggle('liked', liked);
        const count = await commentCount(btn.dataset.like);
        btn.querySelector('span').textContent = formatCount(count);
      } catch (err) {
        handleAuthError(err, 'Sign in to like comments');
      }
    });
  });
  list.querySelectorAll('[data-reply-toggle]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const form = document.getElementById('reply-' + btn.dataset.replyToggle);
      form.classList.toggle('open');
    });
  });
  list.querySelectorAll('[data-reply-submit]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const parentId = btn.dataset.replySubmit;
      const input = document.getElementById('reply-input-' + parentId);
      if (!input.value.trim()) return;
      try {
        await store.addComment(postId, input.value.trim(), parentId);
        await renderCommentList(postId);
        toast('Reply posted');
      } catch (err) {
        handleAuthError(err, 'Sign in to reply');
      }
    });
  });
  list.querySelectorAll('[data-delete]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      await store.deleteComment(btn.dataset.delete);
      await renderCommentList(postId);
      toast('Comment deleted');
    });
  });
}

async function commentCount(id) {
  const all = await store.allComments();
  const c = all.find((x) => x.id === id);
  return c ? c.likes : 0;
}

function commentHtml(c, likedIds, session) {
  const authorName = c.authorName || 'Guest Reader';
  const liked = likedIds.has(c.id);
  const canDelete = !!session && (session.id === c.authorId || session.isAdmin);
  return `
    <div class="comment">
      <img src="images/avatar-1.jpg" alt="${escapeHtml(authorName)}" />
      <div class="comment-content">
        <div class="comment-meta">
          <span class="name">${escapeHtml(authorName)}</span>
          <span class="date">${timeAgo(c.createdAt)}</span>
        </div>
        <p class="comment-text">${escapeHtml(c.content)}</p>
        <div class="comment-actions">
          <button data-like="${c.id}" class="${liked ? 'liked' : ''}">${icon('heart', 14)} <span>${formatCount(c.likes)}</span></button>
          <button data-reply-toggle="${c.id}">${icon('messageCircle', 14)} Reply</button>
          ${canDelete ? `<button data-delete="${c.id}">${icon('trash', 14)} Delete</button>` : ''}
        </div>
        <div class="reply-form" id="reply-${c.id}">
          <textarea id="reply-input-${c.id}" placeholder="Write a reply..."></textarea>
          <button class="btn btn-outline" data-reply-submit="${c.id}">Post Reply</button>
        </div>
        ${c.replies.length ? `<div class="comment-replies">${c.replies.map((r) => commentHtml(r, likedIds, session)).join('')}</div>` : ''}
      </div>
    </div>`;
}

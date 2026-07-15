import { mountLayout, formatDate, timeAgo, formatCount, qs, escapeHtml, toast, getCatColor } from './common.js';
import { icon } from './icons.js';
import { userById, categoryById } from './data.js';
import { store } from './store.js';

mountLayout('article.html');

const slug = qs('slug');
const post = slug ? store.getPostBySlug(slug) : null;

if (!post) {
  document.getElementById('articleRoot').innerHTML = notFoundHtml();
  document.getElementById('articleSidebar').innerHTML = '';
} else {
  store.incrementViews(post.id);
  render(post);
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

function render(p) {
  const author = userById(p.authorId);
  const cat = categoryById(p.categoryId);
  document.getElementById('pageTitle').textContent = `${p.title} — The Educative Blog`;
  document.getElementById('pageDesc').setAttribute('content', p.excerpt);

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
          <img src="${author.avatar}" alt="${author.name}" />
          <div>
            <div class="author-name">${author.name}</div>
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
      <button class="icon-btn ${store.isLiked(p.id) ? 'is-active' : ''}" id="likeBtn">${icon('heart', 18)} <span id="likeCount">${formatCount(p.likes)}</span></button>
      <button class="icon-btn ${store.isBookmarked(p.id) ? 'is-active' : ''}" id="bookmarkBtn">${icon('bookmark', 18)} Save</button>
    </div>
    
    <div class="author-box">
      <img src="${author.avatar}" alt="${author.name}" />
      <div>
        <h4>${author.name}</h4>
        <p>${author.bio || ''}</p>
      </div>
    </div>
    
    <section class="comments-section" id="commentsSection"></section>
  `;

  document.getElementById('articleSidebar').innerHTML = sidebarHtml(p);

  document.getElementById('likeBtn').addEventListener('click', () => {
    const liked = store.toggleLike(p.id);
    const btn = document.getElementById('likeBtn');
    btn.classList.toggle('is-active', liked);
    document.getElementById('likeCount').textContent = formatCount(store.getPostById(p.id).likes);
    toast(liked ? 'Added to your likes' : 'Removed from likes', 'heart');
  });
  document.getElementById('bookmarkBtn').addEventListener('click', () => {
    const marked = store.toggleBookmark(p.id);
    document.getElementById('bookmarkBtn').classList.toggle('is-active', marked);
    toast(marked ? 'Saved to bookmarks' : 'Removed from bookmarks', 'bookmark');
  });
  document.getElementById('copyLinkBtn').addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(shareUrl(p));
      toast('Link copied to clipboard', 'copy');
    } catch {
      toast('Could not copy link');
    }
  });

  renderComments(p.id);
  initReadingProgress();
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
  return `${window.location.origin}/article.html?slug=${p.slug}`;
}

function sidebarHtml(p) {
  const related = store.getPosts({ status: 'published' }).filter((x) => x.categoryId === p.categoryId && x.id !== p.id).slice(0, 5);
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

function renderComments(postId) {
  const section = document.getElementById('commentsSection');
  const comments = store.getCommentsForPost(postId);
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

  renderCommentList(postId);

  document.getElementById('postCommentBtn').addEventListener('click', () => {
    const input = document.getElementById('commentInput');
    if (!input.value.trim()) return;
    store.addComment(postId, input.value.trim());
    input.value = '';
    renderCommentList(postId);
    toast('Comment posted');
  });
}

function renderCommentList(postId) {
  const list = document.getElementById('commentList');
  const comments = store.getCommentsForPost(postId);
  list.innerHTML = comments.map((c) => commentHtml(c)).join('') || '<p style="color:var(--text-muted);font-size:14px;padding:20px 0;">Be the first to comment.</p>';

  list.querySelectorAll('[data-like]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const liked = store.toggleCommentLike(btn.dataset.like);
      btn.classList.toggle('liked', liked);
      btn.querySelector('span').textContent = formatCount(commentCount(btn.dataset.like));
    });
  });
  list.querySelectorAll('[data-reply-toggle]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const form = document.getElementById('reply-' + btn.dataset.replyToggle);
      form.classList.toggle('open');
    });
  });
  list.querySelectorAll('[data-reply-submit]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const parentId = btn.dataset.replySubmit;
      const input = document.getElementById('reply-input-' + parentId);
      if (!input.value.trim()) return;
      store.addComment(postId, input.value.trim(), parentId);
      renderCommentList(postId);
      toast('Reply posted');
    });
  });
  list.querySelectorAll('[data-delete]').forEach((btn) => {
    btn.addEventListener('click', () => {
      store.deleteComment(btn.dataset.delete);
      renderCommentList(postId);
      toast('Comment deleted');
    });
  });
}

function commentCount(id) {
  const all = store.allComments();
  const c = all.find((x) => x.id === id);
  return c ? c.likes : 0;
}

function commentHtml(c) {
  const author = store.userById(c.authorId) || { name: c.authorName || 'Guest Reader', avatar: 'images/avatar-1.jpg' };
  const liked = store.getState().likedComments.includes(c.id);
  return `
    <div class="comment">
      <img src="${author.avatar}" alt="${author.name}" />
      <div class="comment-content">
        <div class="comment-meta">
          <span class="name">${escapeHtml(author.name || c.authorName || 'Guest Reader')}</span>
          <span class="date">${timeAgo(c.createdAt)}</span>
        </div>
        <p class="comment-text">${escapeHtml(c.content)}</p>
        <div class="comment-actions">
          <button data-like="${c.id}" class="${liked ? 'liked' : ''}">${icon('heart', 14)} <span>${formatCount(c.likes)}</span></button>
          <button data-reply-toggle="${c.id}">${icon('messageCircle', 14)} Reply</button>
          <button data-delete="${c.id}">${icon('trash', 14)} Delete</button>
        </div>
        <div class="reply-form" id="reply-${c.id}">
          <textarea id="reply-input-${c.id}" placeholder="Write a reply..."></textarea>
          <button class="btn btn-outline" data-reply-submit="${c.id}">Post Reply</button>
        </div>
        ${c.replies.length ? `<div class="comment-replies">${c.replies.map((r) => commentHtml(r)).join('')}</div>` : ''}
      </div>
    </div>`;
}
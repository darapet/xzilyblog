import { mountLayout, formatDate, timeAgo, formatCount, qs, escapeHtml, toast } from './common.js';
import { icon } from './icons.js';
import { userById, categoryById } from './data.js';
import { store } from './store.js';

mountLayout('');

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
      <p style="margin-top:18px;"><a class="btn btn-primary" href="/index.html">Back to home</a></p>
    </div>`;
}

function render(p) {
  const author = userById(p.authorId);
  const cat = categoryById(p.categoryId);
  document.getElementById('pageTitle').textContent = `${p.title} — Xzily`;
  document.getElementById('pageDesc').setAttribute('content', p.excerpt);

  document.getElementById('articleRoot').innerHTML = `
    <div class="breadcrumb">
      <a href="/index.html">Home</a> ${icon('chevronRight', 12)}
      <a href="/category.html?slug=${cat ? cat.slug : ''}">${cat ? cat.name : ''}</a> ${icon('chevronRight', 12)}
      <span>${escapeHtml(p.title)}</span>
    </div>
    <span class="cat-badge">${cat ? cat.name : ''}</span>
    <h1>${p.title}</h1>
    <p class="subtitle">${p.excerpt}</p>
    <div class="article-byline">
      <img class="avatar" src="${author.avatar}" alt="${author.name}" />
      <div>
        <div class="name">${author.name}</div>
        <div class="meta">
          <span>${formatDate(p.createdAt)}</span>
          <span>&middot;</span>
          <span>${icon('clock', 13)} ${p.readingTime} min read</span>
          <span>&middot;</span>
          <span>${icon('eye', 13)} ${formatCount(p.views)} views</span>
        </div>
      </div>
    </div>
    <img class="article-cover" src="${p.coverImage}" alt="${escapeHtml(p.title)}" />
    <div class="article-body">${p.content}</div>
    <div class="article-tags">
      ${p.tags.map((t) => `<a class="tag-chip" href="/search.html?q=${encodeURIComponent(t)}">${icon('tag', 12)} ${t}</a>`).join('')}
    </div>
    <div class="engage-bar">
      <button class="icon-btn ${store.isLiked(p.id) ? 'is-active' : ''}" id="likeBtn">${icon('heart', 18)} <span id="likeCount">${formatCount(p.likes)}</span></button>
      <button class="icon-btn ${store.isBookmarked(p.id) ? 'is-active' : ''}" id="bookmarkBtn">${icon('bookmark', 18)}</button>
      <div class="spacer"></div>
      <div class="share-row">
        <a class="icon-btn" href="https://wa.me/?text=${encodeURIComponent(p.title + ' — ' + shareUrl(p))}" target="_blank" rel="noopener" title="Share on WhatsApp">${icon('whatsapp', 16)}</a>
        <a class="icon-btn" href="https://twitter.com/intent/tweet?text=${encodeURIComponent(p.title)}&url=${encodeURIComponent(shareUrl(p))}" target="_blank" rel="noopener" title="Share on X">${icon('x', 16)}</a>
        <a class="icon-btn" href="https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl(p))}" target="_blank" rel="noopener" title="Share on Facebook">${icon('facebook', 16)}</a>
        <button class="icon-btn" id="copyLinkBtn" title="Copy link">${icon('copy', 16)}</button>
      </div>
    </div>
    <div class="author-card">
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
}

function shareUrl(p) {
  return `${window.location.origin}/article.html?slug=${p.slug}`;
}

function sidebarHtml(p) {
  const headings = extractHeadings(p.content);
  const related = store.getPosts({ status: 'published' }).filter((x) => x.categoryId === p.categoryId && x.id !== p.id).slice(0, 3);
  return `
    ${headings.length ? `
    <div class="sidebar-box">
      <h5>In this story</h5>
      <ul class="toc-list">
        ${headings.map((h, i) => `<li><a href="#toc-${i}">${h}</a></li>`).join('')}
      </ul>
    </div>` : ''}
    <div class="sidebar-box">
      <h5>Related stories</h5>
      <div style="display:flex;flex-direction:column;gap:14px;">
        ${related.map((r) => `
          <a href="/article.html?slug=${r.slug}" style="display:flex;gap:10px;">
            <span class="thumb" style="width:64px;height:48px;border-radius:8px;overflow:hidden;flex-shrink:0;"><img src="${r.coverImage}" style="width:100%;height:100%;object-fit:cover;" /></span>
            <span style="font-size:13.5px;font-weight:600;line-height:1.3;">${r.title}</span>
          </a>`).join('') || '<span style="font-size:13px;color:var(--ink-400);">No related stories yet.</span>'}
      </div>
    </div>`;
}

function extractHeadings(html) {
  const matches = [...html.matchAll(/<h2>(.*?)<\/h2>/g)];
  return matches.map((m) => m[1]);
}

function renderComments(postId) {
  const section = document.getElementById('commentsSection');
  const comments = store.getCommentsForPost(postId);
  const total = comments.reduce((sum, c) => sum + 1 + c.replies.length, 0);
  section.innerHTML = `
    <h3 class="related-heading">${icon('messageCircle', 20)} ${total} Comments</h3>
    <div class="comment-form">
      <textarea id="commentInput" placeholder="Share your thoughts..."></textarea>
      <div class="comment-form-actions">
        <button class="btn btn-primary btn-sm" id="postCommentBtn">Post comment</button>
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
  list.innerHTML = comments.map((c) => commentHtml(c)).join('') || '<p style="color:var(--ink-400);font-size:14px;padding:20px 0;">Be the first to comment.</p>';

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
  const author = store.userById(c.authorId) || { name: c.authorName || 'Guest Reader', avatar: '/images/avatar-1.jpg' };
  const liked = store.getState().likedComments.includes(c.id);
  return `
    <div class="comment">
      <img class="avatar" src="${author.avatar}" alt="${author.name}" />
      <div class="comment-content">
        <span class="name">${escapeHtml(author.name || c.authorName || 'Guest Reader')}</span>
        <span class="time">${timeAgo(c.createdAt)}</span>
        <p>${escapeHtml(c.content)}</p>
        <div class="comment-actions">
          <button data-like="${c.id}" class="${liked ? 'liked' : ''}">${icon('heart', 14)} <span>${formatCount(c.likes)}</span></button>
          <button data-reply-toggle="${c.id}">${icon('messageCircle', 14)} Reply</button>
          <button data-delete="${c.id}">${icon('trash', 14)} Delete</button>
        </div>
        <div class="reply-form" id="reply-${c.id}">
          <textarea id="reply-input-${c.id}" placeholder="Write a reply..." style="width:100%;min-height:60px;border:1px solid var(--line);border-radius:8px;padding:10px;font-family:inherit;"></textarea>
          <div class="comment-form-actions"><button class="btn btn-outline btn-sm" data-reply-submit="${c.id}">Reply</button></div>
        </div>
        ${c.replies.length ? `<div class="comment-replies">${c.replies.map((r) => commentHtml(r)).join('')}</div>` : ''}
      </div>
    </div>`;
}

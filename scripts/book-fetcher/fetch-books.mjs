#!/usr/bin/env node
// ============================================================
//  Xzily Blog — Daily Book Fetcher
//
//  Fetches popular free books from:
//    • Internet Archive (archive.org)
//    • Project Gutenberg (via Gutendex API)
//  and saves new ones to Supabase as published — no approval.
//
//  Env vars required (GitHub Actions secrets):
//    SUPABASE_URL
//    SUPABASE_SERVICE_ROLE_KEY
//
//  Run manually:  node scripts/book-fetcher/fetch-books.mjs
// ============================================================

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// ── Config ────────────────────────────────────────────────
const ARCHIVE_PER_SUBJECT   = 18;   // candidates fetched per Archive.org category
const GUTENBERG_PER_RUN     = 60;   // extra candidates fetched from Gutenberg
const TARGET_NEW_BOOKS_PER_RUN = 200;
const ARCHIVE_PAGE_ROTATION  = 25;  // rotate through Archive.org result pages each day

// ── Supabase REST helpers (no library needed) ─────────────
const SB_HEADERS = {
  apikey:        SERVICE_KEY,
  Authorization: `Bearer ${SERVICE_KEY}`,
  'Content-Type': 'application/json',
  Prefer:        'return=minimal',
};

async function dbSelect(table, params = '') {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${params}`, {
    headers: { ...SB_HEADERS, Prefer: 'return=representation' },
  });
  if (!res.ok) throw new Error(`DB select error: ${res.status} ${await res.text()}`);
  return res.json();
}

async function dbInsert(table, record) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: 'POST',
    headers: SB_HEADERS,
    body: JSON.stringify(record),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`DB insert error: ${res.status} ${body}`);
  }
}

// ── Category guesser ──────────────────────────────────────
function guessCategory(text = '') {
  const s = (Array.isArray(text) ? text.join(' ') : String(text)).toLowerCase();
  if (/sport|athletic|football|soccer|basketball|baseball|tennis|olympic|coaching/.test(s)) return 'sports';
  if (/emotional|mental health|psycholog|well-being|wellbeing|anxiety|depression|resilien/.test(s)) return 'emotional-wellbeing';
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

// ── Duplicate check ───────────────────────────────────────
async function alreadyExists(externalUrl) {
  try {
    const rows = await dbSelect('books', `select=id&external_url=eq.${encodeURIComponent(externalUrl)}&limit=1`);
    return rows.length > 0;
  } catch {
    return false; // on error assume not exists (safe to try insert)
  }
}

// ── Save one book ─────────────────────────────────────────
async function saveBook(book, defaultUploaderId = null) {
  if (!book.title || !book.externalUrl) return false;
  if (await alreadyExists(book.externalUrl)) return false;

  try {
    await dbInsert('books', {
      title:          book.title,
      author_name:    book.authorName  || 'Unknown Author',
      description:    book.description || '',
      cover_url:      book.coverUrl    || '',
      file_url:       book.htmlUrl     || '',   // Gutenberg HTML embed URL
      external_url:   book.externalUrl,
      is_external:    true,
      category:       book.category    || 'fiction',
      tags:           [],
      uploader_id:    defaultUploaderId,
      status:         'published',
      language:       book.language    || 'English',
      published_year: book.publishedYear || null,
    });
    return true;
  } catch (e) {
    console.error(`  ⚠️  Save failed: "${book.title}" — ${e.message}`);
    return false;
  }
}

// ── Internet Archive ──────────────────────────────────────
// We search by subject so each run gets fresh, varied books
const ARCHIVE_SUBJECTS = [
  { category: 'fiction', query: 'subject:(fiction OR literature OR novels)' },
  { category: 'religion', query: 'subject:(religion OR spirituality OR theology)' },
  { category: 'science', query: 'subject:(science OR technology OR mathematics)' },
  { category: 'history', query: 'subject:(history OR biography OR civilization)' },
  { category: 'business', query: 'subject:(business OR finance OR economics)' },
  { category: 'self-help', query: 'subject:(self-help OR motivation OR productivity)' },
  { category: 'health', query: 'subject:(health OR medicine OR wellness OR fitness)' },
  { category: 'education', query: 'subject:(education OR teaching OR learning OR school)' },
  { category: 'travel', query: 'subject:(travel OR geography OR exploration)' },
  { category: 'arts', query: 'subject:(art OR music OR film OR photography)' },
  { category: 'children', query: 'subject:(children OR juvenile OR young adult)' },
  { category: 'law', query: 'subject:(law OR legal OR politics OR government)' },
  { category: 'philosophy', query: 'subject:(philosophy OR ethics OR logic)' },
  { category: 'comics', query: 'subject:(comics OR manga OR cartoons)' },
  { category: 'sports', query: 'subject:(sports OR athletics OR football OR soccer OR olympics)' },
  { category: 'emotional-wellbeing', query: 'subject:(psychology OR emotional wellbeing OR mental health OR resilience)' },
];

async function fetchArchiveBooks() {
  const books = [];
  const dailyPage = (Math.floor(Date.now() / 86400000) % ARCHIVE_PAGE_ROTATION) + 1;
  for (const subject of ARCHIVE_SUBJECTS) {
    try {
      const params = new URLSearchParams({
        q:        `${subject.query} AND mediatype:texts AND language:English NOT mediatype:collection`,
        'fl[]':   'identifier,title,creator,description,subject,year,language',
        'sort[]': 'downloads desc',
        rows:     String(ARCHIVE_PER_SUBJECT),
        output:   'json',
        page:     String(dailyPage),
      });
      const res  = await fetch(`https://archive.org/advancedsearch.php?${params}`, {
        headers: { 'User-Agent': 'XzilyBlog-BookFetcher/1.0' },
      });
      if (!res.ok) { console.warn(`  Archive search failed for ${subject.category}: ${res.status}`); continue; }
      const data = await res.json();
      const docs = data?.response?.docs || [];
      for (const d of docs) {
        if (!d.identifier || !d.title) continue;
        const id      = d.identifier;
        const rawSub  = Array.isArray(d.subject) ? d.subject.join(' ') : (d.subject || '');
        const rawDesc = Array.isArray(d.description) ? d.description[0] : (d.description || '');
        books.push({
          title:        (Array.isArray(d.title) ? d.title[0] : d.title).replace(/<[^>]+>/g, '').trim(),
          authorName:   (Array.isArray(d.creator) ? d.creator[0] : (d.creator || 'Unknown Author')).replace(/<[^>]+>/g, '').trim(),
          description:  rawDesc.replace(/<[^>]+>/g, '').slice(0, 800),
          coverUrl:     `https://archive.org/services/img/${id}`,
          externalUrl:  `https://archive.org/details/${id}`,
          // The query is category-specific. Use it as the source of truth so
          // broad Archive metadata cannot collapse every book into fiction.
          category:     subject.category,
          language:     Array.isArray(d.language) ? d.language[0] : (d.language || 'English'),
          publishedYear:parseInt(d.year || '') || null,
        });
      }
      // Polite delay between requests
      await new Promise(r => setTimeout(r, 400));
    } catch (e) {
      console.warn(`  Archive subject error (${subject.category}): ${e.message}`);
    }
  }
  return books;
}

// ── Project Gutenberg (Gutendex) ──────────────────────────
async function fetchGutenbergBooks() {
  const books = [];
  try {
    // Rotate pages so the daily job does not repeatedly fetch only the same
    // most-popular results.
    const dailyPage = (Math.floor(Date.now() / 86400000) % 20) + 1;
    const res  = await fetch(`https://gutendex.com/books/?languages=en&page=${dailyPage}`, {
      headers: { 'User-Agent': 'XzilyBlog-BookFetcher/1.0' },
    });
    if (!res.ok) throw new Error(`Gutendex responded ${res.status}`);
    const data  = await res.json();
    const items = (data.results || []).slice(0, GUTENBERG_PER_RUN);

    for (const b of items) {
      const subjects   = b.subjects || [];
      // Find a readable HTML version (not zipped)
      const htmlEntry  = Object.entries(b.formats || {})
        .find(([k]) => k.startsWith('text/html') && !k.includes('zip'));
      books.push({
        title:        (b.title || '').trim() || 'Unknown Title',
        authorName:   (b.authors?.[0]?.name || 'Unknown Author').replace(/,\s*\d+.*$/, '').trim(),
        description:  subjects.slice(0, 5).join(', '),
        coverUrl:     b.formats?.['image/jpeg'] || '',
        externalUrl:  `https://www.gutenberg.org/ebooks/${b.id}`,
        htmlUrl:      htmlEntry?.[1] || null,   // stored in file_url for the inline reader
        category:     guessCategory(subjects.join(' ')),
        language:     'English',
        publishedYear:null,
      });
    }
  } catch (e) {
    console.warn(`  Gutenberg fetch error: ${e.message}`);
  }
  return books;
}

// ── Check admin toggle ────────────────────────────────────
async function isExternalLibraryEnabled() {
  try {
    const rows = await dbSelect('site_settings', 'select=external_library_enabled&id=eq.true&limit=1');
    if (!rows.length) return true;
    return rows[0].external_library_enabled !== false;
  } catch {
    return true; // default ON if setting unreadable
  }
}

// ── Main ──────────────────────────────────────────────────
async function main() {
  console.log(`[${new Date().toISOString()}] 📚 Xzily Daily Book Fetcher starting…`);

  // Look up the xzily admin profile — used as uploader for all external books
  let adminUploaderId = null;
  try {
    const admins = await dbSelect('profiles', 'select=id&display_name=ilike.xzily&limit=1');
    if (admins.length) adminUploaderId = admins[0].id;
    if (adminUploaderId) console.log(`👤 Using admin uploader: ${adminUploaderId}`);
    else console.warn('⚠️  Could not find xzily admin profile — books will have no uploader');
  } catch(e) {
    console.warn('Could not look up admin profile:', e.message);
  }

  const enabled = await isExternalLibraryEnabled();
  if (!enabled) {
    console.log('ℹ️  External library books are disabled in Admin → Settings. Skipping run.');
    return;
  }

  const [archiveBooks, gutenbergBooks] = await Promise.all([
    fetchArchiveBooks(),
    fetchGutenbergBooks(),
  ]);

  // De-duplicate and interleave categories so the 200-book target is not
  // consumed by the first few subjects in the list.
  const uniqueBooks = [...new Map(
    [...archiveBooks, ...gutenbergBooks].map(book => [book.externalUrl, book])
  ).values()];
  const byCategory = new Map();
  for (const book of uniqueBooks) {
    if (!byCategory.has(book.category)) byCategory.set(book.category, []);
    byCategory.get(book.category).push(book);
  }
  const allBooks = [];
  let round = 0;
  while (allBooks.length < uniqueBooks.length) {
    let addedThisRound = 0;
    for (const books of byCategory.values()) {
      if (books[round]) {
        allBooks.push(books[round]);
        addedThisRound++;
      }
    }
    if (!addedThisRound) break;
    round++;
  }
  console.log(`Found ${archiveBooks.length} Archive.org + ${gutenbergBooks.length} Gutenberg candidates (${uniqueBooks.length} unique)`);

  let added   = 0;
  let skipped = 0;
  for (const book of allBooks) {
    if (added >= TARGET_NEW_BOOKS_PER_RUN) break;
    const saved = await saveBook(book, adminUploaderId);
    if (saved) { added++; console.log(`  ✅ Added: ${book.title}`); }
    else         { skipped++; }
    await new Promise(r => setTimeout(r, 120)); // gentle rate-limit
  }

  console.log(`\n✨ Done — Added: ${added}  |  Already in library or skipped: ${skipped}`);
  if (added < TARGET_NEW_BOOKS_PER_RUN) {
    console.warn(`⚠️  Only ${added} new books were available. The next daily run will rotate to another source page.`);
  }
}

main().catch(e => {
  console.error('Fatal error:', e);
  process.exit(1);
});

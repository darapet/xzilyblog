#!/usr/bin/env node
// ============================================================
// Xzily Blog — Daily News Aggregator
// Fetches RSS from BBC, Al Jazeera, CNN, Guardian, Reuters
// Filters to articles published within the last 48 hours.
// Fetches full article body from source page.
// Upserts into Supabase posts table (stable URL-based slug).
// Deletes auto-imported posts older than 7 days.
// ============================================================

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

// Only import articles published within this many hours
const MAX_AGE_HOURS = 48;

// ── Category mapping ─────────────────────────────────────────
const CATEGORY_MAP = {
  technology: "c1",
  business:   "c2",
  health:     "c4",
  culture:    "c5",
  education:  "c7",
  world:      "c2",
  sports:     "c5",
  africa:     "c2",
};

// ── RSS feeds ────────────────────────────────────────────────
const FEEDS = [
  // BBC
  { url: "https://feeds.bbci.co.uk/news/world/rss.xml",                    source: "BBC News",    topic: "world"      },
  { url: "https://feeds.bbci.co.uk/news/technology/rss.xml",               source: "BBC News",    topic: "technology" },
  { url: "https://feeds.bbci.co.uk/news/health/rss.xml",                   source: "BBC News",    topic: "health"     },
  { url: "https://feeds.bbci.co.uk/news/business/rss.xml",                 source: "BBC News",    topic: "business"   },
  { url: "https://feeds.bbci.co.uk/news/science_and_environment/rss.xml",  source: "BBC News",    topic: "technology" },
  { url: "https://feeds.bbci.co.uk/sport/rss.xml",                         source: "BBC Sport",   topic: "sports"     },
  { url: "https://feeds.bbci.co.uk/news/africa/rss.xml",                   source: "BBC Africa",  topic: "africa"     },

  // Al Jazeera
  { url: "https://www.aljazeera.com/xml/rss/all.xml",                      source: "Al Jazeera",  topic: "world"      },

  // The Guardian
  { url: "https://www.theguardian.com/world/rss",                          source: "The Guardian", topic: "world"     },
  { url: "https://www.theguardian.com/technology/rss",                     source: "The Guardian", topic: "technology"},
  { url: "https://www.theguardian.com/sport/rss",                          source: "The Guardian", topic: "sports"    },
  { url: "https://www.theguardian.com/society/rss",                        source: "The Guardian", topic: "health"    },
  { url: "https://www.theguardian.com/education/rss",                      source: "The Guardian", topic: "education" },
  { url: "https://www.theguardian.com/world/africa/rss",                   source: "The Guardian", topic: "africa"    },

  // Reuters
  { url: "https://feeds.reuters.com/reuters/topNews",                      source: "Reuters",     topic: "world"      },
  { url: "https://feeds.reuters.com/reuters/businessNews",                 source: "Reuters",     topic: "business"   },
  { url: "https://feeds.reuters.com/reuters/technologyNews",               source: "Reuters",     topic: "technology" },
  { url: "https://feeds.reuters.com/reuters/healthNews",                   source: "Reuters",     topic: "health"     },

  // CNN (RSS)
  { url: "http://rss.cnn.com/rss/edition.rss",                            source: "CNN",         topic: "world"      },
  { url: "http://rss.cnn.com/rss/edition_technology.rss",                 source: "CNN",         topic: "technology" },
  { url: "http://rss.cnn.com/rss/edition_sport.rss",                      source: "CNN Sport",   topic: "sports"     },
  { url: "http://rss.cnn.com/rss/edition_health.rss",                     source: "CNN",         topic: "health"     },
  { url: "http://rss.cnn.com/rss/edition_business.rss",                   source: "CNN Business",topic: "business"   },
  { url: "http://rss.cnn.com/rss/edition_africa.rss",                     source: "CNN Africa",  topic: "africa"     },
];

// ── Helpers ──────────────────────────────────────────────────

function extractTag(xml, tag) {
  const patterns = [
    new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>`, "i"),
    new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"),
  ];
  for (const p of patterns) {
    const m = xml.match(p);
    if (m) return m[1].trim();
  }
  return "";
}

function parseItems(xml) {
  const items = [];
  const itemRegex = /<item[^>]*>([\s\S]*?)<\/item>/gi;
  let m;
  while ((m = itemRegex.exec(xml)) !== null) {
    const block = m[1];
    const title   = extractTag(block, "title");
    const link    = extractTag(block, "link") || extractTag(block, "guid");
    const desc    = extractTag(block, "description");
    const pubDate = extractTag(block, "pubDate") || extractTag(block, "dc:date") || extractTag(block, "published");
    const image   = (block.match(/url="([^"]+\.(jpg|jpeg|png|webp))"/i) || [])[1] || "";

    if (title && link) {
      items.push({ title, link, desc, pubDate, image });
    }
  }
  return items;
}

/**
 * Returns true if the article is fresh enough to import.
 * Accepts articles up to MAX_AGE_HOURS old.
 */
function isFresh(pubDateStr) {
  if (!pubDateStr) return true; // no date → assume fresh, let it through
  const pub = new Date(pubDateStr);
  if (isNaN(pub.getTime())) return true; // unparseable → let through
  const ageMs = Date.now() - pub.getTime();
  const ageHours = ageMs / (1000 * 60 * 60);
  return ageHours <= MAX_AGE_HOURS;
}

/**
 * Generate a stable, URL-safe slug from the article URL.
 * Using the URL (not title+timestamp) means the same article
 * always gets the same slug, so Supabase's duplicate-ignore
 * actually works and we never import the same article twice.
 */
function slugFromUrl(articleUrl) {
  // Take the path segments of the URL, clean them up
  let path = "";
  try {
    path = new URL(articleUrl).pathname;
  } catch {
    path = articleUrl;
  }
  const clean = path
    .toLowerCase()
    .replace(/[^a-z0-9\/\-]/g, "")
    .replace(/\//g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 90);
  return `news-${clean}`;
}

/** Strip ALL HTML tags and decode common entities */
function stripHtml(html) {
  return (html || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&nbsp;/gi, " ")
    .replace(/&[a-z]+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Estimate reading time (words / 200 wpm, min 1) */
function readingTime(text) {
  return Math.max(1, Math.round((text || "").split(/\s+/).length / 200));
}

/**
 * Fetch the actual article page and extract paragraphs from the body.
 * Returns an array of paragraph strings, or [] on failure.
 */
async function fetchArticleBody(url, source) {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; XzilyBlog-NewsBot/2.0)",
        "Accept": "text/html,application/xhtml+xml",
      },
      signal: AbortSignal.timeout(12000),
      redirect: "follow",
    });
    if (!res.ok) return [];

    const html = await res.text();

    // Extract paragraphs from common article containers
    // Try multiple selector patterns (regex-based since we have no DOM)
    const paragraphs = [];

    // Pattern: <p> tags inside common article body containers
    // We look for <p> tags that have meaningful content (>40 chars)
    const pRegex = /<p[^>]*>([\s\S]*?)<\/p>/gi;
    let m;
    while ((m = pRegex.exec(html)) !== null) {
      const text = stripHtml(m[1]).trim();
      // Skip short/nav/footer paragraphs
      if (text.length > 40 && !/cookie|subscribe|newsletter|sign.?up|follow us|copyright|terms|privacy/i.test(text)) {
        paragraphs.push(text);
      }
    }

    return paragraphs.slice(0, 20); // max 20 paragraphs
  } catch (err) {
    console.warn(`   ⚠️  Could not fetch article body (${url.slice(0, 60)}...): ${err.message}`);
    return [];
  }
}

/**
 * Build rich HTML content for the post.
 * Uses scraped paragraphs when available, falls back to RSS description.
 */
function buildContent(paragraphs, rssSummary, articleUrl, source) {
  const sourceLink = `<a href="${articleUrl}" target="_blank" rel="noopener noreferrer">${source}</a>`;

  if (paragraphs.length > 0) {
    const bodyHtml = paragraphs
      .map(p => `<p>${p}</p>`)
      .join("\n");
    return `<p><strong>Source: ${sourceLink}</strong></p>\n${bodyHtml}\n<p><a href="${articleUrl}" target="_blank" rel="noopener noreferrer">👉 Read the original article on ${source}</a></p>`;
  }

  // Fallback: use RSS description, but un-truncated and cleaned up
  const fallback = stripHtml(rssSummary || "");
  return `<p><strong>Source: ${sourceLink}</strong></p>\n<p>${fallback}</p>\n<p><a href="${articleUrl}" target="_blank" rel="noopener noreferrer">👉 Read the full article on ${source}</a></p>`;
}

/** Supabase REST helper */
async function supabaseRequest(method, path, body) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method,
    headers: {
      "apikey": SUPABASE_KEY,
      "Authorization": `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
      "Prefer": method === "POST" ? "return=minimal,resolution=ignore-duplicates" : "return=minimal",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Supabase ${method} ${path} → ${res.status}: ${text}`);
  }
  return res.status === 204 ? null : res.json().catch(() => null);
}

// ── Main ──────────────────────────────────────────────────────
async function main() {
  const now = new Date();
  console.log(`\n🗞️  Xzily News Aggregator — ${now.toISOString()}`);
  console.log(`📅 Only importing articles from the last ${MAX_AGE_HOURS} hours (since ${new Date(Date.now() - MAX_AGE_HOURS * 3600000).toUTCString()})\n`);

  let totalInserted = 0;
  let totalSkipped  = 0;
  let totalTooOld   = 0;

  for (const feed of FEEDS) {
    try {
      console.log(`📡 Fetching: ${feed.source} [${feed.topic}] ...`);
      const res = await fetch(feed.url, {
        headers: { "User-Agent": "XzilyBlog-NewsBot/2.0" },
        signal: AbortSignal.timeout(15000),
      });

      if (!res.ok) {
        console.warn(`   ⚠️  HTTP ${res.status} — skipping`);
        continue;
      }

      const xml   = await res.text();
      const items = parseItems(xml);
      console.log(`   📰 Found ${items.length} articles in feed`);

      // Filter to only fresh articles
      const freshItems = items.filter(item => {
        if (!isFresh(item.pubDate)) {
          totalTooOld++;
          return false;
        }
        return true;
      });

      console.log(`   ✅ ${freshItems.length} fresh (≤${MAX_AGE_HOURS}h), ${items.length - freshItems.length} too old — skipping old ones`);

      const categoryId = CATEGORY_MAP[feed.topic] || "c2";

      for (const item of freshItems.slice(0, 10)) {
        // Fetch full article body
        const paragraphs = await fetchArticleBody(item.link, feed.source);

        const rssSummary = stripHtml(item.desc);
        const excerpt = (paragraphs.length > 0
          ? paragraphs.slice(0, 3).join(" ") // first 3 paragraphs as excerpt
          : rssSummary
        ).slice(0, 600);

        const content = buildContent(paragraphs, rssSummary, item.link, feed.source);

        // Parse publish date — use it as created_at so posts sort correctly by date
        const publishedAt = item.pubDate ? new Date(item.pubDate).toISOString() : now.toISOString();

        const post = {
          slug:         slugFromUrl(item.link),
          title:        item.title.slice(0, 200),
          excerpt:      excerpt,
          content,
          cover_image:  item.image || "images/cover-1.jpg",
          author_id:    "news-bot",
          category_id:  categoryId,
          tags:         ["auto-import", feed.topic, feed.source.toLowerCase().replace(/\s+/g, "-")],
          status:       "published",
          reading_time: readingTime(content),
          views:        0,
          likes:        0,
          featured:     false,
          popular:      false,
          published_at: publishedAt,
        };

        try {
          await supabaseRequest("POST", "posts", post);
          totalInserted++;
          console.log(`   ✔  [${new Date(publishedAt).toLocaleString()}] ${item.title.slice(0, 70)}...`);
        } catch (err) {
          if (err.message.includes("duplicate") || err.message.includes("23505")) {
            totalSkipped++;
          } else {
            console.warn(`   ⚠️  Insert failed: ${err.message.slice(0, 120)}`);
          }
        }
      }
    } catch (err) {
      console.warn(`   ❌ Feed error (${feed.url}): ${err.message}`);
    }
  }

  // ── Delete posts older than 7 days that were auto-imported ──
  console.log("\n🧹 Cleaning up auto-imported posts older than 7 days...");
  const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  try {
    await supabaseRequest(
      "DELETE",
      `posts?author_id=eq.news-bot&created_at=lt.${cutoff}`,
    );
    console.log(`   ✅ Old news posts removed`);
  } catch (err) {
    console.warn(`   ⚠️  Cleanup error: ${err.message}`);
  }

  console.log(`\n✅ Done!`);
  console.log(`   Inserted:    ${totalInserted}`);
  console.log(`   Already had: ${totalSkipped}`);
  console.log(`   Too old:     ${totalTooOld}\n`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});

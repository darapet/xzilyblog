#!/usr/bin/env node
// ============================================================
// Xzily Blog — Daily News Aggregator
// Fetches RSS from BBC, Al Jazeera, CNN, Guardian, Reuters
// and upserts headlines into Supabase posts table.
// Deletes auto-imported posts older than 7 days.
// ============================================================

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

// ── Category mapping ─────────────────────────────────────────
// Maps topic slugs to your existing Supabase category IDs
const CATEGORY_MAP = {
  technology: "c1",
  business:   "c2",
  health:     "c4",
  culture:    "c5",
  education:  "c7",
  world:      "c2",  // closest general category
  sports:     "c5",
  africa:     "c2",
};

// ── RSS feeds ────────────────────────────────────────────────
const FEEDS = [
  // BBC
  { url: "https://feeds.bbci.co.uk/news/world/rss.xml",          source: "BBC News",    topic: "world"      },
  { url: "https://feeds.bbci.co.uk/news/technology/rss.xml",     source: "BBC News",    topic: "technology" },
  { url: "https://feeds.bbci.co.uk/news/health/rss.xml",         source: "BBC News",    topic: "health"     },
  { url: "https://feeds.bbci.co.uk/news/business/rss.xml",       source: "BBC News",    topic: "business"   },
  { url: "https://feeds.bbci.co.uk/news/science_and_environment/rss.xml", source: "BBC News", topic: "technology" },
  { url: "https://feeds.bbci.co.uk/sport/rss.xml",               source: "BBC Sport",   topic: "sports"     },
  { url: "https://feeds.bbci.co.uk/news/africa/rss.xml",         source: "BBC Africa",  topic: "africa"     },

  // Al Jazeera
  { url: "https://www.aljazeera.com/xml/rss/all.xml",            source: "Al Jazeera",  topic: "world"      },

  // The Guardian
  { url: "https://www.theguardian.com/world/rss",                source: "The Guardian", topic: "world"     },
  { url: "https://www.theguardian.com/technology/rss",           source: "The Guardian", topic: "technology"},
  { url: "https://www.theguardian.com/sport/rss",                source: "The Guardian", topic: "sports"    },
  { url: "https://www.theguardian.com/society/rss",              source: "The Guardian", topic: "health"    },
  { url: "https://www.theguardian.com/education/rss",            source: "The Guardian", topic: "education" },
  { url: "https://www.theguardian.com/world/africa/rss",         source: "The Guardian", topic: "africa"    },

  // Reuters
  { url: "https://feeds.reuters.com/reuters/topNews",            source: "Reuters",     topic: "world"      },
  { url: "https://feeds.reuters.com/reuters/businessNews",       source: "Reuters",     topic: "business"   },
  { url: "https://feeds.reuters.com/reuters/technologyNews",     source: "Reuters",     topic: "technology" },
  { url: "https://feeds.reuters.com/reuters/healthNews",         source: "Reuters",     topic: "health"     },

  // CNN (RSS)
  { url: "http://rss.cnn.com/rss/edition.rss",                  source: "CNN",         topic: "world"      },
  { url: "http://rss.cnn.com/rss/edition_technology.rss",       source: "CNN",         topic: "technology" },
  { url: "http://rss.cnn.com/rss/edition_sport.rss",            source: "CNN Sport",   topic: "sports"     },
  { url: "http://rss.cnn.com/rss/edition_health.rss",           source: "CNN",         topic: "health"     },
  { url: "http://rss.cnn.com/rss/edition_business.rss",         source: "CNN Business",topic: "business"   },
  { url: "http://rss.cnn.com/rss/edition_africa.rss",           source: "CNN Africa",  topic: "africa"     },
];

// ── Helpers ──────────────────────────────────────────────────

/** Very small RSS/XML text extractor — no dependencies needed */
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

/** Turn a headline into a URL-safe slug */
function toSlug(text, source) {
  const base = text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 80);
  return `news-${base}-${Date.now()}`;
}

/** Strip HTML tags from description */
function stripHtml(html) {
  return (html || "").replace(/<[^>]+>/g, "").replace(/&[a-z]+;/gi, " ").trim().slice(0, 300);
}

/** Estimate reading time (words / 200 wpm, min 1) */
function readingTime(text) {
  return Math.max(1, Math.round((text || "").split(/\s+/).length / 200));
}

/** Supabase REST helper */
async function supabase(method, path, body) {
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
  console.log(`\n🗞️  Xzily News Aggregator — ${new Date().toISOString()}\n`);

  let totalInserted = 0;
  let totalSkipped  = 0;

  for (const feed of FEEDS) {
    try {
      console.log(`📡 Fetching: ${feed.source} [${feed.topic}] ...`);
      const res = await fetch(feed.url, {
        headers: { "User-Agent": "XzilyBlog-NewsBot/1.0" },
        signal: AbortSignal.timeout(15000),
      });

      if (!res.ok) {
        console.warn(`   ⚠️  HTTP ${res.status} — skipping`);
        continue;
      }

      const xml   = await res.text();
      const items = parseItems(xml);
      console.log(`   📰 Found ${items.length} articles`);

      const categoryId = CATEGORY_MAP[feed.topic] || "c2";

      for (const item of items.slice(0, 10)) { // max 10 per feed
        const excerpt = stripHtml(item.desc) || item.title;
        const content = `
<p><strong>Source: <a href="${item.link}" target="_blank" rel="noopener noreferrer">${feed.source}</a></strong></p>
<p>${excerpt}</p>
<p><a href="${item.link}" target="_blank" rel="noopener noreferrer">👉 Read the full article on ${feed.source}</a></p>
        `.trim();

        const post = {
          slug:         toSlug(item.title, feed.source),
          title:        item.title.slice(0, 200),
          excerpt:      excerpt.slice(0, 300),
          content,
          cover_image:  item.image || "images/cover-1.jpg",
          author_id:    "news-bot",
          category_id:  categoryId,
          tags:         ["auto-import", feed.topic, feed.source],
          status:       "published",
          reading_time: readingTime(excerpt),
          views:        0,
          likes:        0,
          featured:     false,
          popular:      false,
        };

        try {
          await supabase("POST", "posts", post);
          totalInserted++;
        } catch (err) {
          // Duplicate slug = already imported → skip silently
          if (err.message.includes("duplicate") || err.message.includes("23505")) {
            totalSkipped++;
          } else {
            console.warn(`   ⚠️  Insert failed: ${err.message.slice(0, 100)}`);
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
    await supabase(
      "DELETE",
      `posts?author_id=eq.news-bot&created_at=lt.${cutoff}`,
    );
    console.log(`   ✅ Old news posts removed`);
  } catch (err) {
    console.warn(`   ⚠️  Cleanup error: ${err.message}`);
  }

  console.log(`\n✅ Done! Inserted: ${totalInserted} | Already existed: ${totalSkipped}\n`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});

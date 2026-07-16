#!/usr/bin/env node
// ============================================================
// Xzily Blog — Daily News Aggregator  v3
// Targets 50+ fresh articles per day from RSS.
// Auto-deletes news-bot posts older than 3 days.
// User-written posts are NEVER touched by this script.
// ============================================================

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

// Only import articles published within this many hours
const MAX_AGE_HOURS = 48;

// Max articles taken per feed per run (higher = more volume)
const MAX_PER_FEED = 15;

// Auto-delete news-bot posts older than this many days
// User-written posts are NEVER deleted by this script.
const NEWS_RETENTION_DAYS = 3;

// ── Category IDs (must match your Supabase categories table) ─
// c1=Technology  c2=Business  c3=Lifestyle  c4=Health
// c5=Culture     c6=Travel    c7=Education  c8=Sports
// Religion has no dedicated category → mapped to c5 (Culture)
const CATEGORY_MAP = {
  technology: "c1",
  business:   "c2",
  lifestyle:  "c3",
  health:     "c4",
  culture:    "c5",
  religion:   "c5",   // closest match — Culture
  travel:     "c6",
  education:  "c7",
  sports:     "c8",
  world:      "c2",
  africa:     "c2",
};

// ── RSS feeds ─────────────────────────────────────────────────
// Priority topics (education, technology, sports, world) get
// more feeds so they always hit the 50/day target even after
// the 48-hour freshness filter.
const FEEDS = [

  // ── WORLD NEWS ────────────────────────────────────────────
  { url: "https://feeds.bbci.co.uk/news/world/rss.xml",                    source: "BBC News",     topic: "world"      },
  { url: "https://www.aljazeera.com/xml/rss/all.xml",                      source: "Al Jazeera",   topic: "world"      },
  { url: "https://www.theguardian.com/world/rss",                          source: "The Guardian", topic: "world"      },
  { url: "https://feeds.reuters.com/reuters/topNews",                      source: "Reuters",      topic: "world"      },
  { url: "http://rss.cnn.com/rss/edition.rss",                            source: "CNN",          topic: "world"      },
  { url: "https://www.theguardian.com/world/africa/rss",                   source: "The Guardian", topic: "africa"     },
  { url: "https://feeds.bbci.co.uk/news/africa/rss.xml",                   source: "BBC Africa",   topic: "africa"     },
  { url: "https://rss.dw.com/rss/en-all",                                  source: "DW News",      topic: "world"      },
  { url: "https://feeds.npr.org/1001/rss.xml",                             source: "NPR News",     topic: "world"      },
  { url: "https://rss.nytimes.com/services/xml/rss/nyt/World.xml",         source: "NY Times",     topic: "world"      },

  // ── TECHNOLOGY ────────────────────────────────────────────
  { url: "https://feeds.bbci.co.uk/news/technology/rss.xml",              source: "BBC News",      topic: "technology" },
  { url: "https://www.theguardian.com/technology/rss",                    source: "The Guardian",  topic: "technology" },
  { url: "https://feeds.reuters.com/reuters/technologyNews",              source: "Reuters",       topic: "technology" },
  { url: "http://rss.cnn.com/rss/edition_technology.rss",                source: "CNN Tech",      topic: "technology" },
  { url: "https://feeds.bbci.co.uk/news/science_and_environment/rss.xml", source: "BBC Science",   topic: "technology" },
  { url: "https://www.wired.com/feed/rss",                                source: "Wired",         topic: "technology" },
  { url: "https://techcrunch.com/feed/",                                  source: "TechCrunch",    topic: "technology" },
  { url: "https://www.theverge.com/rss/index.xml",                        source: "The Verge",     topic: "technology" },
  { url: "https://feeds.arstechnica.com/arstechnica/index",               source: "Ars Technica",  topic: "technology" },
  { url: "https://rss.nytimes.com/services/xml/rss/nyt/Technology.xml",   source: "NY Times Tech", topic: "technology" },

  // ── EDUCATION ─────────────────────────────────────────────
  { url: "https://www.theguardian.com/education/rss",                     source: "The Guardian",  topic: "education"  },
  { url: "https://feeds.npr.org/1013/rss.xml",                            source: "NPR Education", topic: "education"  },
  { url: "https://rss.nytimes.com/services/xml/rss/nyt/Education.xml",    source: "NY Times Edu",  topic: "education"  },
  { url: "https://www.chronicle.com/syndication/feeds/rss",               source: "Chronicle HE",  topic: "education"  },
  { url: "https://www.educationweek.org/rss",                             source: "Ed Week",       topic: "education"  },
  { url: "https://hechingerreport.org/feed/",                             source: "Hechinger Rep", topic: "education"  },
  { url: "https://edsurge.com/news.rss",                                  source: "EdSurge",       topic: "education"  },
  { url: "https://www.insidehighered.com/rss.xml",                        source: "Inside HigherEd",topic: "education" },

  // ── SPORTS ────────────────────────────────────────────────
  { url: "https://feeds.bbci.co.uk/sport/rss.xml",                        source: "BBC Sport",     topic: "sports"     },
  { url: "https://www.theguardian.com/sport/rss",                         source: "The Guardian",  topic: "sports"     },
  { url: "http://rss.cnn.com/rss/edition_sport.rss",                     source: "CNN Sport",     topic: "sports"     },
  { url: "https://www.espn.com/espn/rss/news",                            source: "ESPN",          topic: "sports"     },
  { url: "https://www.cbssports.com/rss/headlines/",                      source: "CBS Sports",    topic: "sports"     },
  { url: "https://sports.yahoo.com/rss/",                                 source: "Yahoo Sports",  topic: "sports"     },
  { url: "https://theathletic.com/feed/rss",                              source: "The Athletic",  topic: "sports"     },
  { url: "https://bleacherreport.com/articles/feed",                      source: "Bleacher Report",topic: "sports"    },

  // ── HEALTH ────────────────────────────────────────────────
  { url: "https://feeds.bbci.co.uk/news/health/rss.xml",                  source: "BBC Health",    topic: "health"     },
  { url: "https://www.theguardian.com/society/rss",                       source: "The Guardian",  topic: "health"     },
  { url: "https://feeds.reuters.com/reuters/healthNews",                  source: "Reuters",       topic: "health"     },
  { url: "http://rss.cnn.com/rss/edition_health.rss",                    source: "CNN Health",    topic: "health"     },
  { url: "https://rss.nytimes.com/services/xml/rss/nyt/Health.xml",       source: "NY Times Health",topic: "health"   },
  { url: "https://feeds.webmd.com/rss/rss.aspx?RSSSource=RSS_PUBLIC",     source: "WebMD",         topic: "health"     },

  // ── BUSINESS ──────────────────────────────────────────────
  { url: "https://feeds.bbci.co.uk/news/business/rss.xml",                source: "BBC Business",  topic: "business"   },
  { url: "https://feeds.reuters.com/reuters/businessNews",                source: "Reuters Biz",   topic: "business"   },
  { url: "http://rss.cnn.com/rss/edition_business.rss",                  source: "CNN Business",  topic: "business"   },
  { url: "https://rss.nytimes.com/services/xml/rss/nyt/Business.xml",     source: "NY Times Biz",  topic: "business"   },

  // ── LIFESTYLE ─────────────────────────────────────────────
  { url: "https://www.theguardian.com/lifeandstyle/rss",                  source: "The Guardian",  topic: "lifestyle"  },
  { url: "https://rss.nytimes.com/services/xml/rss/nyt/FashionandStyle.xml", source: "NY Times Style", topic: "lifestyle" },
  { url: "https://feeds.huffpost.com/huffingtonpost/lifestyle",           source: "HuffPost",      topic: "lifestyle"  },
  { url: "https://www.mindbodygreen.com/rss.xml",                         source: "MindBodyGreen", topic: "lifestyle"  },
  { url: "https://www.goodhousekeeping.com/feed/rss/",                    source: "Good Housekeeping", topic: "lifestyle" },

  // ── RELIGION ──────────────────────────────────────────────
  { url: "https://www.vaticannews.va/en.rss.xml",                         source: "Vatican News",  topic: "religion"   },
  { url: "https://religionnews.com/feed/",                                source: "Religion News", topic: "religion"   },
  { url: "https://www.christianitytoday.com/ct/rss/",                     source: "Christianity Today", topic: "religion" },
  { url: "https://www.catholicnewsagency.com/feed",                       source: "Catholic News Agency", topic: "religion" },
  { url: "https://islamweb.net/en/rss/",                                  source: "IslamWeb",      topic: "religion"   },
  { url: "https://www.churchtimes.co.uk/feed/rss",                        source: "Church Times",  topic: "religion"   },

  // ── CULTURE ───────────────────────────────────────────────
  { url: "https://www.theguardian.com/culture/rss",                       source: "The Guardian",  topic: "culture"    },
  { url: "http://rss.cnn.com/rss/edition_entertainment.rss",             source: "CNN Culture",   topic: "culture"    },
  { url: "https://rss.nytimes.com/services/xml/rss/nyt/Arts.xml",         source: "NY Times Arts", topic: "culture"    },
];

// ── Helpers ───────────────────────────────────────────────────

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

/** Returns true if the article was published within MAX_AGE_HOURS */
function isFresh(pubDateStr) {
  if (!pubDateStr) return true; // no date → let through
  const pub = new Date(pubDateStr);
  if (isNaN(pub.getTime())) return true; // unparseable → let through
  const ageHours = (Date.now() - pub.getTime()) / (1000 * 60 * 60);
  return ageHours <= MAX_AGE_HOURS;
}

/**
 * Stable slug built from the article URL.
 * Same article always gets the same slug → real duplicate prevention.
 */
function slugFromUrl(articleUrl) {
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

/** Strip HTML tags and decode common entities */
function stripHtml(html) {
  return (html || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&nbsp;/gi, " ")
    .replace(/&[a-z#0-9]+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Estimate reading time */
function readingTime(text) {
  return Math.max(1, Math.round((text || "").split(/\s+/).length / 200));
}

/**
 * Fetch the full article page and extract body paragraphs.
 * Falls back to [] on any error.
 */
async function fetchArticleBody(url) {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; XzilyBlog-NewsBot/3.0)",
        "Accept": "text/html,application/xhtml+xml",
      },
      signal: AbortSignal.timeout(12000),
      redirect: "follow",
    });
    if (!res.ok) return [];

    const html = await res.text();
    const paragraphs = [];
    const pRegex = /<p[^>]*>([\s\S]*?)<\/p>/gi;
    let m;
    while ((m = pRegex.exec(html)) !== null) {
      const text = stripHtml(m[1]).trim();
      if (
        text.length > 50 &&
        !/cookie|subscribe|newsletter|sign.?up|follow us|copyright|terms of use|privacy policy|all rights reserved/i.test(text)
      ) {
        paragraphs.push(text);
      }
    }
    return paragraphs.slice(0, 25); // up to 25 paragraphs
  } catch {
    return [];
  }
}

/** Build the HTML content stored in Supabase */
function buildContent(paragraphs, rssSummary, articleUrl, source) {
  const link = `<a href="${articleUrl}" target="_blank" rel="noopener noreferrer">${source}</a>`;
  const readMore = `<p><a href="${articleUrl}" target="_blank" rel="noopener noreferrer">👉 Read the original article on ${source}</a></p>`;

  if (paragraphs.length > 0) {
    const body = paragraphs.map(p => `<p>${p}</p>`).join("\n");
    return `<p><strong>Source: ${link}</strong></p>\n${body}\n${readMore}`;
  }

  const fallback = stripHtml(rssSummary || "");
  return `<p><strong>Source: ${link}</strong></p>\n<p>${fallback}</p>\n${readMore}`;
}

/** Supabase REST helper */
async function supabaseRequest(method, path, body) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method,
    headers: {
      "apikey": SUPABASE_KEY,
      "Authorization": `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
      "Prefer": method === "POST"
        ? "return=minimal,resolution=ignore-duplicates"
        : "return=minimal",
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
  const cutoffFresh = new Date(Date.now() - MAX_AGE_HOURS * 3600_000);
  console.log(`\n🗞️  Xzily News Aggregator v3 — ${now.toISOString()}`);
  console.log(`📅 Accepting articles published after ${cutoffFresh.toUTCString()} (last ${MAX_AGE_HOURS}h)`);
  console.log(`🗑️  Auto-deleting news older than ${NEWS_RETENTION_DAYS} days`);
  console.log(`📦 Max ${MAX_PER_FEED} articles per feed | ${FEEDS.length} feeds configured\n`);

  let totalInserted = 0;
  let totalSkipped  = 0;
  let totalTooOld   = 0;
  let totalFailed   = 0;

  // Track per-topic counts so we can report them
  const topicCounts = {};

  for (const feed of FEEDS) {
    try {
      process.stdout.write(`📡 ${feed.source} [${feed.topic}] ... `);
      const res = await fetch(feed.url, {
        headers: { "User-Agent": "XzilyBlog-NewsBot/3.0" },
        signal: AbortSignal.timeout(15000),
      });

      if (!res.ok) {
        console.log(`HTTP ${res.status} — skipped`);
        continue;
      }

      const xml        = await res.text();
      const allItems   = parseItems(xml);
      const freshItems = allItems.filter(item => {
        if (!isFresh(item.pubDate)) { totalTooOld++; return false; }
        return true;
      });

      console.log(`${allItems.length} items, ${freshItems.length} fresh`);

      const categoryId = CATEGORY_MAP[feed.topic] || "c2";

      for (const item of freshItems.slice(0, MAX_PER_FEED)) {
        // Fetch the full article body from the source page
        const paragraphs = await fetchArticleBody(item.link);

        const rssSummary = stripHtml(item.desc);
        const excerpt = (
          paragraphs.length > 0
            ? paragraphs.slice(0, 3).join(" ")
            : rssSummary
        ).slice(0, 600);

        const content      = buildContent(paragraphs, rssSummary, item.link, feed.source);
        const publishedAt  = item.pubDate ? new Date(item.pubDate).toISOString() : now.toISOString();

        const post = {
          slug:         slugFromUrl(item.link),
          title:        item.title.slice(0, 200),
          excerpt,
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
          topicCounts[feed.topic] = (topicCounts[feed.topic] || 0) + 1;
        } catch (err) {
          if (err.message.includes("duplicate") || err.message.includes("23505")) {
            totalSkipped++;
          } else {
            totalFailed++;
            console.warn(`   ⚠️  Insert failed: ${err.message.slice(0, 120)}`);
          }
        }
      }
    } catch (err) {
      console.warn(`   ❌ Feed error: ${err.message}`);
    }
  }

  // ── Delete NEWS-BOT posts older than NEWS_RETENTION_DAYS ───
  // ⚠️  User-written posts are NEVER deleted — the filter
  //     `author_id=eq.news-bot` ensures only auto-imported
  //     articles are affected.
  console.log(`\n🧹 Removing auto-imported posts older than ${NEWS_RETENTION_DAYS} days...`);
  const deleteCutoff = new Date(Date.now() - NEWS_RETENTION_DAYS * 86_400_000).toISOString();
  try {
    await supabaseRequest(
      "DELETE",
      `posts?author_id=eq.news-bot&created_at=lt.${deleteCutoff}`,
    );
    console.log(`   ✅ Old auto-imported posts removed (cutoff: ${deleteCutoff})`);
  } catch (err) {
    console.warn(`   ⚠️  Cleanup error: ${err.message}`);
  }

  // ── Summary ────────────────────────────────────────────────
  console.log(`\n✅ Done!`);
  console.log(`   Inserted new:   ${totalInserted}`);
  console.log(`   Already stored: ${totalSkipped}`);
  console.log(`   Too old (>48h): ${totalTooOld}`);
  console.log(`   Failed:         ${totalFailed}`);
  console.log(`\n   Breakdown by topic:`);
  for (const [topic, count] of Object.entries(topicCounts).sort((a, b) => b[1] - a[1])) {
    console.log(`      ${topic.padEnd(12)} ${count}`);
  }
  console.log();
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});

#!/usr/bin/env node
// ============================================================
// Xzily Blog — Daily News Aggregator  v4
//
// Takes up to 60 fresh articles PER SOURCE SITE per run.
// e.g. BBC → 60, Guardian → 60, CNN → 60, Reuters → 60 …
// Auto-deletes news-bot posts older than 3 days.
// User-written posts are NEVER touched.
// ============================================================

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const MAX_AGE_HOURS      = 48;   // only import articles published within 48 h
const MAX_PER_SOURCE     = 60;   // max articles imported per source site per run
const NEWS_RETENTION_DAYS = 3;   // auto-delete news-bot posts after 3 days

// ── Category IDs ──────────────────────────────────────────────
// c1=Technology  c2=Business  c3=Lifestyle  c4=Health
// c5=Culture     c6=Travel    c7=Education  c8=Sports
// Religion → c5 (Culture, closest existing match)
const CATEGORY_MAP = {
  technology: "c1",
  business:   "c2",
  lifestyle:  "c3",
  health:     "c4",
  culture:    "c5",
  religion:   "c5",
  travel:     "c6",
  education:  "c7",
  sports:     "c8",
  world:      "c2",
  africa:     "c2",
};

// ── Feed list ─────────────────────────────────────────────────
// Each entry has a `source` name and one or more feed `urls`.
// All URLs for the same source are fetched and merged, then
// up to MAX_PER_SOURCE fresh articles are taken from that pool.
const SOURCES = [

  // ── WORLD / GENERAL ───────────────────────────────────────
  {
    source: "BBC News", topic: "world",
    urls: [
      "https://feeds.bbci.co.uk/news/world/rss.xml",
      "https://feeds.bbci.co.uk/news/rss.xml",
      "https://feeds.bbci.co.uk/news/uk/rss.xml",
      "https://feeds.bbci.co.uk/news/politics/rss.xml",
    ],
  },
  {
    source: "Al Jazeera", topic: "world",
    urls: [
      "https://www.aljazeera.com/xml/rss/all.xml",
    ],
  },
  {
    source: "Reuters", topic: "world",
    urls: [
      "https://feeds.reuters.com/reuters/topNews",
      "https://feeds.reuters.com/reuters/worldNews",
      "https://feeds.reuters.com/reuters/businessNews",
      "https://feeds.reuters.com/reuters/technologyNews",
      "https://feeds.reuters.com/reuters/healthNews",
    ],
  },
  {
    source: "CNN", topic: "world",
    urls: [
      "http://rss.cnn.com/rss/edition.rss",
      "http://rss.cnn.com/rss/edition_world.rss",
      "http://rss.cnn.com/rss/edition_us.rss",
      "http://rss.cnn.com/rss/edition_africa.rss",
      "http://rss.cnn.com/rss/edition_europe.rss",
    ],
  },
  {
    source: "DW News", topic: "world",
    urls: [
      "https://rss.dw.com/rss/en-all",
      "https://rss.dw.com/rss/en-africa",
    ],
  },
  {
    source: "NPR", topic: "world",
    urls: [
      "https://feeds.npr.org/1001/rss.xml",
      "https://feeds.npr.org/1004/rss.xml",
      "https://feeds.npr.org/1007/rss.xml",
    ],
  },
  {
    source: "NY Times", topic: "world",
    urls: [
      "https://rss.nytimes.com/services/xml/rss/nyt/World.xml",
      "https://rss.nytimes.com/services/xml/rss/nyt/US.xml",
      "https://rss.nytimes.com/services/xml/rss/nyt/Politics.xml",
      "https://rss.nytimes.com/services/xml/rss/nyt/Africa.xml",
    ],
  },
  {
    source: "BBC Africa", topic: "africa",
    urls: [
      "https://feeds.bbci.co.uk/news/africa/rss.xml",
    ],
  },
  {
    source: "The Guardian World", topic: "world",
    urls: [
      "https://www.theguardian.com/world/rss",
      "https://www.theguardian.com/world/africa/rss",
      "https://www.theguardian.com/uk-news/rss",
      "https://www.theguardian.com/us-news/rss",
    ],
  },

  // ── TECHNOLOGY ────────────────────────────────────────────
  {
    source: "BBC Technology", topic: "technology",
    urls: [
      "https://feeds.bbci.co.uk/news/technology/rss.xml",
      "https://feeds.bbci.co.uk/news/science_and_environment/rss.xml",
    ],
  },
  {
    source: "The Guardian Technology", topic: "technology",
    urls: [
      "https://www.theguardian.com/technology/rss",
      "https://www.theguardian.com/science/rss",
    ],
  },
  {
    source: "Wired", topic: "technology",
    urls: [
      "https://www.wired.com/feed/rss",
      "https://www.wired.com/feed/category/science/latest/rss",
      "https://www.wired.com/feed/category/business/latest/rss",
    ],
  },
  {
    source: "TechCrunch", topic: "technology",
    urls: [
      "https://techcrunch.com/feed/",
      "https://techcrunch.com/category/artificial-intelligence/feed/",
      "https://techcrunch.com/category/startups/feed/",
    ],
  },
  {
    source: "The Verge", topic: "technology",
    urls: [
      "https://www.theverge.com/rss/index.xml",
      "https://www.theverge.com/rss/tech/index.xml",
      "https://www.theverge.com/rss/ai-artificial-intelligence/index.xml",
    ],
  },
  {
    source: "Ars Technica", topic: "technology",
    urls: [
      "https://feeds.arstechnica.com/arstechnica/index",
      "https://feeds.arstechnica.com/arstechnica/technology-lab",
      "https://feeds.arstechnica.com/arstechnica/science",
    ],
  },
  {
    source: "NY Times Technology", topic: "technology",
    urls: [
      "https://rss.nytimes.com/services/xml/rss/nyt/Technology.xml",
      "https://rss.nytimes.com/services/xml/rss/nyt/Science.xml",
    ],
  },

  // ── EDUCATION ─────────────────────────────────────────────
  {
    source: "The Guardian Education", topic: "education",
    urls: [
      "https://www.theguardian.com/education/rss",
      "https://www.theguardian.com/higher-education-network/rss",
    ],
  },
  {
    source: "NPR Education", topic: "education",
    urls: [
      "https://feeds.npr.org/1013/rss.xml",
      "https://feeds.npr.org/1015/rss.xml",
    ],
  },
  {
    source: "NY Times Education", topic: "education",
    urls: [
      "https://rss.nytimes.com/services/xml/rss/nyt/Education.xml",
    ],
  },
  {
    source: "EdSurge", topic: "education",
    urls: [
      "https://edsurge.com/news.rss",
    ],
  },
  {
    source: "Education Week", topic: "education",
    urls: [
      "https://www.educationweek.org/rss",
    ],
  },
  {
    source: "Hechinger Report", topic: "education",
    urls: [
      "https://hechingerreport.org/feed/",
    ],
  },
  {
    source: "Inside Higher Ed", topic: "education",
    urls: [
      "https://www.insidehighered.com/rss.xml",
    ],
  },
  {
    source: "Chronicle of Higher Education", topic: "education",
    urls: [
      "https://www.chronicle.com/syndication/feeds/rss",
    ],
  },

  // ── SPORTS ────────────────────────────────────────────────
  {
    source: "BBC Sport", topic: "sports",
    urls: [
      "https://feeds.bbci.co.uk/sport/rss.xml",
      "https://feeds.bbci.co.uk/sport/football/rss.xml",
      "https://feeds.bbci.co.uk/sport/cricket/rss.xml",
      "https://feeds.bbci.co.uk/sport/athletics/rss.xml",
      "https://feeds.bbci.co.uk/sport/tennis/rss.xml",
    ],
  },
  {
    source: "ESPN", topic: "sports",
    urls: [
      "https://www.espn.com/espn/rss/news",
      "https://www.espn.com/espn/rss/nba/news",
      "https://www.espn.com/espn/rss/nfl/news",
      "https://www.espn.com/espn/rss/soccer/news",
    ],
  },
  {
    source: "The Guardian Sport", topic: "sports",
    urls: [
      "https://www.theguardian.com/sport/rss",
      "https://www.theguardian.com/football/rss",
      "https://www.theguardian.com/sport/cricket/rss",
    ],
  },
  {
    source: "CBS Sports", topic: "sports",
    urls: [
      "https://www.cbssports.com/rss/headlines/",
      "https://www.cbssports.com/rss/headlines/soccer/",
    ],
  },
  {
    source: "CNN Sport", topic: "sports",
    urls: [
      "http://rss.cnn.com/rss/edition_sport.rss",
    ],
  },
  {
    source: "Yahoo Sports", topic: "sports",
    urls: [
      "https://sports.yahoo.com/rss/",
    ],
  },
  {
    source: "Bleacher Report", topic: "sports",
    urls: [
      "https://bleacherreport.com/articles/feed",
    ],
  },

  // ── HEALTH ────────────────────────────────────────────────
  {
    source: "BBC Health", topic: "health",
    urls: [
      "https://feeds.bbci.co.uk/news/health/rss.xml",
    ],
  },
  {
    source: "The Guardian Health", topic: "health",
    urls: [
      "https://www.theguardian.com/society/rss",
      "https://www.theguardian.com/society/health/rss",
    ],
  },
  {
    source: "Reuters Health", topic: "health",
    urls: [
      "https://feeds.reuters.com/reuters/healthNews",
    ],
  },
  {
    source: "CNN Health", topic: "health",
    urls: [
      "http://rss.cnn.com/rss/edition_health.rss",
    ],
  },
  {
    source: "NY Times Health", topic: "health",
    urls: [
      "https://rss.nytimes.com/services/xml/rss/nyt/Health.xml",
      "https://rss.nytimes.com/services/xml/rss/nyt/Well.xml",
    ],
  },
  {
    source: "WebMD", topic: "health",
    urls: [
      "https://feeds.webmd.com/rss/rss.aspx?RSSSource=RSS_PUBLIC",
    ],
  },

  // ── BUSINESS ──────────────────────────────────────────────
  {
    source: "BBC Business", topic: "business",
    urls: [
      "https://feeds.bbci.co.uk/news/business/rss.xml",
    ],
  },
  {
    source: "CNN Business", topic: "business",
    urls: [
      "http://rss.cnn.com/rss/edition_business.rss",
      "http://rss.cnn.com/rss/money_news_international.rss",
    ],
  },
  {
    source: "NY Times Business", topic: "business",
    urls: [
      "https://rss.nytimes.com/services/xml/rss/nyt/Business.xml",
      "https://rss.nytimes.com/services/xml/rss/nyt/Economy.xml",
    ],
  },

  // ── LIFESTYLE ─────────────────────────────────────────────
  {
    source: "The Guardian Lifestyle", topic: "lifestyle",
    urls: [
      "https://www.theguardian.com/lifeandstyle/rss",
      "https://www.theguardian.com/fashion/rss",
      "https://www.theguardian.com/food/rss",
    ],
  },
  {
    source: "NY Times Style", topic: "lifestyle",
    urls: [
      "https://rss.nytimes.com/services/xml/rss/nyt/FashionandStyle.xml",
      "https://rss.nytimes.com/services/xml/rss/nyt/DiningandWine.xml",
    ],
  },
  {
    source: "HuffPost Lifestyle", topic: "lifestyle",
    urls: [
      "https://feeds.huffpost.com/huffingtonpost/lifestyle",
      "https://feeds.huffpost.com/huffingtonpost/wellness",
    ],
  },
  {
    source: "Good Housekeeping", topic: "lifestyle",
    urls: [
      "https://www.goodhousekeeping.com/feed/rss/",
    ],
  },
  {
    source: "MindBodyGreen", topic: "lifestyle",
    urls: [
      "https://www.mindbodygreen.com/rss.xml",
    ],
  },

  // ── RELIGION ──────────────────────────────────────────────
  {
    source: "Vatican News", topic: "religion",
    urls: [
      "https://www.vaticannews.va/en.rss.xml",
    ],
  },
  {
    source: "Religion News Service", topic: "religion",
    urls: [
      "https://religionnews.com/feed/",
    ],
  },
  {
    source: "Christianity Today", topic: "religion",
    urls: [
      "https://www.christianitytoday.com/ct/rss/",
      "https://www.christianitytoday.com/news/rss/",
    ],
  },
  {
    source: "Catholic News Agency", topic: "religion",
    urls: [
      "https://www.catholicnewsagency.com/feed",
    ],
  },
  {
    source: "Church Times", topic: "religion",
    urls: [
      "https://www.churchtimes.co.uk/feed/rss",
    ],
  },

  // ── CULTURE ───────────────────────────────────────────────
  {
    source: "The Guardian Culture", topic: "culture",
    urls: [
      "https://www.theguardian.com/culture/rss",
      "https://www.theguardian.com/film/rss",
      "https://www.theguardian.com/music/rss",
      "https://www.theguardian.com/books/rss",
    ],
  },
  {
    source: "CNN Culture", topic: "culture",
    urls: [
      "http://rss.cnn.com/rss/edition_entertainment.rss",
    ],
  },
  {
    source: "NY Times Arts", topic: "culture",
    urls: [
      "https://rss.nytimes.com/services/xml/rss/nyt/Arts.xml",
      "https://rss.nytimes.com/services/xml/rss/nyt/Movies.xml",
    ],
  },
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
    if (title && link) items.push({ title, link, desc, pubDate, image });
  }
  return items;
}

function isFresh(pubDateStr) {
  if (!pubDateStr) return true;
  const pub = new Date(pubDateStr);
  if (isNaN(pub.getTime())) return true;
  return (Date.now() - pub.getTime()) / 3_600_000 <= MAX_AGE_HOURS;
}

/** Stable slug from article URL — ensures same article is never inserted twice */
function slugFromUrl(url) {
  let path = "";
  try { path = new URL(url).pathname; } catch { path = url; }
  const clean = path
    .toLowerCase()
    .replace(/[^a-z0-9\/\-]/g, "")
    .replace(/\//g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 90);
  return `news-${clean}`;
}

function stripHtml(html) {
  return (html || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/gi, "&").replace(/&lt;/gi, "<").replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"').replace(/&#39;/gi, "'").replace(/&nbsp;/gi, " ")
    .replace(/&[a-z#0-9]+;/gi, " ")
    .replace(/\s+/g, " ").trim();
}

function readingTime(text) {
  return Math.max(1, Math.round((text || "").split(/\s+/).length / 200));
}

async function fetchArticleBody(url) {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; XzilyBlog-NewsBot/4.0)",
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
    return paragraphs.slice(0, 25);
  } catch {
    return [];
  }
}

function buildContent(paragraphs, rssSummary, articleUrl, source) {
  const link     = `<a href="${articleUrl}" target="_blank" rel="noopener noreferrer">${source}</a>`;
  const readMore = `<p><a href="${articleUrl}" target="_blank" rel="noopener noreferrer">👉 Read the original article on ${source}</a></p>`;
  if (paragraphs.length > 0) {
    return `<p><strong>Source: ${link}</strong></p>\n${paragraphs.map(p => `<p>${p}</p>`).join("\n")}\n${readMore}`;
  }
  return `<p><strong>Source: ${link}</strong></p>\n<p>${stripHtml(rssSummary || "")}</p>\n${readMore}`;
}

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
  console.log(`\n🗞️  Xzily News Aggregator v4 — ${now.toISOString()}`);
  console.log(`📅 Fresh = published within last ${MAX_AGE_HOURS}h`);
  console.log(`📦 Up to ${MAX_PER_SOURCE} articles per source site`);
  console.log(`🗑️  Auto-delete news after ${NEWS_RETENTION_DAYS} days\n`);

  let totalInserted = 0, totalSkipped = 0, totalTooOld = 0;
  const sourceSummary = [];

  for (const sourceConfig of SOURCES) {
    const { source, topic, urls } = sourceConfig;
    console.log(`\n📡 ${source} [${topic}] — ${urls.length} feed(s)`);

    // Fetch all feed URLs for this source and merge items
    const allItems = [];
    const seenLinks = new Set();

    for (const feedUrl of urls) {
      try {
        const res = await fetch(feedUrl, {
          headers: { "User-Agent": "XzilyBlog-NewsBot/4.0" },
          signal: AbortSignal.timeout(15000),
        });
        if (!res.ok) { console.log(`   ⚠️  ${feedUrl} → HTTP ${res.status}`); continue; }
        const xml = await res.text();
        const items = parseItems(xml);
        let added = 0;
        for (const item of items) {
          if (!seenLinks.has(item.link)) {
            seenLinks.add(item.link);
            allItems.push(item);
            added++;
          }
        }
        console.log(`   ✔  ${feedUrl.split("/").slice(-2).join("/")} → ${added} items`);
      } catch (err) {
        console.log(`   ❌ ${feedUrl}: ${err.message}`);
      }
    }

    // Filter to fresh articles only
    const freshItems = allItems.filter(item => {
      if (!isFresh(item.pubDate)) { totalTooOld++; return false; }
      return true;
    });

    console.log(`   📰 Total: ${allItems.length} items | Fresh (≤${MAX_AGE_HOURS}h): ${freshItems.length} | Taking up to ${MAX_PER_SOURCE}`);

    const categoryId = CATEGORY_MAP[topic] || "c2";
    let sourceInserted = 0, sourceSkipped = 0;

    for (const item of freshItems.slice(0, MAX_PER_SOURCE)) {
      const paragraphs  = await fetchArticleBody(item.link);
      const rssSummary  = stripHtml(item.desc);
      const excerpt     = (paragraphs.length > 0 ? paragraphs.slice(0, 3).join(" ") : rssSummary).slice(0, 600);
      const content     = buildContent(paragraphs, rssSummary, item.link, source);

      const post = {
        slug:         slugFromUrl(item.link),
        title:        item.title.slice(0, 200),
        excerpt,
        content,
        cover_image:  item.image || "images/cover-1.jpg",
        author_id:    "news-bot",
        category_id:  categoryId,
        tags:         ["auto-import", topic, source.toLowerCase().replace(/\s+/g, "-")],
        status:       "published",
        reading_time: readingTime(content),
        views: 0, likes: 0, featured: false, popular: false,
      };

      try {
        await supabaseRequest("POST", "posts", post);
        sourceInserted++;
        totalInserted++;
      } catch (err) {
        if (err.message.includes("duplicate") || err.message.includes("23505")) {
          sourceSkipped++;
          totalSkipped++;
        } else {
          console.warn(`   ⚠️  Insert failed: ${err.message.slice(0, 100)}`);
        }
      }
    }

    console.log(`   ✅ ${source}: +${sourceInserted} new, ${sourceSkipped} already stored`);
    sourceSummary.push({ source, topic, inserted: sourceInserted, skipped: sourceSkipped, fresh: freshItems.length });
  }

  // ── Delete news-bot posts older than NEWS_RETENTION_DAYS ──
  // ⚠️  Only deletes rows where author_id = 'news-bot'.
  //     User-written posts are NEVER deleted.
  console.log(`\n🧹 Removing auto-imported posts older than ${NEWS_RETENTION_DAYS} days...`);
  const cutoff = new Date(Date.now() - NEWS_RETENTION_DAYS * 86_400_000).toISOString();
  try {
    await supabaseRequest("DELETE", `posts?author_id=eq.news-bot&created_at=lt.${cutoff}`);
    console.log(`   ✅ Done (cutoff: ${cutoff})`);
  } catch (err) {
    console.warn(`   ⚠️  Cleanup error: ${err.message}`);
  }

  // ── Final summary ─────────────────────────────────────────
  console.log(`\n${"─".repeat(60)}`);
  console.log(`✅ Run complete`);
  console.log(`   New articles inserted : ${totalInserted}`);
  console.log(`   Already in database   : ${totalSkipped}`);
  console.log(`   Filtered out (too old): ${totalTooOld}`);
  console.log(`\n   Per-source breakdown:`);
  for (const s of sourceSummary.sort((a, b) => b.inserted - a.inserted)) {
    if (s.inserted > 0 || s.skipped > 0) {
      console.log(`      ${s.source.padEnd(28)} +${String(s.inserted).padStart(3)} new  (${s.skipped} already stored)`);
    }
  }
  console.log(`${"─".repeat(60)}\n`);
}

main().catch(err => { console.error("Fatal:", err); process.exit(1); });

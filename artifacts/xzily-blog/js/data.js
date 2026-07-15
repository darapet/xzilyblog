// Seed content for Xzily. Plain JS module -- no build step required.

export const USERS = [
  { id: 'u1', name: 'Elena Rostova', email: 'elena@xzily.com', avatar: 'images/avatar-1.jpg', bio: 'Editor-in-chief at Xzily. Exploring the intersection of design, technology, and culture.' },
  { id: 'u2', name: 'Marcus Chen', email: 'marcus@xzily.com', avatar: 'images/avatar-2.jpg', bio: 'Senior tech correspondent, writing about the future of software and decentralized systems.' },
  { id: 'u3', name: 'Julian Hayes', email: 'julian@xzily.com', avatar: 'images/avatar-3.jpg', bio: 'Culture critic and essayist, documenting the shifting landscapes of modern life.' },
  { id: 'u4', name: 'Sarah Jenkins', email: 'sarah@xzily.com', avatar: 'images/avatar-4.jpg', bio: 'Health and science writer, distilling complex research into actionable insight.' },
];

export const CATEGORIES = [
  { id: 'c1', slug: 'technology', name: 'Technology', icon: 'sparkle', description: 'The bleeding edge of software, hardware, and AI.' },
  { id: 'c2', slug: 'business', name: 'Business', icon: 'trendingUp', description: 'Startups, economics, and the future of work.' },
  { id: 'c3', slug: 'lifestyle', name: 'Lifestyle', icon: 'user', description: 'Design, architecture, and intentional living.' },
  { id: 'c4', slug: 'health', name: 'Health', icon: 'checkCircle', description: 'Science-backed insight on longevity and wellness.' },
  { id: 'c5', slug: 'culture', name: 'Culture', icon: 'flag', description: 'Arts, society, and the zeitgeist.' },
  { id: 'c6', slug: 'travel', name: 'Travel', icon: 'mapPin', description: 'Dispatches from around the globe.' },
];

export const POSTS = [
  {
    id: 'p1', slug: 'the-new-aesthetics-of-artificial-intelligence',
    title: 'The New Aesthetics of Artificial Intelligence',
    excerpt: 'As models become more capable, the interfaces we use to interact with them must evolve past the generic chat box. We are entering an era of bold, opinionated AI design.',
    content: `<h2>The Era of Chat is Ending</h2><p>For the past two years, the default interface for interacting with large language models has been the chat box. It was a necessary starting point — a universal paradigm that everyone understood. But it is fundamentally limiting.</p><p>We are now seeing the emergence of <strong>generative interfaces</strong>: UIs that build themselves on the fly based on the user's intent. Instead of typing into a box, you manipulate sliders, canvas elements, and visual nodes, while the model hums in the background, continuously updating the state.</p><blockquote>The best AI interface is one where you don't even realize you're talking to a model.</blockquote><h2>High-Contrast Design in a Generative World</h2><p>When the content is dynamic and unpredictable, the container must be rigid, confident, and highly structured. This is why we are seeing a resurgence of high-contrast editorial layouts in AI products. Bold typography and stark colors provide an anchor for the fluid, ever-changing generated content.</p><ul><li>Confident, opinionated typography</li><li>Stark, deliberate color choices</li><li>Structure that survives unpredictable content</li></ul><p>Red and white, in particular, evoke a sense of urgency and precision — two qualities that define the cutting edge of technological progress today.</p>`,
    coverImage: 'images/cover-1.jpg', authorId: 'u1', categoryId: 'c1', tags: ['AI', 'Design', 'UI/UX'],
    status: 'published', createdAt: daysAgo(2), readingTime: 6, views: 12500, likes: 842, featured: true, popular: true,
  },
  {
    id: 'p2', slug: 'bootstrapping-in-the-age-of-abundant-capital',
    title: 'Bootstrapping in the Age of Abundant Capital',
    excerpt: 'Venture capital is no longer the default path for ambitious founders. Here is why profitable, slow-growth businesses are making a massive comeback.',
    content: `<h2>The Myth of Hypergrowth</h2><p>For a decade, the playbook was simple: raise a seed round, hire fast, burn cash to acquire users, and figure out the business model later. That era is over.</p><p>Founders are waking up to the reality that raising capital means selling the most valuable asset they have: optionality.</p><h2>The Rise of the Micro-SaaS</h2><p>Today, small, incredibly focused teams are building businesses that generate real revenue with zero outside funding. They use off-the-shelf tools, lean on automation, and focus maniacally on one problem for one customer.</p><ul><li>Lower overhead</li><li>Higher margins</li><li>Complete autonomy</li></ul><p>The future belongs to the profitable.</p>`,
    coverImage: 'images/cover-2.jpg', authorId: 'u2', categoryId: 'c2', tags: ['Startups', 'Venture Capital', 'Bootstrapping'],
    status: 'published', createdAt: daysAgo(5), readingTime: 5, views: 8200, likes: 512, featured: false, popular: true,
  },
  {
    id: 'p3', slug: 'minimalism-as-a-radical-act',
    title: 'Minimalism as a Radical Act',
    excerpt: 'In an economy built on infinite consumption, choosing to own less is not just a stylistic preference — it is a rebellion.',
    content: `<h2>Beyond White Walls and Empty Desks</h2><p>Minimalism has been commodified, sold to us as an aesthetic. But true minimalism has nothing to do with what things look like. It is about what things <em>are</em>.</p><p>It is the ruthless elimination of the unessential so you can pour all your energy into the few things that actually matter.</p><h2>The Attention Economy</h2><p>Every app, every billboard, every email is competing for a fraction of your attention. By owning less and desiring less, you take back control of your cognitive bandwidth.</p><blockquote>Choose quality over quantity. Choose silence over noise.</blockquote>`,
    coverImage: 'images/cover-3.jpg', authorId: 'u3', categoryId: 'c3', tags: ['Minimalism', 'Culture', 'Focus'],
    status: 'published', createdAt: daysAgo(10), readingTime: 4, views: 4500, likes: 320, featured: false, popular: false,
  },
  {
    id: 'p4', slug: 'the-architecture-of-deep-sleep',
    title: 'The Architecture of Deep Sleep',
    excerpt: 'We spend a third of our lives unconscious, yet we treat sleep as an afterthought. New research reveals the structural phases of restorative rest.',
    content: `<h2>The Stages of Restoration</h2><p>Sleep is a highly active, structurally complex process that repairs cellular damage, consolidates memories, and clears toxins from the brain.</p><p>During deep sleep, brain waves slow dramatically, blood pressure drops, and muscle tissue repairs. This is the foundation of human performance.</p><h2>Optimizing the Environment</h2><ol><li><strong>Temperature:</strong> keep the room between 60–67°F (15–19°C)</li><li><strong>Light:</strong> total blackout — even a sliver disrupts circadian rhythm</li><li><strong>Timing:</strong> consistency matters more than duration</li></ol>`,
    coverImage: 'images/cover-4.jpg', authorId: 'u4', categoryId: 'c4', tags: ['Health', 'Sleep', 'Science'],
    status: 'published', createdAt: daysAgo(12), readingTime: 7, views: 9100, likes: 640, featured: false, popular: true,
  },
  {
    id: 'p5', slug: 'kyoto-in-the-rain',
    title: 'Kyoto in the Rain: A Visual Essay',
    excerpt: 'The ancient capital reveals its true character not under the bright sun, but beneath the heavy, atmospheric downpours of the rainy season.',
    content: `<h2>The Wash of the City</h2><p>When it rains in Kyoto, the neon of modern Japan is muted, and the deep colors of the ancient architecture — the vermilion of the shrine gates, the dark wood of the townhouses — become hypersaturated.</p><p>A specific quiet falls over the narrow streets of Gion when rain starts. Tourists scatter, leaving cobblestones empty and reflective.</p><h2>Finding Stillness</h2><p>Travel is often frantic consumption. Kyoto in the rain forces you to stop, watch water bead off a paper lantern, and simply exist in the space.</p>`,
    coverImage: 'images/cover-5.jpg', authorId: 'u3', categoryId: 'c6', tags: ['Travel', 'Japan', 'Photography'],
    status: 'published', createdAt: daysAgo(15), readingTime: 3, views: 3200, likes: 210, featured: false, popular: false,
  },
  {
    id: 'p6', slug: 'modern-cinema-and-the-death-of-subtlety',
    title: 'Modern Cinema and the Death of Subtlety',
    excerpt: 'Have we lost the art of the slow build? A critique of modern pacing and the relentless demand for immediate stimulation in film.',
    content: `<h2>The Need for Speed</h2><p>In the era of endless scrolling, blockbuster pacing has shifted. Shots are shorter, dialogue punchier, and the space between action sequences has been compressed to nearly zero.</p><p>We are losing the silence that allows tension to build — the quiet character moments that make an explosive climax mean something.</p><h2>Reclaiming the Slow Burn</h2><p>A few filmmakers still demand patience from their audience, understanding that a slow pan across an empty room can be more terrifying than a jump scare.</p>`,
    coverImage: 'images/cover-6.jpg', authorId: 'u1', categoryId: 'c5', tags: ['Film', 'Culture', 'Critique'],
    status: 'published', createdAt: daysAgo(18), readingTime: 6, views: 5400, likes: 430, featured: false, popular: false,
  },
  {
    id: 'p7', slug: 'web3-beyond-the-speculative-hype',
    title: 'Web3: Beyond the Speculative Hype',
    excerpt: 'Stripping away the noise of token prices to examine the actual technological utility of decentralized networks.',
    content: `<h2>The Infrastructure of Trust</h2><p>If you ignore the casino-like atmosphere around crypto, you find a genuinely useful piece of infrastructure: a trustless, permissionless ledger.</p><p>Establishing cryptographic truth without a centralized intermediary changes how we structure organizations and govern digital communities.</p><h2>Real-World Utility</h2><p>We're finally seeing applications that use blockchains as backend infrastructure rather than speculative assets — decentralized identity, supply-chain verification, instant settlement.</p>`,
    coverImage: 'images/cover-7.jpg', authorId: 'u2', categoryId: 'c1', tags: ['Web3', 'Technology', 'Finance'],
    status: 'published', createdAt: daysAgo(20), readingTime: 8, views: 11200, likes: 750, featured: false, popular: true,
  },
  {
    id: 'p8', slug: 'the-psychology-of-remote-work',
    title: 'The Psychology of Remote Work',
    excerpt: 'The shift from office to home is not just geographical — it requires rewiring how we define productivity, boundaries, and identity.',
    content: `<h2>The Blurring of Boundaries</h2><p>When your office is your living room, you never really arrive at work, and you never really leave. The commute used to provide a psychological threshold — now it's gone.</p><h2>Asynchronous Communication</h2><p>The biggest failure mode of remote teams is replicating the synchronous office online. Real remote work requires a shift to asynchronous, written communication, clearer thinking, and a culture of deep, uninterrupted work.</p>`,
    coverImage: 'images/cover-8.jpg', authorId: 'u2', categoryId: 'c2', tags: ['Work', 'Psychology', 'Business'],
    status: 'published', createdAt: daysAgo(25), readingTime: 5, views: 6700, likes: 380, featured: false, popular: false,
  },
  {
    id: 'p9', slug: 'urban-texture-and-street-art',
    title: 'Urban Texture: The Evolution of Street Art',
    excerpt: 'From subversive vandalism to gallery-sanctioned murals, examining how street art shapes the visual language of the modern city.',
    content: `<h2>The Voice of the City</h2><p>Street art is the most democratic art form in existence — it asks for no permission and charges no admission.</p><h2>Ephemerality</h2><p>The beauty of street art is that it's temporary: painted over, faded by sun, torn down. It is a living, breathing part of the urban texture, constantly in flux.</p>`,
    coverImage: 'images/cover-9.jpg', authorId: 'u3', categoryId: 'c5', tags: ['Art', 'Culture', 'Urbanism'],
    status: 'published', createdAt: daysAgo(30), readingTime: 4, views: 4100, likes: 290, featured: false, popular: false,
  },
  {
    id: 'p10', slug: 'the-mechanics-of-nutrition',
    title: 'The Mechanics of Nutrition',
    excerpt: 'Cutting through the noise of fad diets to understand the fundamental biological mechanisms of how the human body processes fuel.',
    content: `<h2>Beyond Caloric Deficits</h2><p>"Calories in, calories out" is technically true but practically useless — it ignores the complex hormonal responses triggered by different foods.</p><h2>Metabolic Flexibility</h2><p>The goal is metabolic flexibility: the ability to seamlessly switch between burning glucose and burning fat, achieved through fasting periods, fewer processed carbohydrates, and consistent physical exertion.</p>`,
    coverImage: 'images/cover-10.jpg', authorId: 'u4', categoryId: 'c4', tags: ['Health', 'Nutrition', 'Science'],
    status: 'published', createdAt: daysAgo(35), readingTime: 6, views: 7800, likes: 560, featured: false, popular: false,
  },
];

export const COMMENTS = [
  { id: 'cmt1', postId: 'p1', authorId: 'u2', content: "Brilliant piece. The shift towards generative UI is undeniable — we're moving from static maps to dynamic GPS navigation in interface design.", createdAt: hoursAgo(12), likes: 45, replies: [
    { id: 'cmt1-1', postId: 'p1', authorId: 'u1', content: 'Exactly. The challenge is making that "GPS" feel solid and reliable, not a chaotic soup of generated elements.', createdAt: hoursAgo(10), likes: 12, replies: [] },
  ] },
  { id: 'cmt2', postId: 'p1', authorId: 'u4', content: 'I wonder how this impacts accessibility. High contrast is good, but constantly shifting layouts could be a nightmare for screen readers.', createdAt: hoursAgo(5), likes: 28, replies: [] },
  { id: 'cmt3', postId: 'p2', authorId: 'u3', content: "The VC model isn't dead, but it's certainly been right-sized. Not every company needs to be a unicorn to be a massive success.", createdAt: daysAgo(2), likes: 15, replies: [] },
  { id: 'cmt4', postId: 'p4', authorId: 'u1', content: 'Cut my screen time an hour before bed based on this kind of research and it made a genuinely huge difference.', createdAt: daysAgo(4), likes: 22, replies: [] },
  { id: 'cmt5', postId: 'p7', authorId: 'u4', content: 'Refreshing to read something about this space that is not just price speculation.', createdAt: daysAgo(6), likes: 19, replies: [] },
];

function daysAgo(n) {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000).toISOString();
}
function hoursAgo(n) {
  return new Date(Date.now() - n * 60 * 60 * 1000).toISOString();
}

export function userById(id) {
  return USERS.find((u) => u.id === id);
}
export function categoryById(id) {
  return CATEGORIES.find((c) => c.id === id);
}
export function categoryBySlug(slug) {
  return CATEGORIES.find((c) => c.slug === slug);
}

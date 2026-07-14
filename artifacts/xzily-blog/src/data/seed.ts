export type User = {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: 'admin' | 'user';
  bio?: string;
};

export type Category = {
  id: string;
  slug: string;
  name: string;
  description: string;
};

export type Comment = {
  id: string;
  postId: string;
  authorId: string;
  content: string;
  createdAt: string;
  likes: number;
  replies: Comment[];
};

export type Post = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  coverImage: string;
  authorId: string;
  categoryId: string;
  tags: string[];
  status: 'draft' | 'published';
  createdAt: string;
  readingTime: number;
  views: number;
  likes: number;
  featured: boolean;
  popular: boolean;
};

export const MOCK_USERS: User[] = [
  {
    id: 'u1',
    name: 'Elena Rostova',
    email: 'elena@xzily.com',
    avatar: '/images/avatar-1.jpg',
    role: 'admin',
    bio: 'Editor-in-chief at Xzily. Exploring the intersection of design, technology, and culture.'
  },
  {
    id: 'u2',
    name: 'Marcus Chen',
    email: 'marcus@xzily.com',
    avatar: '/images/avatar-2.jpg',
    role: 'admin',
    bio: 'Senior tech correspondent. Writing about the future of software and decentralized systems.'
  },
  {
    id: 'u3',
    name: 'Julian Hayes',
    email: 'julian@xzily.com',
    avatar: '/images/avatar-3.jpg',
    role: 'admin',
    bio: 'Culture critic and essayist. Documenting the shifting landscapes of modern life.'
  },
  {
    id: 'u4',
    name: 'Sarah Jenkins',
    email: 'sarah@xzily.com',
    avatar: '/images/avatar-4.jpg',
    role: 'admin',
    bio: 'Health and science writer. Distilling complex research into actionable insights.'
  }
];

export const MOCK_CATEGORIES: Category[] = [
  { id: 'c1', slug: 'technology', name: 'Technology', description: 'The bleeding edge of software, hardware, and AI.' },
  { id: 'c2', slug: 'business', name: 'Business', description: 'Startups, economics, and the future of work.' },
  { id: 'c3', slug: 'lifestyle', name: 'Lifestyle', description: 'Design, architecture, and intentional living.' },
  { id: 'c4', slug: 'health', name: 'Health', description: 'Science-backed insights on longevity and wellness.' },
  { id: 'c5', slug: 'culture', name: 'Culture', description: 'Arts, society, and the zeitgeist.' },
  { id: 'c6', slug: 'travel', name: 'Travel', description: 'Dispatches from around the globe.' }
];

export const MOCK_POSTS: Post[] = [
  {
    id: 'p1',
    slug: 'the-new-aesthetics-of-artificial-intelligence',
    title: 'The New Aesthetics of Artificial Intelligence',
    excerpt: 'As models become more capable, the interfaces we use to interact with them must evolve past the generic chat box. We are entering an era of bold, opinionated AI design.',
    content: `<h2>The Era of Chat is Ending</h2><p>For the past two years, the default interface for interacting with large language models has been the chat box. It was a necessary starting point—a universal paradigm that everyone understood. But it is fundamentally limiting.</p><p>We are now seeing the emergence of <strong>generative interfaces</strong>: UIs that build themselves on the fly based on the user's intent. Instead of typing into a box, you manipulate sliders, canvas elements, and visual nodes, while the AI hums in the background, continuously updating the state.</p><blockquote><p>"The best AI interface is one where you don't even realize you're talking to an AI."</p></blockquote><h3>High-Contrast Design in a Generative World</h3><p>When the content is dynamic and unpredictable, the container must be rigid, confident, and highly structured. This is why we are seeing a resurgence of neo-brutalism and high-contrast editorial layouts in AI products. Bold typography and stark colors provide an anchor for the fluid, ever-changing generated content.</p><p>Red and black, in particular, evoke a sense of urgency and precision—two qualities that define the cutting edge of technological progress today.</p>`,
    coverImage: '/images/cover-1.jpg',
    authorId: 'u1',
    categoryId: 'c1',
    tags: ['AI', 'Design', 'UI/UX'],
    status: 'published',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
    readingTime: 6,
    views: 12500,
    likes: 842,
    featured: true,
    popular: true
  },
  {
    id: 'p2',
    slug: 'bootstrapping-in-the-age-of-abundant-capital',
    title: 'Bootstrapping in the Age of Abundant Capital',
    excerpt: 'Venture capital is no longer the default path for ambitious founders. Here is why profitable, slow-growth businesses are making a massive comeback.',
    content: `<h2>The Myth of Hypergrowth</h2><p>For a decade, the playbook was simple: raise a seed round, hire fast, burn cash to acquire users, and figure out the business model later. That era is over.</p><p>Founders are waking up to the reality that raising capital is essentially selling the most valuable asset you have: optionality. Once you take VC money, there is only one acceptable outcome: a billion-dollar exit or bust.</p><h3>The Rise of the Micro-SaaS</h3><p>Today, small, incredibly focused teams are building businesses that generate $5M+ in annual recurring revenue with zero outside funding. They use off-the-shelf tools, lean heavily on automation, and focus maniacally on solving one specific problem for one specific type of customer.</p><ul><li>Lower overhead</li><li>Higher margins</li><li>Complete autonomy</li></ul><p>The future belongs to the profitable.</p>`,
    coverImage: '/images/cover-2.jpg',
    authorId: 'u2',
    categoryId: 'c2',
    tags: ['Startups', 'Venture Capital', 'Bootstrapping'],
    status: 'published',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
    readingTime: 5,
    views: 8200,
    likes: 512,
    featured: false,
    popular: true
  },
  {
    id: 'p3',
    slug: 'minimalism-as-a-radical-act',
    title: 'Minimalism as a Radical Act',
    excerpt: 'In an economy built on infinite consumption, choosing to own less is not just a stylistic preference—it is a rebellion.',
    content: `<h2>Beyond White Walls and Empty Desks</h2><p>Minimalism has been commodified. It has been sold to us as an aesthetic: stark white apartments, geometric furniture, and $200 plain t-shirts. But true minimalism has nothing to do with what things look like. It is about what things <em>are</em>.</p><p>It is the ruthless elimination of the unessential so that you can pour all of your energy into the few things that actually matter.</p><h3>The Attention Economy</h3><p>Every app, every billboard, every email is competing for a fraction of your attention. By owning less, subscribing to less, and desiring less, you are taking back control of your cognitive bandwidth.</p><p>Choose quality over quantity. Choose silence over noise. Choose deep focus over shallow distraction.</p>`,
    coverImage: '/images/cover-3.jpg',
    authorId: 'u3',
    categoryId: 'c3',
    tags: ['Minimalism', 'Culture', 'Focus'],
    status: 'published',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(),
    readingTime: 4,
    views: 4500,
    likes: 320,
    featured: false,
    popular: false
  },
  {
    id: 'p4',
    slug: 'the-science-of-deep-sleep',
    title: 'The Architecture of Deep Sleep',
    excerpt: 'We spend a third of our lives unconscious, yet we treat sleep as an afterthought. New research reveals the complex structural phases of restorative rest.',
    content: `<h2>The Stages of Restoration</h2><p>Sleep is not simply the absence of wakefulness. It is a highly active, structurally complex process that repairs cellular damage, consolidates memories, and flushes toxins from the brain.</p><p>During deep sleep (Slow Wave Sleep), your brain waves slow down dramatically. Blood pressure drops. Muscle tissue is repaired. This is the foundation of human performance.</p><h3>Optimizing the Environment</h3><p>To maximize deep sleep, your environment must be aggressively optimized:</p><ol><li><strong>Temperature:</strong> Keep the room between 60-67°F (15-19°C).</li><li><strong>Light:</strong> Total blackout. Even a sliver of street light can disrupt circadian rhythms.</li><li><strong>Timing:</strong> Consistency is more important than duration. Go to bed at the exact same time every night.</li></ol>`,
    coverImage: '/images/cover-4.jpg',
    authorId: 'u4',
    categoryId: 'c4',
    tags: ['Health', 'Sleep', 'Science'],
    status: 'published',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 12).toISOString(),
    readingTime: 7,
    views: 9100,
    likes: 640,
    featured: false,
    popular: true
  },
  {
    id: 'p5',
    slug: 'kyoto-in-the-rain',
    title: 'Kyoto in the Rain: A Visual Essay',
    excerpt: 'The ancient capital reveals its true character not under the bright sun, but beneath the heavy, atmospheric downpours of the rainy season.',
    content: `<h2>The Wash of the City</h2><p>When it rains in Kyoto, the city transforms. The aggressive neon of modern Japan is muted, and the deep, rich colors of the ancient architecture—the vermilion of the shrine gates, the dark wood of the machiya townhouses—become hypersaturated.</p><p>There is a specific quiet that falls over the narrow streets of Gion when the rain starts. The tourists scatter, seeking shelter, leaving the cobblestones empty and reflective.</p><h3>Finding Stillness</h3><p>Travel is often about frantic consumption—seeing as many landmarks as possible. Kyoto in the rain forces you to stop. To sit under an awning, watch the water bead off a paper lantern, and simply exist in the space.</p>`,
    coverImage: '/images/cover-5.jpg',
    authorId: 'u3',
    categoryId: 'c6',
    tags: ['Travel', 'Japan', 'Photography'],
    status: 'published',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 15).toISOString(),
    readingTime: 3,
    views: 3200,
    likes: 210,
    featured: false,
    popular: false
  },
  {
    id: 'p6',
    slug: 'modern-cinema-and-the-death-of-subtlety',
    title: 'Modern Cinema and the Death of Subtlety',
    excerpt: 'Have we lost the art of the slow build? A critique of modern pacing and the relentless demand for immediate stimulation in film.',
    content: `<h2>The Need for Speed</h2><p>In the era of TikTok and endless scrolling, the pacing of modern blockbuster cinema has shifted dramatically. Shots are shorter. Dialogue is punchier. The time between action sequences has been compressed to practically zero.</p><p>We are losing the space between the notes. The silence that allows tension to build. The quiet character moments that make the explosive climax actually mean something.</p><h3>Reclaiming the Slow Burn</h3><p>A few filmmakers are still fighting the good fight, demanding patience from their audiences. They understand that a slow pan across an empty room can be more terrifying than a jump scare, and that a long, unbroken take of a conversation can be more thrilling than a CGI battle.</p>`,
    coverImage: '/images/cover-6.jpg',
    authorId: 'u1',
    categoryId: 'c5',
    tags: ['Film', 'Culture', 'Critique'],
    status: 'published',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 18).toISOString(),
    readingTime: 6,
    views: 5400,
    likes: 430,
    featured: false,
    popular: false
  },
  {
    id: 'p7',
    slug: 'web3-beyond-the-hype',
    title: 'Web3: Beyond the Speculative Hype',
    excerpt: 'Stripping away the noise of token prices and ape JPEGs to examine the actual technological utility of decentralized networks.',
    content: `<h2>The Infrastructure of Trust</h2><p>If you ignore the casino-like atmosphere that surrounds much of crypto, you will find a genuinely revolutionary piece of infrastructure: a trustless, permissionless ledger.</p><p>The ability to establish cryptographic truth without relying on a centralized intermediary fundamentally changes how we can structure organizations, distribute ownership, and govern digital communities.</p><h3>Real-World Utility</h3><p>We are finally seeing applications that use blockchains not as speculative assets, but as backend infrastructure. Decentralized identity systems, supply chain verification, and global, instant settlement networks. The technology is fading into the background, where it belongs.</p>`,
    coverImage: '/images/cover-7.jpg',
    authorId: 'u2',
    categoryId: 'c1',
    tags: ['Web3', 'Technology', 'Finance'],
    status: 'published',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 20).toISOString(),
    readingTime: 8,
    views: 11200,
    likes: 750,
    featured: false,
    popular: true
  },
  {
    id: 'p8',
    slug: 'the-psychology-of-remote-work',
    title: 'The Psychology of Remote Work',
    excerpt: 'The shift from office to home is not just geographical—it requires a complete rewiring of how we define productivity, boundaries, and identity.',
    content: `<h2>The Blurring of Boundaries</h2><p>When your office is your living room, you never really arrive at work, and you never really leave. The psychological threshold that the daily commute used to provide is gone.</p><p>Without physical boundaries, we have to construct rigid temporal boundaries. Hard stops. Rituals to signal the end of the day.</p><h3>Asynchronous Communication</h3><p>The biggest failure mode of remote teams is trying to replicate the synchronous office environment online. Eight hours of Zoom calls is a nightmare. True remote work requires a shift to asynchronous, written communication. It requires clearer thinking, better documentation, and a culture of deep, uninterrupted work.</p>`,
    coverImage: '/images/cover-8.jpg',
    authorId: 'u2',
    categoryId: 'c2',
    tags: ['Work', 'Psychology', 'Business'],
    status: 'published',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 25).toISOString(),
    readingTime: 5,
    views: 6700,
    likes: 380,
    featured: false,
    popular: false
  },
  {
    id: 'p9',
    slug: 'urban-texture-and-street-art',
    title: 'Urban Texture: The Evolution of Street Art',
    excerpt: 'From subversive vandalism to gallery-sanctioned murals, examining how street art shapes the visual language of the modern city.',
    content: `<h2>The Voice of the City</h2><p>Street art is the most democratic art form in existence. It does not ask for permission, and it does not charge admission. It forces art into the daily commute.</p><p>But as cities gentrify and street art becomes commodified—commissioned by developers to add "edge" to luxury condos—it risks losing its subversive power.</p><h3>Ephemerality</h3><p>The beauty of street art is that it is temporary. It gets painted over, faded by the sun, or torn down. It is a living, breathing part of the urban texture, constantly in flux.</p>`,
    coverImage: '/images/cover-9.jpg',
    authorId: 'u3',
    categoryId: 'c5',
    tags: ['Art', 'Culture', 'Urbanism'],
    status: 'published',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(),
    readingTime: 4,
    views: 4100,
    likes: 290,
    featured: false,
    popular: false
  },
  {
    id: 'p10',
    slug: 'the-mechanics-of-nutrition',
    title: 'The Mechanics of Nutrition',
    excerpt: 'Cutting through the noise of fad diets to understand the fundamental biological mechanisms of how the human body processes fuel.',
    content: `<h2>Beyond Caloric Deficits</h2><p>The "calories in, calories out" model is technically true, but practically useless. It treats the human body like a simple combustion engine, ignoring the complex hormonal responses triggered by different types of food.</p><p>A calorie of sugar and a calorie of broccoli elicit entirely different physiological cascades. One spikes insulin and promotes fat storage; the other provides sustained energy and micronutrients.</p><h3>Metabolic Flexibility</h3><p>The goal is metabolic flexibility: the ability of your body to seamlessly switch between burning glucose and burning fat. This is achieved through periods of fasting, a reduction in processed carbohydrates, and consistent physical exertion.</p>`,
    coverImage: '/images/cover-10.jpg',
    authorId: 'u4',
    categoryId: 'c4',
    tags: ['Health', 'Nutrition', 'Science'],
    status: 'published',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 35).toISOString(),
    readingTime: 6,
    views: 7800,
    likes: 560,
    featured: false,
    popular: false
  }
];

export const MOCK_COMMENTS: Comment[] = [
  {
    id: 'cmt1',
    postId: 'p1',
    authorId: 'u2',
    content: 'Brilliant piece. The shift towards generative UI is undeniable. We\'re moving from static maps to dynamic GPS navigation in terms of interface design.',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
    likes: 45,
    replies: [
      {
        id: 'cmt1-1',
        postId: 'p1',
        authorId: 'u1',
        content: 'Exactly. And the challenge is making that "GPS" feel solid and reliable, not just like a chaotic soup of generated elements.',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 10).toISOString(),
        likes: 12,
        replies: []
      }
    ]
  },
  {
    id: 'cmt2',
    postId: 'p1',
    authorId: 'u4',
    content: 'I wonder how this impacts accessibility. High contrast is good, but constantly shifting layouts could be a nightmare for screen readers.',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    likes: 28,
    replies: []
  },
  {
    id: 'cmt3',
    postId: 'p2',
    authorId: 'u3',
    content: 'The VC model isn\'t dead, but it\'s certainly been right-sized. Not every company needs to be a unicorn to be a massive success.',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
    likes: 15,
    replies: []
  }
];

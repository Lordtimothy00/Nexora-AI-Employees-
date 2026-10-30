export type Department =
  | 'Sales'
  | 'Support'
  | 'Marketing'
  | 'Operations'
  | 'Finance'
  | 'People';

export type Accent = 'violet' | 'mint' | 'sky' | 'amber' | 'rose' | 'lilac';

export interface ChatTurn {
  from: 'employee' | 'human';
  text: string;
}

export interface Employee {
  id: string;
  slug: string;
  name: string;
  role: string;
  department: Department;
  tagline: string;
  bio: string;
  avatar: string;
  initials: string;
  accent: Accent;
  tags: string[];
  skills: string[];
  tools: string[];
  deliverables: string[];
  languages: string[];
  responseTime: string;
  rating: number;
  deployments: number;
  tasksCompleted: number;
  hoursSavedPerWeek: number;
  priceMonthly: number;
  featured?: boolean;
  availability: 'Available now' | 'Hiring soon';
  sampleConversation: ChatTurn[];
  sampleWork: { title: string; meta: string; body: string }[];
}

export interface DepartmentMeta {
  name: Department;
  blurb: string;
}

export const departments: DepartmentMeta[] = [
  { name: 'Sales', blurb: 'Pipeline, prospecting, and follow-up that never slips.' },
  { name: 'Support', blurb: 'Tier-one answers with real empathy, around the clock.' },
  { name: 'Marketing', blurb: 'Campaigns, content, and launches that compound.' },
  { name: 'Operations', blurb: 'The quiet systems that keep the company moving.' },
  { name: 'Finance', blurb: 'Clean numbers, fast answers, zero spreadsheet chaos.' },
  { name: 'People', blurb: 'Sourcing and screening without the agency invoice.' },
];

export const employees: Employee[] = [
  {
    id: 'emp_ava',
    slug: 'ava-sales-development',
    name: 'Ava',
    role: 'Sales Development Rep',
    department: 'Sales',
    tagline: 'Fills your calendar with qualified conversations.',
    bio: 'Ava runs your top-of-funnel like a seasoned SDR. She researches accounts, writes sequences that sound human, triages replies, and keeps your CRM spotless. You wake up to booked meetings, not a backlog.',
    avatar: '/team/ava.jpg',
    initials: 'AV',
    accent: 'violet',
    tags: ['Outbound', 'CRM hygiene', 'Lead research'],
    skills: [
      'ICP and account research',
      'Multi-touch outbound sequences',
      'Personalized first lines',
      'Reply triage and routing',
      'CRM enrichment and cleanup',
      'Meeting booking and reminders',
    ],
    tools: ['HubSpot', 'Salesforce', 'Apollo', 'Gmail', 'LinkedIn', 'Calendly'],
    deliverables: [
      'Daily list of 40 net-new prospects with research notes',
      'Three-step sequences written in your voice',
      'Morning digest of warm replies and next actions',
      'Weekly pipeline source report',
    ],
    languages: ['English', 'Spanish'],
    responseTime: 'Under 2 min',
    rating: 4.9,
    deployments: 412,
    tasksCompleted: 128400,
    hoursSavedPerWeek: 19,
    priceMonthly: 49,
    featured: true,
    availability: 'Available now',
    sampleConversation: [
      { from: 'human', text: 'Ava, we need 12 qualified meetings with mid-market fintech ops leaders before Nov 15.' },
      { from: 'employee', text: 'On it. I pulled 240 accounts matching that ICP, filtered out 61 already in your CRM, and ranked the rest by hiring velocity and stack fit.' },
      { from: 'employee', text: 'Here are the top 20 with a first line for each. I drafted three sequence variants — want the direct one or the ops-pain angle to lead?' },
      { from: 'human', text: 'Ops-pain angle. Keep it under 90 words.' },
      { from: 'employee', text: 'Done. Sequence is live for the first 20 tomorrow at 8:10am their time. I will hold the rest until we see reply rate. First digest lands at 8:00am.' },
    ],
    sampleWork: [
      {
        title: 'Sequence: “The reconciliation tax”',
        meta: 'Outbound · 3 touches · 412 accounts',
        body: 'Subject: the reconciliation tax\n\nHi {{first_name}} — most ops leads we talk to lose 6–8 hours a week reconciling payouts by hand. Curious if that is still true at {{company}} or if you have automated it? Happy to send the one-page breakdown we use, no call needed.',
      },
      {
        title: 'Account research brief',
        meta: 'Top 20 accounts · enriched',
        body: 'Northwind Pay — 340 employees, Series C, 4 open RevOps roles, uses Stripe + NetSuite. Hook: new VP Ops started 6 weeks ago, likely auditing tooling. Best contact: Dana R., Head of Revenue Operations.',
      },
    ],
  },
  {
    id: 'emp_kai',
    slug: 'kai-customer-support',
    name: 'Kai',
    role: 'Customer Support Specialist',
    department: 'Support',
    tagline: 'Resolves the queue before it becomes a backlog.',
    bio: 'Kai handles the conversations that decide whether customers stay. He answers with your tone, follows your policies, escalates the right edge cases, and writes the follow-up so nothing is left dangling.',
    avatar: '/team/kai.jpg',
    initials: 'KA',
    accent: 'mint',
    tags: ['Tier 1 support', 'Refunds', 'Escalation'],
    skills: [
      'Inbox and ticket triage',
      'Policy-aware responses',
      'Refund and billing workflows',
      'Troubleshooting playbooks',
      'Escalation summaries',
      'CSAT follow-up',
    ],
    tools: ['Zendesk', 'Intercom', 'Stripe', 'Shopify', 'Slack', 'Notion'],
    deliverables: [
      'First response in under 3 minutes, 24/7',
      'Clear escalation notes for engineering',
      'Refunds processed within policy',
      'Weekly top-contact-driver report',
    ],
    languages: ['English', 'Japanese', 'Filipino'],
    responseTime: 'Under 90 sec',
    rating: 4.9,
    deployments: 508,
    tasksCompleted: 341900,
    hoursSavedPerWeek: 26,
    priceMonthly: 49,
    featured: true,
    availability: 'Available now',
    sampleConversation: [
      { from: 'human', text: 'We are seeing a spike in “where is my order” tickets. Can you take the queue?' },
      { from: 'employee', text: 'Took 143 tickets. 118 are the same carrier delay in the northeast — I applied the delay macro, sent proactive updates, and offered the 10% credit for anyone past the promise date.' },
      { from: 'employee', text: '25 need a human decision: 14 address changes and 11 refund requests above my $150 limit. I grouped them with context so you can clear them in one pass.' },
      { from: 'human', text: 'Approve refunds under $220 today.' },
      { from: 'employee', text: 'Updated policy applied. All 25 resolved, customers notified. I flagged the carrier issue to the ops channel and drafted a proactive email for the remaining 400 orders in transit.' },
    ],
    sampleWork: [
      {
        title: 'Carrier delay response',
        meta: '143 tickets · same-day resolution',
        body: 'Hi Maya — your order is moving again. The northeast hub cleared overnight, and tracking shows delivery now expected Thursday. I have applied a 10% credit for the delay and will watch it until it lands.',
      },
      {
        title: 'Escalation brief',
        meta: 'Sent to #eng-support',
        body: '7 reports of duplicate charges on annual upgrades since 10:40 UTC. All on Stripe webhook retry. Refunds issued, 3 customers waiting on confirmation. Repro steps and affected IDs attached.',
      },
    ],
  },
  {
    id: 'emp_nova',
    slug: 'nova-growth-strategist',
    name: 'Nova',
    role: 'Growth Marketing Strategist',
    department: 'Marketing',
    tagline: 'Turns positioning into pipeline.',
    bio: 'Nova thinks in funnels and writes like a founder. She builds the campaign plan, briefs the assets, sets the measurement, and tells you what to kill. Strategy that ships instead of sitting in a deck.',
    avatar: '/team/nova.jpg',
    initials: 'NO',
    accent: 'lilac',
    tags: ['Campaigns', 'Positioning', 'Lifecycle'],
    skills: [
      'Positioning and messaging',
      'Campaign planning',
      'Lifecycle and email flows',
      'Landing page copy',
      'Channel testing',
      'Weekly performance readouts',
    ],
    tools: ['HubSpot', 'Customer.io', 'Google Analytics', 'Meta Ads', 'Webflow', 'Notion'],
    deliverables: [
      '90-day campaign plan with owners and budgets',
      'Launch kit: copy, emails, and assets brief',
      'A/B tests with a clear winner call',
      'Monday performance memo',
    ],
    languages: ['English', 'French'],
    responseTime: 'Under 5 min',
    rating: 4.8,
    deployments: 267,
    tasksCompleted: 48900,
    hoursSavedPerWeek: 15,
    priceMonthly: 59,
    featured: true,
    availability: 'Available now',
    sampleConversation: [
      { from: 'human', text: 'We launch the new analytics product in 5 weeks. I have no plan yet.' },
      { from: 'employee', text: 'Drafted a five-week plan: weeks 1–2 design-partner story and waitlist, week 3 founder-led teardown content, week 4 launch week, week 5 proof and retargeting.' },
      { from: 'employee', text: 'Primary angle: “every metric tied to a decision.” Secondary: “no dashboards nobody opens.” I have five email ideas and two landing page variants ready for your review.' },
      { from: 'human', text: 'Make launch week heavier on proof.' },
      { from: 'employee', text: 'Rebalanced. Launch week now leads with three customer mini-case studies and a live benchmark. Budget shifted 20% from paid search into retargeting. Updated plan is in Notion with checks for each asset.' },
    ],
    sampleWork: [
      {
        title: 'Launch narrative',
        meta: 'Positioning · one-page brief',
        body: 'Nexora Analytics is for teams who have dashboards nobody opens. We tie every metric to a decision, so your Monday meeting starts with answers instead of exports. Proof: 3 customers cut reporting time by 70%.',
      },
      {
        title: 'Lifecycle flow',
        meta: '5 emails · 14-day trial',
        body: 'Day 0: your first decision, not your first dashboard. Day 2: the 3 metrics most teams misread. Day 5: how Northwind found $40k in waste. Day 9: invite your analyst. Day 13: what happens after trial — no pressure, just clarity.',
      },
    ],
  },
  {
    id: 'emp_atlas',
    slug: 'atlas-data-analyst',
    name: 'Atlas',
    role: 'Data Analyst',
    department: 'Operations',
    tagline: 'Answers the question behind the question.',
    bio: 'Atlas turns messy operational data into decisions. He writes the SQL, watches the dashboards, and delivers a Monday memo that tells you what changed and what to do about it — without you asking.',
    avatar: '/team/atlas.jpg',
    initials: 'AT',
    accent: 'sky',
    tags: ['SQL', 'Dashboards', 'Insight memos'],
    skills: [
      'SQL and warehouse modelling',
      'Cohort and retention analysis',
      'Anomaly monitoring',
      'Executive dashboards',
      'Experiment readouts',
      'Forecast sanity checks',
    ],
    tools: ['Snowflake', 'BigQuery', 'dbt', 'Looker', 'Metabase', 'Google Sheets'],
    deliverables: [
      'Daily anomaly sweep with root cause',
      'Monday insight memo, one page',
      'Self-serve dashboard your team trusts',
      'Ad-hoc answers in hours, not weeks',
    ],
    languages: ['English', 'Hindi'],
    responseTime: 'Under 10 min',
    rating: 4.9,
    deployments: 198,
    tasksCompleted: 31200,
    hoursSavedPerWeek: 21,
    priceMonthly: 69,
    featured: true,
    availability: 'Available now',
    sampleConversation: [
      { from: 'human', text: 'Churn ticked up last month. Is it real or noise?' },
      { from: 'employee', text: 'Real, but concentrated. Logo churn is flat at 1.8%; revenue churn moved 2.4% to 3.1%, driven by 4 accounts over $40k that downgraded seats after the price change.' },
      { from: 'employee', text: 'Cohort view shows the effect is limited to accounts onboarded before the new pricing. Everyone after is holding. I have drafted a save play for the 11 at-risk accounts in the same band.' },
      { from: 'human', text: 'Send me the query and the list.' },
      { from: 'employee', text: 'Shared the dbt model, the 11-account list with usage signals, and a one-page summary you can forward. I will re-run the cohort every Monday and flag movement over 0.3 points.' },
    ],
    sampleWork: [
      {
        title: 'Revenue churn readout',
        meta: 'Analytics · one-page memo',
        body: 'Revenue churn rose 70bps in October. 82% of the increase comes from four accounts downgrading seats post price change. Logo churn unchanged. Recommended: targeted save offer for pre-pricing cohort, hold new pricing.',
      },
      {
        title: 'Anomaly alert',
        meta: 'Daily sweep · root cause',
        body: 'Signup-to-activation fell 9 points yesterday. Isolated to iOS web, post-checkout redirect timing out at 12s. Engineering notified with session traces; volume impact ~140 users/day.',
      },
    ],
  },
  {
    id: 'emp_echo',
    slug: 'echo-content-writer',
    name: 'Echo',
    role: 'Content Writer',
    department: 'Marketing',
    tagline: 'Publishes work you would put your name on.',
    bio: 'Echo writes the long-form that earns trust. She researches your category, interviews your experts, and ships articles, case studies, and newsletters that sound like your smartest employee — because she learned from them.',
    avatar: '/team/echo.jpg',
    initials: 'EC',
    accent: 'amber',
    tags: ['Long-form', 'SEO', 'Newsletters'],
    skills: [
      'Research-backed long-form',
      'Customer case studies',
      'Newsletter writing',
      'Editing for voice',
      'SEO structure and internal links',
      'Content repurposing',
    ],
    tools: ['Notion', 'Google Docs', 'Webflow', 'Ahrefs', 'Ghost', 'Surfer'],
    deliverables: [
      'Two 1,800-word articles per week',
      'One customer story every two weeks',
      'Weekly newsletter draft',
      'Content calendar with briefs',
    ],
    languages: ['English', 'Portuguese'],
    responseTime: 'Under 15 min',
    rating: 4.8,
    deployments: 231,
    tasksCompleted: 18700,
    hoursSavedPerWeek: 17,
    priceMonthly: 59,
    availability: 'Available now',
    sampleConversation: [
      { from: 'human', text: 'We need a piece on why revops teams stall. Make it opinionated, no listicles.' },
      { from: 'employee', text: 'Angle: most revops stalls are not tooling problems, they are decision-rights problems. I found two of your customers who lived this and a benchmark from your own data to open with.' },
      { from: 'employee', text: 'Draft is 1,850 words with a strong opening, three failure modes, and a closing framework. I kept quotes to the two approved ones and flagged every claim that needs a source from you.' },
      { from: 'human', text: 'Tighten the middle section and drop the framework name.' },
      { from: 'employee', text: 'Done. Down to 1,620 words, framework renamed to plain language, section three now leads with the customer example. Ready for your final read — publishing slot is Thursday 9am.' },
    ],
    sampleWork: [
      {
        title: '“The decision-rights problem”',
        meta: 'Long-form · 1,620 words',
        body: 'Every stalled revops project we have seen shares a symptom: a dashboard nobody argues about. The cause is rarely the tool. It is that no one owns the number, so no one changes the meeting.',
      },
      {
        title: 'Customer story: Northwind',
        meta: 'Case study · 800 words',
        body: 'Northwind’s ops team was spending eleven hours a week reconciling payouts. Nine weeks after rebuilding ownership, the same team ships a weekly forecast the CFO reads without edits.',
      },
    ],
  },
  {
    id: 'emp_lumen',
    slug: 'lumen-executive-assistant',
    name: 'Lumen',
    role: 'Executive Assistant',
    department: 'Operations',
    tagline: 'Gives you back the first two hours of your day.',
    bio: 'Lumen runs the operating rhythm around you. Inbox triage, scheduling that respects your focus blocks, meeting briefs in your hand before the call, and follow-ups that actually get sent.',
    avatar: '/team/lumen.jpg',
    initials: 'LU',
    accent: 'sky',
    tags: ['Inbox zero', 'Scheduling', 'Briefs'],
    skills: [
      'Inbox triage and drafting',
      'Calendar and focus protection',
      'Meeting briefs and agendas',
      'Action-item follow-up',
      'Travel and logistics',
      'Weekly operating review',
    ],
    tools: ['Google Workspace', 'Outlook', 'Slack', 'Notion', 'Zoom', 'Linear'],
    deliverables: [
      'Inbox sorted into decide / delegate / archive',
      'Zero double-bookings, protected focus time',
      'One-page brief before every meeting',
      'Friday wrap-up with open loops closed',
    ],
    languages: ['English', 'German'],
    responseTime: 'Under 3 min',
    rating: 4.9,
    deployments: 356,
    tasksCompleted: 96400,
    hoursSavedPerWeek: 12,
    priceMonthly: 49,
    availability: 'Available now',
    sampleConversation: [
      { from: 'human', text: 'Tomorrow is packed. I need space for the board prep.' },
      { from: 'employee', text: 'Moved the vendor call to Thursday, combined your two 1:1s into a 45-minute block, and protected 9:00–11:00 for board prep. I sent notes to everyone affected with a reason and an alternative.' },
      { from: 'employee', text: 'Brief for the 11:30 investor sync is ready: last quarter’s numbers, the two questions they always ask, and an open item from your last call about the hiring plan.' },
      { from: 'human', text: 'Add the churn note from Atlas.' },
      { from: 'employee', text: 'Added, with the 70bps detail and the recommended save play. I also queued a 10-minute buffer after the call for your notes. Anything else before I close the day?' },
    ],
    sampleWork: [
      {
        title: 'Board prep brief',
        meta: 'Meeting brief · one page',
        body: 'Goal: agree the Q1 hiring envelope. Lead with revenue churn explanation, then the two roles that unblock pipeline. Expected objection: burn multiple. Pre-read attached with three slides.',
      },
      {
        title: 'Inbox triage',
        meta: '84 messages · 6 need you',
        body: 'Decide: partner term sheet, pricing exception, board date. Delegate: 31 to ops, 12 to finance. Archive: 35. Drafted replies ready for the 6 that need your voice.',
      },
    ],
  },
  {
    id: 'emp_vera',
    slug: 'vera-talent-partner',
    name: 'Vera',
    role: 'Talent Partner',
    department: 'People',
    tagline: 'A pipeline that is warm before you open the role.',
    bio: 'Vera sources, screens, and schedules with a human touch. She writes outreach people answer, runs structured first screens, and hands your hiring manager a shortlist with evidence instead of vibes.',
    avatar: '/team/vera.jpg',
    initials: 'VE',
    accent: 'rose',
    tags: ['Sourcing', 'Screening', 'Interview kits'],
    skills: [
      'Talent mapping and sourcing',
      'Personalized outreach',
      'Structured screening',
      'Interview kit design',
      'Candidate scheduling',
      'Offer and feedback loops',
    ],
    tools: ['Greenhouse', 'Ashby', 'LinkedIn', 'Gmail', 'Calendly', 'Notion'],
    deliverables: [
      'Weekly shortlist of 8 qualified candidates',
      'Screening notes with a clear recommend / pass',
      'Structured interview kits per role',
      'Candidate experience report',
    ],
    languages: ['English', 'Spanish'],
    responseTime: 'Under 5 min',
    rating: 4.8,
    deployments: 174,
    tasksCompleted: 14600,
    hoursSavedPerWeek: 16,
    priceMonthly: 59,
    availability: 'Available now',
    sampleConversation: [
      { from: 'human', text: 'We need a senior backend engineer in Lagos or remote, start in 6 weeks.' },
      { from: 'employee', text: 'Mapped 190 engineers with payments or marketplace scale, filtered to 64 who are open to remote and have shipped in the last year. Sent 30 personalized notes; 11 replied overnight.' },
      { from: 'employee', text: 'Four screening calls booked for Thursday. I built a scorecard around system design, ownership, and on-call maturity, with three questions each. Shortlist will be with you by Friday noon.' },
      { from: 'human', text: 'Prioritize people who have scaled past 10k TPS.' },
      { from: 'employee', text: 'Re-ranked. Top three all have 10k+ TPS experience, including one who led a payments migration at a 400-person company. Updated the scorecard weighting and moved the calls to Wednesday.' },
    ],
    sampleWork: [
      {
        title: 'Senior backend shortlist',
        meta: '8 candidates · evidence-backed',
        body: 'Candidate 1: 7 yrs, led payments migration to 14k TPS, strong ownership signals. Candidate 2: marketplace scale, weaker on-call experience. Recommend 1 and 3 for onsite; 2 for a technical screen only.',
      },
      {
        title: 'Screening scorecard',
        meta: 'Interview kit · backend',
        body: 'System design: can they reason about failure modes? Ownership: example of a decision they reversed. On-call: what did they change after the last incident? Pass threshold: strong on two of three.',
      },
    ],
  },
  {
    id: 'emp_mira',
    slug: 'mira-finance-analyst',
    name: 'Mira',
    role: 'Finance Analyst',
    department: 'Finance',
    tagline: 'Close the books without closing your weekend.',
    bio: 'Mira keeps the numbers honest. She reconciles accounts, updates the model, flags spend that drifted, and answers “can we afford this?” with a straight answer and the math behind it.',
    avatar: '/team/mira.jpg',
    initials: 'MI',
    accent: 'mint',
    tags: ['Reconciliation', 'Modelling', 'Spend control'],
    skills: [
      'Month-end reconciliation',
      'Scenario modelling',
      'Burn and runway tracking',
      'Vendor spend review',
      'Invoice and AP checks',
      'Board-ready summaries',
    ],
    tools: ['QuickBooks', 'Xero', 'Stripe', 'Ramp', 'Google Sheets', 'Snowflake'],
    deliverables: [
      'Month-end close in three business days',
      'Weekly cash and runway snapshot',
      'Flagged overspend with a fix',
      'Scenario model for your next hire',
    ],
    languages: ['English', 'Yoruba'],
    responseTime: 'Under 8 min',
    rating: 4.9,
    deployments: 143,
    tasksCompleted: 9800,
    hoursSavedPerWeek: 14,
    priceMonthly: 69,
    availability: 'Available now',
    sampleConversation: [
      { from: 'human', text: 'Can we afford two more engineers this quarter?' },
      { from: 'employee', text: 'Yes, with one caveat. At current burn, two hires keep runway above 18 months. The caveat is the Q1 renewal at $84k; if that lands at list price, runway drops to 16.' },
      { from: 'employee', text: 'I built three scenarios: hold hiring, two hires now, two hires in February. The middle case keeps your growth target and the 18-month floor.' },
      { from: 'human', text: 'Send the middle case for the board.' },
      { from: 'employee', text: 'Shared a two-page summary with assumptions on one page and the cash curve on the other. I also flagged $2.1k/mo of unused tooling we can cut to offset the start dates.' },
    ],
    sampleWork: [
      {
        title: 'Hiring scenario model',
        meta: 'Finance · 3 scenarios',
        body: 'Base case: two hires now, 18.4 months runway, 2.1x growth. Downside: renewal at list, 16.1 months. Recommended: stagger start dates by six weeks and cut idle tooling to protect the floor.',
      },
      {
        title: 'Month-end close',
        meta: 'Reconciliation · 3-day close',
        body: 'All six accounts reconciled. Two unmatched payments traced to a Stripe fee change, one duplicate vendor invoice caught at $1,840. Close pack and variance notes ready for review.',
      },
    ],
  },
];

export const getEmployeeBySlug = (slug: string) =>
  employees.find((employee) => employee.slug === slug);

export const getEmployeeById = (id: string) =>
  employees.find((employee) => employee.id === id);

export const featuredEmployees = employees.filter((employee) => employee.featured);

export const accentClasses: Record<
  Accent,
  { text: string; bg: string; ring: string; glow: string; gradient: string; dot: string }
> = {
  violet: {
    text: 'text-[#9df7c2]',
    bg: 'bg-[#0bd39a]/12',
    ring: 'ring-[#0bd39a]/30',
    glow: 'from-[#0bd39a]/40',
    gradient: 'from-[#0bd39a] via-[#2fe3b0] to-[#12e3c0]',
    dot: 'bg-[#2fe3b0]',
  },
  mint: {
    text: 'text-[#b9ffe8]',
    bg: 'bg-[#12e3c0]/14',
    ring: 'ring-[#12e3c0]/30',
    glow: 'from-[#12e3c0]/38',
    gradient: 'from-[#12e3c0] via-[#7ff0d4] to-[#0bd39a]',
    dot: 'bg-[#7ff0d4]',
  },
  sky: {
    text: 'text-[#9df7c2]',
    bg: 'bg-[#2fe3b0]/12',
    ring: 'ring-[#2fe3b0]/30',
    glow: 'from-[#2fe3b0]/35',
    gradient: 'from-[#2fe3b0] via-[#9df7c2] to-[#12e3c0]',
    dot: 'bg-[#9df7c2]',
  },
  amber: {
    text: 'text-[#b9ffe8]',
    bg: 'bg-[#7ff0d4]/12',
    ring: 'ring-[#7ff0d4]/30',
    glow: 'from-[#7ff0d4]/30',
    gradient: 'from-[#7ff0d4] via-[#b9ffe8] to-[#0bd39a]',
    dot: 'bg-[#7ff0d4]',
  },
  rose: {
    text: 'text-[#b8c8cd]',
    bg: 'bg-[#b8c8cd]/10',
    ring: 'ring-[#b8c8cd]/25',
    glow: 'from-[#b8c8cd]/25',
    gradient: 'from-[#9df7c2] via-[#b8c8cd] to-[#12e3c0]',
    dot: 'bg-[#b8c8cd]',
  },
  lilac: {
    text: 'text-[#b9ffe8]',
    bg: 'bg-[#12e3c0]/12',
    ring: 'ring-[#12e3c0]/28',
    glow: 'from-[#12e3c0]/32',
    gradient: 'from-[#12e3c0] via-[#b9ffe8] to-[#2fe3b0]',
    dot: 'bg-[#12e3c0]',
  },
};

export interface Plan {
  id: 'launch' | 'growth' | 'scale';
  name: string;
  description: string;
  monthly: number;
  annual: number;
  employeeLimit: string;
  taskLimit: string;
  popular?: boolean;
  features: string[];
  cta: string;
}

export const plans: Plan[] = [
  {
    id: 'launch',
    name: 'Launch',
    description: 'For founders and solo operators who need leverage yesterday.',
    monthly: 12,
    annual: 10,
    employeeLimit: '1 AI employee',
    taskLimit: '500 tasks / month',
    cta: 'Start with one hire',
    features: [
      '1 AI employee of your choice',
      'Up to 500 completed tasks / month',
      'Core integrations (Gmail, Slack, Notion)',
      'Shared workspace inbox',
      'Weekly performance summary',
      'Email support',
    ],
  },
  {
    id: 'growth',
    name: 'Growth',
    description: 'For teams replacing busywork with a real operating bench.',
    monthly: 55,
    annual: 44,
    employeeLimit: 'Up to 5 AI employees',
    taskLimit: '4,000 tasks / month',
    popular: true,
    cta: 'Build my team',
    features: [
      'Up to 5 AI employees, any department',
      '4,000 completed tasks / month',
      'All integrations, including CRM and warehouse',
      'Custom playbooks and brand voice training',
      'Team analytics and utilisation',
      'Priority support with 4-hour response',
      'Unlimited human seats',
    ],
  },
  {
    id: 'scale',
    name: 'Scale',
    description: 'For companies running AI employees across every function.',
    monthly: 199,
    annual: 159,
    employeeLimit: 'Unlimited AI employees',
    taskLimit: 'Unlimited tasks',
    cta: 'Talk to sales',
    features: [
      'Unlimited AI employees and tasks',
      'Advanced permissions and approval flows',
      'SSO, SCIM, and audit logs',
      'Custom model routing and data residency',
      'Dedicated success manager',
      '99.9% uptime SLA and security review',
      'Onboarding for your entire playbook',
    ],
  },
];

export interface ComparisonRow {
  label: string;
  group?: string;
  values: [string | boolean, string | boolean, string | boolean];
}

export const comparisonRows: ComparisonRow[] = [
  { group: 'Workforce', label: 'AI employees included', values: ['1', 'Up to 5', 'Unlimited'] },
  { group: 'Workforce', label: 'Completed tasks / month', values: ['500', '4,000', 'Unlimited'] },
  { group: 'Workforce', label: 'Departments available', values: ['Any one', 'All', 'All'] },
  { group: 'Workforce', label: 'Human seats', values: ['1', 'Unlimited', 'Unlimited'] },
  { group: 'Capabilities', label: 'Custom instructions', values: [true, true, true] },
  { group: 'Capabilities', label: 'Brand voice training', values: [false, true, true] },
  { group: 'Capabilities', label: 'Custom playbooks', values: [false, true, true] },
  { group: 'Capabilities', label: 'Approval workflows', values: [false, 'Basic', 'Advanced'] },
  { group: 'Capabilities', label: 'Model routing', values: [false, false, true] },
  { group: 'Connections', label: 'Core integrations', values: [true, true, true] },
  { group: 'Connections', label: 'CRM & warehouse integrations', values: [false, true, true] },
  { group: 'Connections', label: 'Custom API and webhooks', values: [false, true, true] },
  { group: 'Governance', label: 'Team analytics', values: ['Basic', 'Full', 'Full'] },
  { group: 'Governance', label: 'SSO & SCIM', values: [false, false, true] },
  { group: 'Governance', label: 'Audit logs', values: [false, false, true] },
  { group: 'Governance', label: 'Uptime SLA', values: [false, false, '99.9%'] },
  { group: 'Support', label: 'Support', values: ['Email', 'Priority, 4h', 'Dedicated manager'] },
  { group: 'Support', label: 'Onboarding', values: ['Self-serve', 'Guided', 'White glove'] },
];

export const integrations = [
  { name: 'Slack', category: 'Communication' },
  { name: 'Gmail', category: 'Communication' },
  { name: 'Notion', category: 'Knowledge' },
  { name: 'Linear', category: 'Projects' },
  { name: 'HubSpot', category: 'CRM' },
  { name: 'Salesforce', category: 'CRM' },
  { name: 'Zendesk', category: 'Support' },
  { name: 'Intercom', category: 'Support' },
  { name: 'Stripe', category: 'Finance' },
  { name: 'QuickBooks', category: 'Finance' },
  { name: 'Snowflake', category: 'Data' },
  { name: 'BigQuery', category: 'Data' },
  { name: 'Shopify', category: 'Commerce' },
  { name: 'Greenhouse', category: 'People' },
  { name: 'Calendly', category: 'Scheduling' },
  { name: 'Google Workspace', category: 'Workspace' },
];

export const faqs = [
  {
    q: 'What exactly is an AI employee?',
    a: 'An AI employee is a configured teammate with a role, a playbook, tool access, and a defined output. Unlike a chatbot, it owns work end to end: it reads your data, takes action in your tools, and reports back with finished work. Every action is logged and reversible.',
  },
  {
    q: 'How long does it take to hire?',
    a: 'About four minutes. Pick a role, connect the tools it needs, answer five calibration questions, and your employee starts on its first task immediately. Most teams have their first delivered output within the same hour.',
  },
  {
    q: 'Will it sound like my company?',
    a: 'Yes. During onboarding your employee learns from your existing docs, past emails, and a short voice sample. On Growth and Scale you can train multiple brand voices and lock specific tones to specific employees.',
  },
  {
    q: 'Who approves what?',
    a: 'You do — by policy. Set spend limits, approval gates, and allowed tools per employee. Anything outside the policy comes to you as a decision request with context and a recommendation, never as a silent action.',
  },
  {
    q: 'What happens to my data?',
    a: 'Your data is encrypted in transit and at rest, never used to train shared models, and can be deleted on demand. Scale plans support custom data residency and a full security review with your team.',
  },
  {
    q: 'Can I swap employees or departments?',
    a: 'Anytime. Move a seat between roles, pause an employee, or add a department. Unused monthly tasks roll over for 30 days on Growth and Scale, and billing is prorated automatically.',
  },
  {
    q: 'Is there a contract?',
    a: 'Monthly plans are month to month and cancel in one click. Annual plans save two months and can be upgraded mid-term with prorated billing. No setup fees, ever.',
  },
  {
    q: 'Do you offer a trial?',
    a: 'Every new workspace gets 14 days of Growth with up to two AI employees, no card required. You keep every deliverable your employees produced, even if you decide not to continue.',
  },
];

export const testimonials = [
  {
    quote:
      'We replaced a $7k/month agency retainer with two Nexora employees. The work is faster, more consistent, and I can actually see what is being done.',
    name: 'Daniel Okonkwo',
    role: 'Co-founder & CEO',
    company: 'Northwind Pay',
    initials: 'DO',
    accent: 'violet' as const,
    metric: '$84k saved / year',
  },
  {
    quote:
      'Kai cleared a 900-ticket backlog in our first week. CSAT went up, not down. I have never seen a support hire ramp that fast.',
    name: 'Sofia Marchetti',
    role: 'Head of Customer Experience',
    company: 'Lumen Retail',
    initials: 'SM',
    accent: 'mint' as const,
    metric: '900 tickets, 1 week',
  },
  {
    quote:
      'Atlas found a churn pattern in our data that two analysts missed. The memo was one page and it changed our pricing decision.',
    name: 'Priya Raman',
    role: 'VP Operations',
    company: 'Cadence',
    initials: 'PR',
    accent: 'sky' as const,
    metric: '70bps churn caught',
  },
  {
    quote:
      'My calendar finally has room to think. Lumen runs the rhythm of my week better than any human assistant I have had.',
    name: 'Marcus Feld',
    role: 'Founder',
    company: 'Studio Nine',
    initials: 'MF',
    accent: 'amber' as const,
    metric: '11 hrs / week back',
  },
  {
    quote:
      'Nova rebuilt our launch motion in a week. We shipped the campaign on time for the first time in three quarters.',
    name: 'Amara Bello',
    role: 'CMO',
    company: 'Trellis',
    initials: 'AB',
    accent: 'lilac' as const,
    metric: '2.4x launch pipeline',
  },
  {
    quote:
      'Vera built a shortlist of eight engineers, four of whom we interviewed. Two are now on the team. That is a better hit rate than our agency.',
    name: 'Tomás Rivera',
    role: 'Engineering Manager',
    company: 'Meridian',
    initials: 'TR',
    accent: 'rose' as const,
    metric: '2 hires in 5 weeks',
  },
];

export const logos = [
  'Northwind',
  'Cadence',
  'Trellis',
  'Meridian',
  'Lumen Retail',
  'Studio Nine',
  'Ferry',
  'Oakline',
];

export const stats = [
  { value: '2.4M+', label: 'tasks delivered' },
  { value: '38 hrs', label: 'saved per team, weekly' },
  { value: '4.9/5', label: 'average rating' },
  { value: '11 min', label: 'median first delivery' },
];

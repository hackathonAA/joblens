export type Outcome = "passed" | "failed" | "pending"

export type RoundType =
  | "Recruiter Screen"
  | "System Design"
  | "Behavioral"
  | "Take-Home"
  | "Final"

export type Question = {
  id: string
  prompt: string
  topic: string
}

export type InterviewRound = {
  id: string
  date: string // ISO
  type: RoundType
  interviewer: string
  interviewerTitle: string
  outcome: Outcome
  rating: number // 1-5
  questions: Question[]
  notes: string
  shouldHaveSaid: string
}

export type Application = {
  company: string
  role: string
  level: string
  rounds: InterviewRound[]
}

export const OUTCOME_CONFIG: Record<
  Outcome,
  { label: string; dot: string; badge: string }
> = {
  passed: {
    label: "Passed",
    dot: "bg-[var(--chart-good)]",
    badge: "bg-[var(--chart-good)]/15 text-[var(--chart-good)]",
  },
  failed: {
    label: "Failed",
    dot: "bg-[var(--chart-bad)]",
    badge: "bg-[var(--chart-bad)]/15 text-[var(--chart-bad)]",
  },
  pending: {
    label: "Pending",
    dot: "bg-[var(--chart-warn)]",
    badge: "bg-[var(--chart-warn)]/15 text-[var(--chart-warn)]",
  },
}

// Distinct, muted topic tag colors (kept within theme palette)
export const TOPIC_CONFIG: Record<string, string> = {
  "Distributed Systems": "bg-[var(--chart-1)]/15 text-[var(--chart-1)]",
  Scalability: "bg-[var(--chart-2)]/15 text-[var(--chart-2)]",
  Caching: "bg-[var(--chart-3)]/15 text-[var(--chart-3)]",
  Databases: "bg-[var(--chart-5)]/15 text-[var(--chart-5)]",
  Trees: "bg-[var(--chart-2)]/15 text-[var(--chart-2)]",
  Leadership: "bg-[var(--chart-1)]/15 text-[var(--chart-1)]",
  "Product Sense": "bg-[var(--chart-3)]/15 text-[var(--chart-3)]",
  Concurrency: "bg-[var(--chart-5)]/15 text-[var(--chart-5)]",
}

export function topicClass(topic: string): string {
  return TOPIC_CONFIG[topic] ?? "bg-secondary text-secondary-foreground"
}

export const APPLICATION: Application = {
  company: "Google",
  role: "Senior Software Engineer",
  level: "L5",
  rounds: [
    {
      id: "r1",
      date: "2026-05-04",
      type: "Recruiter Screen",
      interviewer: "Dana Whitfield",
      interviewerTitle: "Technical Recruiter",
      outcome: "passed",
      rating: 4,
      questions: [
        {
          id: "q1",
          prompt: "Walk me through your most impactful project in the last year.",
          topic: "Leadership",
        },
        {
          id: "q2",
          prompt: "What's your current comp and what are you targeting?",
          topic: "Product Sense",
        },
      ],
      notes:
        "Kept it high level, focused on the payments migration I led. Gave a comp range slightly above my current to anchor.",
      shouldHaveSaid:
        "Should have quantified business impact more — the migration cut latency 40% and saved ~$2M/yr. Numbers land better than narrative.",
    },
    {
      id: "r2",
      date: "2026-05-12",
      type: "System Design",
      interviewer: "Priya Raman",
      interviewerTitle: "Staff Engineer, Search Infra",
      outcome: "failed",
      rating: 2,
      questions: [
        {
          id: "q3",
          prompt:
            "Design a globally distributed rate limiter for an API gateway handling 1M req/s.",
          topic: "Distributed Systems",
        },
        {
          id: "q4",
          prompt:
            "How would you keep counters consistent across regions without killing latency?",
          topic: "Scalability",
        },
        {
          id: "q5",
          prompt:
            "Where would you add caching, and how do you handle stale counts?",
          topic: "Caching",
        },
        {
          id: "q6",
          prompt:
            "What datastore would you pick for the counters and why?",
          topic: "Databases",
        },
      ],
      notes:
        "Jumped to a token-bucket per node too fast. When asked about cross-region consistency I hand-waved with 'eventually consistent' and didn't justify the tradeoff. Ran out of time before discussing the datastore.",
      shouldHaveSaid:
        "Should have started by clarifying requirements (global vs per-region limits, burst tolerance) before designing. For cross-region I should have proposed a CRDT-based counter or a sloppy-quorum approach and named the consistency/latency tradeoff explicitly. Pick Redis with local token buckets + async reconciliation rather than a single global store.",
    },
    {
      id: "r3",
      date: "2026-05-19",
      type: "Behavioral",
      interviewer: "Marcus Lee",
      interviewerTitle: "Engineering Manager",
      outcome: "pending",
      rating: 3,
      questions: [
        {
          id: "q7",
          prompt:
            "Tell me about a time you disagreed with a senior leader's technical decision.",
          topic: "Leadership",
        },
        {
          id: "q8",
          prompt:
            "Describe a project that failed. What did you learn?",
          topic: "Leadership",
        },
      ],
      notes:
        "Used the STAR format. The disagreement story landed well; the failure story was a bit vague on what I'd do differently.",
      shouldHaveSaid:
        "Should have closed the failure story with a concrete behavior change I adopted afterward, e.g. instituting design reviews before any multi-team rollout.",
    },
  ],
}

// Aggregated question bank across all interviews (sample includes other apps too)
export type BankRow = {
  id: string
  question: string
  topic: string
  company: string
  round: RoundType
  outcome: Outcome
  timesSeen: number
}

export const QUESTION_BANK: BankRow[] = [
  {
    id: "b1",
    question: "Design a globally distributed rate limiter",
    topic: "Distributed Systems",
    company: "Google",
    round: "System Design",
    outcome: "failed",
    timesSeen: 3,
  },
  {
    id: "b2",
    question: "Keep counters consistent across regions",
    topic: "Scalability",
    company: "Google",
    round: "System Design",
    outcome: "failed",
    timesSeen: 2,
  },
  {
    id: "b3",
    question: "Where to add caching and handle stale data",
    topic: "Caching",
    company: "Google",
    round: "System Design",
    outcome: "failed",
    timesSeen: 4,
  },
  {
    id: "b4",
    question: "Most impactful project in the last year",
    topic: "Leadership",
    company: "Google",
    round: "Recruiter Screen",
    outcome: "passed",
    timesSeen: 6,
  },
  {
    id: "b5",
    question: "Disagreed with a senior leader's decision",
    topic: "Leadership",
    company: "Google",
    round: "Behavioral",
    outcome: "pending",
    timesSeen: 5,
  },
  {
    id: "b6",
    question: "Design a URL shortener with analytics",
    topic: "Distributed Systems",
    company: "Stripe",
    round: "System Design",
    outcome: "passed",
    timesSeen: 2,
  },
  {
    id: "b7",
    question: "Lowest common ancestor in a binary tree",
    topic: "Trees",
    company: "Meta",
    round: "Take-Home",
    outcome: "passed",
    timesSeen: 3,
  },
  {
    id: "b8",
    question: "Design a thread-safe in-memory cache with TTL",
    topic: "Concurrency",
    company: "Stripe",
    round: "System Design",
    outcome: "failed",
    timesSeen: 2,
  },
  {
    id: "b9",
    question: "How would you launch a feature to 1% of users",
    topic: "Product Sense",
    company: "Meta",
    round: "Behavioral",
    outcome: "passed",
    timesSeen: 1,
  },
  {
    id: "b10",
    question: "Pick a datastore for high-write counters",
    topic: "Databases",
    company: "Google",
    round: "System Design",
    outcome: "pending",
    timesSeen: 2,
  },
]

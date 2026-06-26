# JobLens — Feature Brain Dump

> Stack: Next.js (Vercel) · Aurora PostgreSQL · AWS Lambda · Claude AI
> Track: B2C — Job Search Intelligence Platform

---

## Core Features (Must Have for MVP)

### 1. Application Tracker
- Add a job application manually OR paste a job URL and auto-extract company, role, level, tech stack, salary range from the JD
- Status pipeline: Applied → Recruiter Screen → Technical → Final Round → Offer → Accepted/Rejected
- Each application has: company, role, level, location, salary range, job description, contacts, notes, dates
- Timeline view per application — every event logged with timestamp
- Dashboard view: all active applications, status at a glance, days since last activity

### 2. Contact Rolodex
- Every person you talk to during a job search stored: name, title, company, LinkedIn, how you met, last contact date
- Link contacts to applications
- AI drafts follow-up emails based on context: "You spoke with Sarah 5 days ago after your system design round. Want to follow up?"
- Never forget who referred you or who to thank after an offer

### 3. Interview Logger
- Log every interview round: date, type (behavioral, system design, DSA, culture, take-home), interviewer, questions asked, how it went, outcome
- Tag questions by topic (trees, distributed systems, leadership, product sense)
- Notes per round — what you said, what you should have said
- Link to application

### 4. Offer Letter Analyzer
- Upload PDF or paste text of offer letter
- AI extracts and structures: base salary, equity (RSUs/options), vesting schedule, cliff, bonus, benefits, start date
- Flags risky clauses: non-competes, IP assignment, clawback, at-will exceptions, arbitration clauses
- Rates each clause: Green (standard) / Yellow (worth negotiating) / Red (unusual, flag before signing)
- Plain English explanation for every clause — no legal jargon
- "What to ask them to change" — specific redline suggestions per flagged clause

### 5. Follow-up Tracker
- Every application has a follow-up timeline
- Set reminders: "Follow up if no response by Day 5"
- AI drafts the follow-up email with context from your notes
- Track open/sent status

---

## Novel / Never-Done-Before Features

### 6. Offer Letter DNA (Clause Database)
- Every offer letter uploaded contributes anonymized clause data to a shared Aurora DB
- Over time: "This non-compete is in the top 10% most restrictive we've seen across 3,000 offer letters"
- Company-specific clause fingerprints: "Google never includes IP assignment on side projects. This startup does."
- Your offer letter benchmarked against real historical data, not generic advice
- **Why it's novel**: Requires accumulation of structured clause data over time. Not possible with a one-shot LLM call.

### 7. Rejection Forensics
- When you're rejected (or ghosted), log the stage: after resume, after recruiter screen, after take-home, after final round, after reference check
- System builds a structured rejection map across your entire search
- Pattern detection: "You've been rejected 4 times at the take-home stage. That's 67% of your take-home submissions."
- Cross-references with interview logs: "Your 3 system design rejections all involved distributed systems topics"
- **Why it's novel**: Turns invisible failure signals into structured, actionable data

### 8. Ghost Radar
- Tracks response rates by: day of week you applied, resume version used, application source (LinkedIn, referral, cold), company size, role type
- "You apply on Mondays → 40% response rate. Fridays → 11%."
- "Referral applications convert 4x better than cold for you specifically"
- "Resume version 3 gets 2x callbacks for backend roles vs version 1"
- Resume version history stored in DB — upload each version, tag it, track which one works
- **Why it's novel**: Pure structured data analysis on your own behavior. No AI needed — the pattern is in your data.

### 9. Competing Offer War Room
- When you have 2+ offers, activate War Room mode
- Side-by-side structured comparison: base, equity, total comp, vesting, non-compete risk score, benefits, location, company stage
- Equity upside calculator: funding stage + typical exit multiples for that stage
- Non-compete risk score per offer (derived from clause analysis)
- AI surfaces non-obvious factors: "Offer B pays $20k less but has no non-compete, 2x equity, and Series A companies at this stage have historically exited within 4 years"
- Negotiation leverage calculator: "You have a competing offer. Here's the exact script to use it."
- **Why it's novel**: Structured multi-offer comparison with real clause risk scoring — not just salary numbers

### 10. Negotiation Replay + Playbook
- Log your negotiation conversation: what you asked, what they countered, what you said, what you accepted
- Stored as structured data: ask amount, counter amount, outcome, company stage, role level
- Over time across users: "People who countered $10k above initial offer at Series B companies got 73% acceptance rate"
- "Asking for signing bonus before base salary correlates with 15% better total outcomes"
- Pre-negotiation: generates a personalized script based on your offer + competing offers + your history
- **Why it's novel**: Real negotiation outcome data, not generic salary negotiation advice

### 11. Career Debt Score
- Running financial impact tracker of every job search decision
- Calculated from: salary left on table (vs market), bad clauses signed (non-compete risk, IP assignment), equity terms accepted below standard
- "Your career debt from this job search: $47,000 (estimated salary gap) + 2-year non-compete risk"
- Not to shame — to make stakes visceral and drive better decisions next time
- Resets and improves with each new search
- **Why it's novel**: No tool quantifies the cumulative financial cost of bad job search decisions

### 12. Interview Question Network
- Every question you log is tagged by topic, company, round type, outcome
- Builds a personal question bank over time
- Company prep mode: "You're interviewing at Stripe. Based on your logs + anonymized community data, here are the question types Stripe focuses on at each round"
- "Your win rate on behavioral questions: 78%. On system design: 41%. Focus here."
- Spaced repetition: resurfaces questions you got wrong before prep sessions
- **Why it's novel**: Interview prep grounded in your actual performance history, not generic LeetCode

### 13. Shadow Application (Auto-Extract from JD)
- Paste any job URL or JD text
- System auto-extracts: company, role, level, tech stack required, comp signals, red flags in JD language
- JD red flag detection: "No salary range listed (red flag)", "Culture fit mentioned 4 times (red flag)", "Fast-paced environment (high churn signal)"
- Stores structured JD data — queryable: "Which companies in my search mentioned Kafka?" "Which JDs had no salary range?"
- **Why it's novel**: Turns unstructured job descriptions into structured, queryable intelligence

### 14. Search Velocity Dashboard
- Visual timeline of your entire job search
- Metrics: applications per week, response rate trend, interview conversion rate, average time from apply to offer
- Benchmarks against anonymized aggregate data: "Your response rate is 12%. Average for your role/level is 18%. Here's what's different about high-performing applicants."
- Identifies momentum drops: "You haven't applied in 8 days. Your last active streak got you 3 interviews."
- **Why it's novel**: Treats job search like a funnel with real metrics — nobody does this today

### 15. Reference Intelligence
- Store your reference roster: name, relationship, company, what they agreed to say, how many times used
- Log when you gave a reference and for which company
- Track outcomes: did you get the offer after this reference? (correlation, not causation — but useful)
- Prep sheet per reference: "Before listing Sarah for Stripe, here's what to brief her on"
- Alert: "You've used John as a reference 4 times. Consider giving him a break."
- **Why it's novel**: References are a completely blind spot in every job search tool today

---

## Supporting Features

### 16. Resume Version Control
- Upload multiple resume versions, tag by role type (backend, fullstack, senior, lead)
- Link each application to the resume version used
- Ghost Radar uses this to find which version performs best

### 17. Salary Market Intelligence
- Integrated salary benchmarks by role + level + location + company size + funding stage
- Sourced from structured public data (Levels.fyi API, BLS, LinkedIn Salary — where available)
- Your offer benchmarked in real-time: "Your offer is in the 34th percentile for Senior SWE in SF at Series B"

### 18. Timeline & Activity Feed
- Full chronological feed of everything in your job search
- Every email sent, every interview logged, every offer uploaded — one timeline
- Export as PDF for your own records

### 19. Email Drafting Assistant
- Context-aware email drafts at every stage: application follow-up, thank you after interview, negotiation opener, offer decline, acceptance
- Uses your notes + contact info + application context
- Not generic templates — grounded in your actual situation

### 20. Search Health Score
- Weekly score (0–100) based on: application volume, follow-up rate, interview prep activity, response rate
- "Your search health dropped this week. You haven't applied in 5 days and have 3 pending follow-ups."
- Keeps momentum up during a long search

---

## Data Model Summary (Aurora PostgreSQL)

```
users
applications (→ users)
contacts (→ applications)
interview_rounds (→ applications)
interview_questions (→ interview_rounds)
offer_letters (→ applications)
offer_clauses (→ offer_letters)          ← clause database, anonymized across users
resume_versions (→ users)
negotiation_logs (→ offer_letters)
references (→ users)
jd_extractions (→ applications)
follow_ups (→ applications, contacts)
```

The relational depth here is what makes Aurora PostgreSQL the right choice — not a key-value store, not a document DB. Every insight is a JOIN across this schema.

---

## Hackathon Judging Alignment

| Criterion | How JobLens scores |
|---|---|
| Technological Implementation | Aurora PostgreSQL with deep relational schema, Lambda functions, Claude AI for clause extraction, not a simple CRUD app |
| Design | Clean pipeline UI (kanban-style), War Room comparison view, pattern dashboards — each view tells a story |
| Impact & Real-world Applicability | Every professional job seeker is the user. Solves financial decisions worth $10k–$50k per search. |
| Originality | Clause DNA database, Career Debt Score, Ghost Radar, Rejection Forensics — none of these exist anywhere |

# JobLens — App Context for UI Generation

> The job search OS that tracks every application, decodes every offer letter, and tells you exactly where you're losing — so you never negotiate blind or sign a bad contract again.

---

## What We're Building

A B2C job search intelligence platform with 5 core MVP features and novel features that have never been built before.

### MVP Features

| # | Feature | What it does |
|---|---|---|
| 1 | **Application Tracker** | Add jobs manually or paste a URL — auto-extracts company, role, level, salary, tech stack. Kanban pipeline: Applied → Screen → Technical → Final → Offer → Decision |
| 2 | **Interview Logger** | Log every round: type, interviewer, questions asked, outcome. Tag by topic. Spot patterns. |
| 3 | **Offer Letter Analyzer** | Upload PDF → AI extracts and structures every clause → flags non-competes, IP assignment, clawback → rates Green/Yellow/Red → plain English explanations + redline suggestions |
| 4 | **Contact Rolodex + Follow-up Tracker** | Every person you talk to stored and linked to applications. AI drafts follow-up emails with full context. Reminders. |
| 5 | **Search Velocity Dashboard** | Applications per week, response rate trend, interview conversion, time-to-offer. Benchmarked against aggregate data. |

### Novel Features

| # | Feature | Description |
|---|---|---|
| 6 | **Offer Letter DNA** | Every offer letter uploaded contributes anonymized clause data. "This non-compete is in the top 10% most restrictive across 3,000 letters." |
| 7 | **Rejection Forensics** | Structured rejection map. "You've been rejected 4 times at take-home. 3 involved distributed systems." |
| 8 | **Ghost Radar** | Tracks response rate by day applied, resume version, source. "Mondays → 40% response. Fridays → 11%." |
| 9 | **Competing Offer War Room** | Side-by-side comparison: base, equity, vesting, non-compete risk score, upside calculator. |
| 10 | **Negotiation Replay + Playbook** | Log your negotiation. Pre-negotiation script from aggregate data. |
| 11 | **Career Debt Score** | Running financial impact: salary left on table + bad clauses + below-standard equity. |
| 12 | **Shadow Application** | Paste any JD URL → auto-extracts structured data + flags JD red flags. |

---

## Tech Stack

- **Frontend**: Next.js + Tailwind CSS + shadcn/ui
- **Database**: Aurora PostgreSQL
- **Backend**: AWS Lambda (Python)
- **AI**: Claude via AWS Bedrock
- **Auth**: AWS Cognito + NextAuth
- **Storage**: S3

---

## Data Model

```
users
applications          → users
contacts              → applications
interview_rounds      → applications
interview_questions   → interview_rounds
offer_letters         → applications
offer_clauses         → offer_letters
resume_versions       → users
negotiation_logs      → offer_letters
references            → users
jd_extractions        → applications
follow_ups            → applications, contacts
```

---

## Design Direction

- Dark theme
- Clean, data-dense UI — this is a power user tool
- Each view tells a story: kanban for tracking, tables for comparison, charts for patterns
- Color system: Green = good/safe, Yellow = caution/negotiate, Red = flag/risk

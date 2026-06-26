# JobLens — Master Document

> The job search OS that tracks every application, decodes every offer letter, and tells you exactly where you're losing — so you never negotiate blind or sign a bad contract again.

---

## The Problem

White-collar professionals juggling 15–30 job applications have no real tooling. They use Google Sheets, scattered Notion notes, and gut feel. The cost is enormous:

- **$15,000–$50,000** left on the table by not negotiating or negotiating blind
- Non-competes and IP clauses signed without understanding
- The same interview type failed repeatedly without ever knowing it
- No post-mortem — no idea why a 3-month search succeeded or failed

**Existing tools fail them:**

| Tool | Gap |
|---|---|
| Spreadsheets | No intelligence, no patterns |
| LinkedIn | Gives you nothing back |
| Glassdoor / Levels.fyi | Not integrated into your workflow |
| Lawyers | $300/hour, inaccessible |
| ChatGPT | No memory, no structure, no patterns |

**Core insight:** The value is not in any single AI call. It's in accumulation — pattern detection across structured history. **This is a database product, not a chatbot.**

---

## What We're Building

A B2C job search intelligence platform with 5 core MVP features and a set of novel features that have never been built before.

### MVP Features

| # | Feature | What it does |
|---|---|---|
| 1 | **Application Tracker** | Add jobs manually or paste a URL — auto-extracts company, role, level, salary, tech stack. Kanban pipeline: Applied → Screen → Technical → Final → Offer → Decision |
| 2 | **Interview Logger** | Log every round: type, interviewer, questions asked, outcome. Tag by topic. Spot patterns. |
| 3 | **Offer Letter Analyzer** | Upload PDF → AI extracts and structures every clause → flags non-competes, IP assignment, clawback → rates Green/Yellow/Red → plain English explanations + redline suggestions |
| 4 | **Contact Rolodex + Follow-up Tracker** | Every person you talk to stored and linked to applications. AI drafts follow-up emails with full context. Reminders. |
| 5 | **Search Velocity Dashboard** | Applications per week, response rate trend, interview conversion, time-to-offer. Benchmarked against aggregate data. |

### Novel Features (Differentiators)

| # | Feature | Why it's novel |
|---|---|---|
| 6 | **Offer Letter DNA** | Every offer letter uploaded contributes anonymized clause data. "This non-compete is in the top 10% most restrictive across 3,000 letters." Requires accumulated structured data — impossible with a one-shot LLM call. |
| 7 | **Rejection Forensics** | Structured rejection map across your entire search. "You've been rejected 4 times at take-home. 3 involved distributed systems." Turns invisible failure into actionable data. |
| 8 | **Ghost Radar** | Tracks response rate by day applied, resume version, source (cold/referral), company size. "Mondays → 40% response. Fridays → 11%." Pure data analysis on your own behavior. |
| 9 | **Competing Offer War Room** | Side-by-side structured comparison: base, equity, vesting, non-compete risk score, upside calculator. "Offer B pays $20k less but has no non-compete and 2x equity." |
| 10 | **Negotiation Replay + Playbook** | Log your negotiation. Builds aggregate data: "People who countered $10k above initial at Series B got 73% acceptance." Pre-negotiation script from your data. |
| 11 | **Career Debt Score** | Running financial impact: salary left on table + bad clauses signed + below-standard equity. Makes stakes visceral. |
| 12 | **Shadow Application** | Paste any JD URL → auto-extracts structured data + flags JD red flags: no salary range, "fast-paced environment," "culture fit" overuse. |

---

## Tech Stack

| Layer | Technology | Why |
|---|---|---|
| Frontend | **Next.js** (deployed on Vercel) | SSR, fast, great DX, easy deploy |
| Database | **Aurora PostgreSQL** (AWS) | Deep relational schema — every insight is a JOIN. Not key-value, not document. |
| Backend | **AWS Lambda** (Python) | Serverless, scales to zero, integrates natively with Bedrock |
| AI | **Claude via AWS Bedrock** | Clause extraction, pattern summarization, email drafting — no separate API key, uses AWS IAM |
| Auth | **AWS Cognito** | User pools, JWT, integrates with NextAuth |
| Storage | **S3** | Resume PDFs, offer letter uploads |
| Frontend UI (v0) | **v0 by Vercel** | Generate complex UI components fast — kanban board, war room comparison view, dashboards |

---

## Data Model (Aurora PostgreSQL)

```
users
applications          → users
contacts              → applications
interview_rounds      → applications
interview_questions   → interview_rounds
offer_letters         → applications
offer_clauses         → offer_letters        ← anonymized clause DB across all users
resume_versions       → users
negotiation_logs      → offer_letters
references            → users
jd_extractions        → applications
follow_ups            → applications, contacts
```

The relational depth is the product. Every novel feature is a query across this schema.

---

## Using v0 (Vercel)

v0 is ideal for generating the complex UI components in this app. Prompt it with:

**Kanban Application Tracker:**
> "Build a kanban board in Next.js with Tailwind. Columns: Applied, Recruiter Screen, Technical, Final Round, Offer, Accepted, Rejected. Each card shows: company name, role, days since last activity, salary range badge. Cards are draggable between columns."

**Offer Letter Analyzer view:**
> "Build a clause review UI in Next.js. Left side: extracted offer letter text. Right side: list of clauses each with a Green/Yellow/Red badge, plain English explanation, and a 'What to ask them to change' expandable section."

**War Room comparison:**
> "Build a side-by-side offer comparison table in Next.js. Rows: Base Salary, Equity, Vesting Schedule, Cliff, Non-Compete Risk Score (0–10), Total Comp, Location, Company Stage. Two columns, one per offer. Highlight the better value per row."

**Search Velocity Dashboard:**
> "Build a job search analytics dashboard in Next.js with Tailwind. Show: applications per week (bar chart), response rate trend (line chart), funnel from Applied → Offer (funnel chart), and a health score card (0–100 with color coding)."

---

## Team Split (20 Days)

### Me — Core Tracker
| Days | Feature |
|---|---|
| 1–2 | Auth (Cognito + NextAuth) + Vercel deploy pipeline |
| 3–6 | Application Tracker — full CRUD, kanban, status management |
| 7–10 | Interview Logger — rounds, questions, tags, outcomes |
| 11–13 | Contact Rolodex + Follow-up Tracker + email drafting |
| 14–16 | Search Velocity Dashboard — metrics, funnel, benchmarks |
| 17–18 | Polish + integration |
| 19–20 | Demo prep + submission |

### Teammate — Core Intelligence
| Days | Feature |
|---|---|
| 1–2 | Aurora schema + Lambda project scaffold |
| 3–6 | Offer Letter Analyzer — PDF → Claude → clause extraction + risk scoring |
| 7–10 | Rejection Forensics + Ghost Radar — pattern detection |
| 11–13 | Competing Offer War Room — multi-offer comparison |
| 14–16 | Shadow Application — JD URL → structured extraction |
| 17–18 | Polish + integration |
| 19–20 | Demo prep + submission |

### Shared Day 1–2
- Aurora schema design
- API contract (routes + request/response shapes)
- Repo structure + branch strategy + env vars

---

## Environment Variables

See [env-setup.md](../env-setup.md) for all credentials.

```env
DATABASE_URL=postgresql://postgres:...@job-lens-db.cluster-ccnuckwaayns.us-east-1.rds.amazonaws.com:5432/joblens
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
S3_BUCKET=job-lens-uploads
COGNITO_USER_POOL_ID=us-east-1_vSN6WLH2h
COGNITO_REGION=us-east-1
COGNITO_CLIENT_ID=...
COGNITO_CLIENT_SECRET=...
NEXTAUTH_SECRET=...
NEXTAUTH_URL=http://localhost:3000
```

Note: No `ANTHROPIC_API_KEY` needed — Claude is accessed via **AWS Bedrock** using the same IAM credentials.

---

## Hackathon Judging Alignment

| Criterion | How JobLens scores |
|---|---|
| Technical Implementation | Aurora PostgreSQL with deep relational schema, Lambda, Claude via Bedrock — not a simple CRUD app |
| Design | Kanban tracker, War Room comparison, pattern dashboards — each view tells a story |
| Impact | Every professional job seeker is the user. Solves decisions worth $10k–$50k per search. |
| Originality | Clause DNA database, Career Debt Score, Ghost Radar, Rejection Forensics — none of these exist |

# JobLens — Problem Statement

## Who is suffering

A software engineer (or any white-collar professional) actively job hunting. Juggling 15–30 applications simultaneously, across multiple companies, multiple rounds, multiple recruiters. Doing this mostly alone, with no tooling designed for them.

## What their life actually looks like

- Applications tracked in a Google Sheet: Company | Role | Applied | Status | Notes — manually updated, always out of date
- Interview feedback stored nowhere — they forget what was asked, can't spot patterns
- Offer letters opened in a PDF viewer, skimmed in 20 minutes, signed under pressure
- Salary negotiation done on gut feel — no grounded data on their specific role + level + location + company
- Non-competes, IP assignment clauses, clawback provisions — signed without understanding
- Follow-up emails drafted from scratch every time
- No post-mortem: after 3 months of searching they have no idea why they succeeded or failed

## What this costs them — concretely

- Leaving $15,000–$50,000 on the table by not negotiating (or negotiating blind)
- Signing non-competes that block their next move
- Failing the same interview type repeatedly without realizing it
- Missing follow-up windows because nothing reminded them
- IP assignment clauses that mean their side projects belong to their employer

## Why nothing solves this today

| Tool | What it does | What's missing |
|---|---|---|
| Spreadsheets | Tracks applications | No intelligence, no reminders, no analysis |
| Notion/Obsidian | Flexible notes | No structure, no AI, no pattern detection |
| LinkedIn | Tracks applications | Gives you nothing back |
| Glassdoor/Levels.fyi | Salary data | Not integrated into your workflow, no personal context |
| Lawyers | Reviews offer letters | $300/hour, inaccessible to most |
| ChatGPT | Answers questions | No memory of your history, no structured data, no patterns |

## The core insight

The value is not in any single AI call. It's in the accumulation:

- Pattern detection requires structured history across all your applications
- Offer letter analysis gets better as the system sees thousands of clauses across companies
- Salary benchmarking is only meaningful when grounded in structured data
- Your negotiation leverage comes from knowing your own data cold

**This is a database product, not a chatbot.**

## In one sentence

> Job seekers make the most consequential financial decisions of their lives — where to work, what to sign, what to ask for — with no structured data, no pattern awareness, and no expert guidance, and they pay for it for years.

## Real Scenarios

### The Non-Compete Trap
Priya signs an offer in 48 hours. 18 months later she wants to leave for a competitor. She signed a 2-year non-compete covering "any company in the web development space." She either stays in a job she hates or pays $8,000 in legal fees.
**JobLens flags this the moment she uploads the offer letter.**

### The Invisible Pattern
Arjun reaches final rounds at 6 companies, gets rejected at all 6. He's been failing system design rounds every time — specifically distributed systems. He doesn't know this because his notes are scattered across Notion, WhatsApp, and memory.
**JobLens surfaces this in week 3, not month 4.**

### The $40,000 Mistake
Sarah negotiates base from $180k to $185k. Feels good. She had no idea the same company paid $40k more for the same role 6 months ago — data sitting in the clause database from other users.
**JobLens shows her the full picture before she counters.**

### The Ghost
Marcus's follow-up emails are one line: "Just checking in!" The 3 applications where he wrote substantive follow-ups all converted. He doesn't know this pattern.
**JobLens tracks every follow-up and shows him his own conversion data.**

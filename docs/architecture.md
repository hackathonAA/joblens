# JobLens — System Architecture

## Overview

JobLens is a full-stack AI-powered job-search tracker built on Next.js 15 (App Router), deployed on Vercel, with AWS as the cloud backend. Every AI feature calls Amazon Bedrock (Nova Pro). Identity is handled entirely by AWS Cognito via OAuth2/OIDC, bridged to the app through NextAuth.js. Data lives in an Aurora PostgreSQL database accessed through Drizzle ORM.

---

## 1. High-Level System Flow

```mermaid
flowchart TD
    Browser["Browser\n(React / Next.js 15 App Router)"]

    subgraph Vercel["Vercel Edge / Serverless"]
        NextApp["Next.js App Router\nServer Components + API Routes"]
        NextAuth["NextAuth.js\nJWT · CognitoProvider"]
    end

    subgraph AWS["Amazon Web Services"]
        Cognito["AWS Cognito\nUser Pool · OAuth2/OIDC\nHosted UI Login"]
        Bedrock["AWS Bedrock\namazon.nova-pro-v1:0\n(Amazon Nova Pro)"]
        Aurora["Aurora PostgreSQL\n(postgres-js · SSL)\nDrizzle ORM"]
        S3["Amazon S3\nOffer Letter PDFs\nResume Versions"]
    end

    Browser -->|"HTTPS requests\n(pages + API)"| NextApp
    Browser -->|"Auth redirect"| Cognito
    Cognito -->|"OAuth2 callback\nid_token + access_token"| NextAuth
    NextAuth -->|"JWT session cookie"| Browser
    NextApp -->|"DB queries"| Aurora
    NextApp -->|"InvokeModel API"| Bedrock
    NextApp -->|"PDF upload / presigned URL"| S3
```

---

## 2. Authentication Flow

```mermaid
sequenceDiagram
    actor User
    participant Browser
    participant NextAuth as NextAuth.js
    participant Cognito as AWS Cognito
    participant DB as Aurora PostgreSQL

    User->>Browser: Visit /login
    Browser->>NextAuth: GET /api/auth/signin
    NextAuth->>Cognito: Redirect to Hosted UI (OAuth2 authorize)
    User->>Cognito: Enter credentials
    Cognito-->>NextAuth: Callback with code
    NextAuth->>Cognito: Exchange code → id_token + access_token
    NextAuth->>DB: signIn callback — upsert user row\n(cognitoSub, email, name)
    NextAuth-->>Browser: Set JWT session cookie
    Browser->>Browser: Redirect to /
```

---

## 3. Frontend Architecture

```mermaid
flowchart TD
    subgraph Providers["React Context Providers (app/layout.tsx)"]
        SP["SessionProvider\n(NextAuth)"]
        CP["CurrencyProvider\n(display currency)"]
        ColP["ColumnsProvider\n(Kanban columns from DB)"]
    end

    subgraph Pages["Application Pages"]
        Tracker["/ — Tracker\nKanban Board\n@dnd-kit drag-drop"]
        Dashboard["/dashboard\nStats · Charts · AI Insights"]
        WarRoom["/war-room\nOffer Comparison · Negotiation"]
        Interviews["/interview-logger\nRound Logger · Q&A · Confidence"]
        JDAnalyzer["/jd-analyzer\nJD Parser · Fit Score"]
        OfferAnalyzer["/offer-analyzer\nClause Risk · PDF Upload"]
        Profile["/profile\nUser Profile · Target Role"]
    end

    subgraph Components["Shared Components"]
        KanbanBoard["KanbanBoard\nDndContext · StageSection"]
        JobCard["JobCard\nDraggable · Edit · Outreach"]
        OutreachModal["OutreachModal\nCold Email · LinkedIn DM"]
        AddCardModal["AddCardModal"]
        ColumnEditorModal["ColumnEditorModal"]
        AppSidebar["AppSidebar\nNav · Currency · User"]
        Charts["Charts\nRecharts — Bar · Line · Funnel"]
    end

    Providers --> Pages
    Pages --> Components
```

---

## 4. API Routes & Backend Logic

```mermaid
flowchart LR
    subgraph AuthAPI["Auth"]
        AuthRoute["/api/auth/[...nextauth]"]
    end

    subgraph CoreAPI["Core Data APIs"]
        AppsCRUD["/api/applications\nGET · POST"]
        AppPatch["/api/applications/[id]\nPATCH · DELETE"]
        Columns["/api/columns\nGET · POST · PATCH · DELETE"]
        Profile["/api/profile\nGET · PATCH"]
        Offers["/api/offers\nGET · POST · DELETE"]
        Contacts["/api/contacts\nGET · POST · PATCH"]
        Interviews["/api/interviews\nGET · POST · PATCH"]
        FollowUps["/api/follow-ups\nGET · POST"]
        Dashboard["/api/dashboard\nGET — analytics"]
        ExtractPDF["/api/extract-pdf\nPOST — PDF text"]
    end

    subgraph AIAPI["AI-Powered APIs (→ AWS Bedrock)"]
        AnalyzeJD["/api/analyze-jd\nJD Parser · Fit Score · Skill Gap"]
        AnalyzeOffer["/api/analyze-offer\nClause Risk · Redline · Comp Summary"]
        Outreach["/api/applications/[id]/outreach\nCold Email · LinkedIn DM"]
        FollowupDraft["/api/applications/[id]/followup-draft\nFollow-up Email Draft"]
        WarRoomInsights["/api/war-room-insights\nOffer Compare · Negotiation Tips"]
        Confidence["/api/interviews/[id]/confidence\nRound Confidence Score 0-100"]
    end

    DB[(Aurora PostgreSQL)]
    Bedrock{{AWS Bedrock\nNova Pro}}

    CoreAPI --> DB
    AuthRoute --> DB
    AIAPI --> Bedrock
    AIAPI --> DB
```

---

## 5. AI Features Detail

```mermaid
flowchart TD
    Bedrock{{AWS Bedrock\namazon.nova-pro-v1:0}}

    JD["JD Analyzer\n/api/analyze-jd"]
    Offer["Offer Analyzer\n/api/analyze-offer"]
    Outreach["Cold Outreach\n/api/applications/id/outreach"]
    Followup["Follow-up Draft\n/api/applications/id/followup-draft"]
    WarRoom["War Room\n/api/war-room-insights"]
    Confidence["Interview Confidence\n/api/interviews/id/confidence"]

    JD -->|"JD text + user profile\n→ tech stack, fit score, skill gap,\nred flags, seniority signals"| Bedrock
    Offer -->|"Offer letter text\n→ clause risk (green/yellow/red),\nredline suggestions, comp summary"| Bedrock
    Outreach -->|"Company + role + user bio\n→ cold email subject+body,\nLinkedIn DM"| Bedrock
    Followup -->|"Application context + days stale\n→ follow-up email draft"| Bedrock
    WarRoom -->|"Multiple offer letters\n→ comparison table,\nnegotiation tips"| Bedrock
    Confidence -->|"Interview round notes + Q&A\n→ confidence score 0-100,\nreason + recommended focus"| Bedrock
```

---

## 6. Database Schema (Entity-Relationship)

```mermaid
erDiagram
    users {
        uuid id PK
        text cognito_sub UK
        text email UK
        text name
        text username
        text headline
        text location
        text bio
        text target_role
        integer target_salary_min
        integer target_salary_max
    }

    applications {
        uuid id PK
        uuid user_id FK
        text company
        text role
        text level
        text status
        text job_url
        text job_description
        text notes
        integer salary_min
        integer salary_max
        timestamp applied_at
        timestamp updated_at
    }

    kanban_columns {
        uuid id PK
        uuid user_id FK
        text column_key
        text title
        integer position
        boolean is_default
        boolean is_rejected
        boolean is_offer_stage
        boolean is_interview_eligible
    }

    interview_rounds {
        uuid id PK
        uuid application_id FK
        text round_type
        text outcome
        integer confidence_score
        text confidence_reason
        text overall_experience
        timestamp scheduled_at
    }

    interview_questions {
        uuid id PK
        uuid round_id FK
        text question
        text topic_tag
        text what_i_said
        text ai_answer
        integer rating
        text ai_rating_reason
    }

    offer_letters {
        uuid id PK
        uuid application_id FK
        text raw_text
        text s3_key
        integer base_salary
        integer equity_value
        integer signing_bonus
        text vesting_schedule
        date start_date
    }

    offer_clauses {
        uuid id PK
        uuid offer_letter_id FK
        text clause_type
        text clause_text
        text risk_level
        text plain_english
        text redline_suggestion
    }

    negotiation_logs {
        uuid id PK
        uuid offer_letter_id FK
        integer ask_amount
        integer counter_amount
        text outcome
        text notes
    }

    jd_extractions {
        uuid id PK
        uuid application_id FK
        text[] tech_stack
        text[] required_skills
        text[] nice_to_have_skills
        text[] red_flags
        integer fit_score
        text fit_reason
        text salary_signals
    }

    contacts {
        uuid id PK
        uuid user_id FK
        uuid application_id FK
        text name
        text title
        text company
        text linkedin_url
        text email
    }

    follow_ups {
        uuid id PK
        uuid application_id FK
        uuid contact_id FK
        text subject
        text body
        timestamp due_at
        timestamp sent_at
    }

    resume_versions {
        uuid id PK
        uuid user_id FK
        text version_name
        text s3_key
        text role_type
    }

    users ||--o{ applications : "tracks"
    users ||--o{ kanban_columns : "configures"
    users ||--o{ contacts : "networks"
    users ||--o{ resume_versions : "stores"
    applications ||--o{ interview_rounds : "has"
    applications ||--o{ offer_letters : "receives"
    applications ||--o{ jd_extractions : "analyzed via"
    applications ||--o{ contacts : "linked to"
    applications ||--o{ follow_ups : "has"
    interview_rounds ||--o{ interview_questions : "contains"
    offer_letters ||--o{ offer_clauses : "broken into"
    offer_letters ||--o{ negotiation_logs : "negotiated via"
    contacts ||--o{ follow_ups : "referenced in"
```

---

## 7. Data Flow — Kanban Board

```mermaid
sequenceDiagram
    participant User
    participant Browser as Browser (KanbanBoard)
    participant API as Next.js API Routes
    participant DB as Aurora PostgreSQL

    Browser->>API: GET /api/columns
    API->>DB: SELECT kanban_columns WHERE user_id=...
    DB-->>API: column rows
    API-->>Browser: JSON columns (ordered by position)

    Browser->>API: GET /api/applications
    API->>DB: SELECT applications WHERE user_id=...
    DB-->>API: application rows
    API-->>Browser: JSON cards

    User->>Browser: Drag card to new column
    Browser->>Browser: Optimistic UI update (setCards)
    Browser->>API: PATCH /api/applications/[id] {status: newColumnKey}
    API->>DB: UPDATE applications SET status=... WHERE id=...
    DB-->>API: updated row
    API-->>Browser: 200 OK
```

---

## 8. Deployment Architecture

```mermaid
flowchart TD
    subgraph Internet
        User["End User\nBrowser"]
    end

    subgraph Vercel["Vercel (Edge Network + Serverless)"]
        Edge["Edge Middleware\n(auth guard / redirect)"]
        SSR["Next.js SSR\nServer Components"]
        APIFn["API Route Handlers\n(Node.js Serverless Functions)"]
    end

    subgraph AWS["AWS (us-east-1)"]
        Cognito["Cognito User Pool\nHosted UI · OAuth2"]
        Aurora["Aurora PostgreSQL\nServerless v2"]
        Bedrock["Bedrock\namazon.nova-pro-v1:0"]
        S3["S3 Bucket\nOffer PDFs · Resumes"]
    end

    User -->|"HTTPS"| Edge
    Edge --> SSR
    Edge --> APIFn
    SSR --> Aurora
    APIFn --> Aurora
    APIFn --> Bedrock
    APIFn --> S3
    User <-->|"OAuth2 Redirect"| Cognito
    Cognito -->|"Callback"| APIFn
```

---

## Rendering the Diagrams

### Option 1 — GitHub / GitLab (zero setup)
Push this file. Both GitHub and GitLab render Mermaid fenced code blocks natively in Markdown previews.

### Option 2 — VS Code
Install the **Mermaid Preview** extension (`bierner.markdown-mermaid`), then open this file and use `Ctrl+Shift+V` / `Cmd+Shift+V`.

### Option 3 — Mermaid CLI (PNG/SVG export)

```bash
# Install
npm install -g @mermaid-js/mermaid-cli

# Export a single diagram (extract the mermaid block to a .mmd file first)
mmdc -i diagram.mmd -o architecture.png -t dark -b transparent

# Or use the helper script below
node docs/render-diagrams.js
```

### Option 4 — Mermaid Live Editor
Paste any diagram block at [mermaid.live](https://mermaid.live) for instant preview and PNG/SVG export.

---

## Tech Stack Summary

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router, Turbopack) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 (OKLCH color tokens) |
| Drag & Drop | @dnd-kit/core |
| Charts | Recharts |
| Auth | NextAuth.js + AWS Cognito (OAuth2/OIDC) |
| ORM | Drizzle ORM |
| Database | Aurora PostgreSQL (postgres-js, SSL) |
| AI | AWS Bedrock — amazon.nova-pro-v1:0 (Nova Pro) |
| Storage | Amazon S3 (PDFs, resumes) |
| Deployment | Vercel (Edge + Serverless) |

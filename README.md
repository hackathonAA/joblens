# JobLens — Job Search OS

A full-stack job search intelligence platform. Track applications, analyze offer letters with AI, compare competing offers, and log interview rounds — all in one place.

---

## Features

| Feature | Description |
|---------|-------------|
| **Kanban Tracker** | Drag-and-drop pipeline with customizable columns per user (Tech, Sales, Finance presets) |
| **Offer Analyzer** | Upload or paste an offer letter — Claude AI extracts clauses with risk ratings and plain-English explanations |
| **War Room** | Side-by-side offer comparison with live editing, equity upside estimates, and a negotiation playbook |
| **Dashboard** | Real-time analytics — response rate, interview conversion, funnel, weekly velocity, and AI-generated insights |
| **Interview Logger** | Log rounds per application, track outcomes, build a searchable question bank |
| **User Profile** | Name, username, headline, location, bio, LinkedIn/GitHub, target role and salary range |

---

## Tech Stack

- **Frontend**: Next.js 16 (App Router), Tailwind CSS, shadcn/ui, @dnd-kit
- **Backend**: Next.js API routes, Drizzle ORM
- **Database**: Aurora PostgreSQL (AWS RDS)
- **Auth**: AWS Cognito + NextAuth v4
- **AI**: AWS Bedrock (Amazon Nova Pro / Claude)
- **Storage**: AWS S3
- **Charts**: Recharts

---

## Getting Started

### 1. Clone and install

```bash
git clone https://github.com/adsap2000/job-lens.git
cd job-lens/job-search-os
npm install
```

### 2. Set up AWS resources

Follow the full setup guide: [`docs/aws-setup-guide.md`](docs/aws-setup-guide.md)

You'll need:
- Aurora PostgreSQL cluster
- S3 bucket
- IAM user with S3, RDS, Bedrock permissions
- Cognito user pool with hosted UI

### 3. Run the schema

Connect to your Aurora DB and run [`docs/schema.sql`](docs/schema.sql), then run the kanban_columns table:

```sql
CREATE TABLE kanban_columns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  column_key TEXT NOT NULL,
  title TEXT NOT NULL,
  position INTEGER NOT NULL,
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  is_rejected BOOLEAN NOT NULL DEFAULT FALSE,
  is_interview_eligible BOOLEAN NOT NULL DEFAULT FALSE,
  is_offer_stage BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, column_key)
);
```

### 4. Configure environment

Create `job-search-os/.env.local`:

```env
# Database
DATABASE_URL=postgresql://postgres:<password>@<cluster-endpoint>:5432/joblens

# AWS
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=<your_access_key>
AWS_SECRET_ACCESS_KEY=<your_secret_key>
S3_BUCKET=job-lens-uploads

# Cognito (server-side)
COGNITO_USER_POOL_ID=us-east-1_XXXXXXXXX
COGNITO_CLIENT_ID=<your_client_id>
COGNITO_CLIENT_SECRET=<your_client_secret>
COGNITO_REGION=us-east-1
COGNITO_DOMAIN=<your_domain_prefix>

# Cognito (client-side)
NEXT_PUBLIC_COGNITO_DOMAIN=<your_domain_prefix>
NEXT_PUBLIC_COGNITO_CLIENT_ID=<your_client_id>
NEXT_PUBLIC_COGNITO_REGION=us-east-1
NEXT_PUBLIC_APP_URL=http://localhost:3000

# NextAuth
NEXTAUTH_SECRET=<run: openssl rand -base64 32>
NEXTAUTH_URL=http://localhost:3000
```

### 5. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — sign in with Cognito to get started.

---

## Project Structure

```
job-search-os/
├── app/
│   ├── api/                  # API routes (applications, columns, offers, interviews, dashboard, profile)
│   ├── dashboard/            # Dashboard page
│   ├── interview-logger/     # Interview logger page
│   ├── offer-analyzer/       # Offer analyzer page
│   ├── profile/              # User profile page
│   ├── war-room/             # War room page
│   └── page.tsx              # Kanban tracker (home)
├── components/               # React components
├── lib/
│   ├── db.ts                 # Drizzle DB client
│   ├── schema.ts             # Database schema
│   ├── column-defaults.ts    # Column seeding (server)
│   ├── column-presets.ts     # Column preset data (client-safe)
│   └── columns-context.tsx   # React context for dynamic columns
└── docs/
    ├── schema.sql            # Full DB schema
    └── aws-setup-guide.md    # AWS setup walkthrough
```

---

## Deployment (Vercel)

1. Push to GitHub
2. Import repo in [vercel.com](https://vercel.com)
3. Add all env vars from `.env.local` in the Vercel dashboard
4. Set `NEXTAUTH_URL` and `NEXT_PUBLIC_APP_URL` to your Vercel URL
5. In Cognito, add your Vercel URL to:
   - Allowed callback URLs: `https://your-app.vercel.app/api/auth/callback/cognito`
   - Allowed sign-out URLs: `https://your-app.vercel.app/login`
6. Deploy

---

## Architecture

```
Browser
  └── Next.js (Vercel)
        ├── NextAuth ──────────► AWS Cognito (auth)
        ├── API routes ────────► Aurora PostgreSQL (data)
        ├── Offer analysis ────► AWS Bedrock / Amazon Nova Pro (AI)
        └── File uploads ──────► AWS S3
```

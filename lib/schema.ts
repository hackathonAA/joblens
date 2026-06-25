import { pgTable, uuid, text, integer, boolean, timestamp, date } from "drizzle-orm/pg-core"

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  cognitoSub: text("cognito_sub").unique().notNull(),
  email: text("email").unique().notNull(),
  name: text("name"),
  username: text("username").unique(),
  headline: text("headline"),         // e.g. "Senior Software Engineer"
  location: text("location"),
  bio: text("bio"),
  linkedinUrl: text("linkedin_url"),
  githubUrl: text("github_url"),
  targetRole: text("target_role"),    // e.g. "Staff Engineer"
  targetSalaryMin: integer("target_salary_min"),
  targetSalaryMax: integer("target_salary_max"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
})

export const applications = pgTable("applications", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  company: text("company").notNull(),
  role: text("role").notNull(),
  level: text("level"),
  location: text("location"),
  salaryMin: integer("salary_min"),
  salaryMax: integer("salary_max"),
  status: text("status").notNull().default("applied"),
  jobUrl: text("job_url"),
  jobDescription: text("job_description"),
  notes: text("notes"),
  appliedAt: timestamp("applied_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
})

export const contacts = pgTable("contacts", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  applicationId: uuid("application_id").references(() => applications.id, { onDelete: "set null" }),
  name: text("name").notNull(),
  title: text("title"),
  company: text("company"),
  linkedinUrl: text("linkedin_url"),
  email: text("email"),
  howMet: text("how_met"),
  lastContactAt: timestamp("last_contact_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
})

export const interviewRounds = pgTable("interview_rounds", {
  id: uuid("id").primaryKey().defaultRandom(),
  applicationId: uuid("application_id").notNull().references(() => applications.id, { onDelete: "cascade" }),
  roundType: text("round_type").notNull(),
  interviewerName: text("interviewer_name"),
  interviewerTitle: text("interviewer_title"),
  scheduledAt: timestamp("scheduled_at", { withTimezone: true }),
  outcome: text("outcome"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
})

export const interviewQuestions = pgTable("interview_questions", {
  id: uuid("id").primaryKey().defaultRandom(),
  roundId: uuid("round_id").notNull().references(() => interviewRounds.id, { onDelete: "cascade" }),
  question: text("question").notNull(),
  topicTag: text("topic_tag"),
  whatISaid: text("what_i_said"),
  whatIShouldHaveSaid: text("what_i_should_have_said"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
})

export const offerLetters = pgTable("offer_letters", {
  id: uuid("id").primaryKey().defaultRandom(),
  applicationId: uuid("application_id").notNull().references(() => applications.id, { onDelete: "cascade" }),
  rawText: text("raw_text"),
  s3Key: text("s3_key"),
  baseSalary: integer("base_salary"),
  equityValue: integer("equity_value"),
  vestingSchedule: text("vesting_schedule"),
  cliffMonths: integer("cliff_months"),
  signingBonus: integer("signing_bonus"),
  startDate: date("start_date"),
  analyzedAt: timestamp("analyzed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
})

export const offerClauses = pgTable("offer_clauses", {
  id: uuid("id").primaryKey().defaultRandom(),
  offerLetterId: uuid("offer_letter_id").notNull().references(() => offerLetters.id, { onDelete: "cascade" }),
  clauseType: text("clause_type").notNull(),
  clauseText: text("clause_text"),
  riskLevel: text("risk_level").notNull().default("green"),
  plainEnglish: text("plain_english"),
  redlineSuggestion: text("redline_suggestion"),
  isAnonymized: boolean("is_anonymized").default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
})

export const resumeVersions = pgTable("resume_versions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  versionName: text("version_name").notNull(),
  s3Key: text("s3_key"),
  roleType: text("role_type"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
})

export const negotiationLogs = pgTable("negotiation_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  offerLetterId: uuid("offer_letter_id").notNull().references(() => offerLetters.id, { onDelete: "cascade" }),
  askAmount: integer("ask_amount"),
  counterAmount: integer("counter_amount"),
  outcome: text("outcome"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
})

export const followUps = pgTable("follow_ups", {
  id: uuid("id").primaryKey().defaultRandom(),
  applicationId: uuid("application_id").notNull().references(() => applications.id, { onDelete: "cascade" }),
  contactId: uuid("contact_id").references(() => contacts.id, { onDelete: "set null" }),
  dueAt: timestamp("due_at", { withTimezone: true }).notNull(),
  subject: text("subject"),
  body: text("body"),
  sentAt: timestamp("sent_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
})

export const jdExtractions = pgTable("jd_extractions", {
  id: uuid("id").primaryKey().defaultRandom(),
  applicationId: uuid("application_id").notNull().references(() => applications.id, { onDelete: "cascade" }),
  techStack: text("tech_stack").array(),
  senioritySignals: text("seniority_signals").array(),
  redFlags: text("red_flags").array(),
  salarySignals: text("salary_signals"),
  rawJd: text("raw_jd"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
})

export const kanbanColumns = pgTable("kanban_columns", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  columnKey: text("column_key").notNull(),
  title: text("title").notNull(),
  position: integer("position").notNull(),
  isDefault: boolean("is_default").notNull().default(false),
  isRejected: boolean("is_rejected").notNull().default(false),
  isInterviewEligible: boolean("is_interview_eligible").notNull().default(false),
  isOfferStage: boolean("is_offer_stage").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
})

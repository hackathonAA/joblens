export type RiskLevel = "green" | "yellow" | "red"

export type Clause = {
  id: string
  name: string
  risk: RiskLevel
  explanation: string
  redline: string
  /** Substring of the offer text this clause maps to, used for highlighting */
  excerpt: string
}

export const RISK_CONFIG: Record<
  RiskLevel,
  { label: string; dot: string; badge: string; highlight: string }
> = {
  green: {
    label: "Standard",
    dot: "bg-emerald-500",
    badge: "bg-emerald-500/15 text-emerald-400 ring-1 ring-inset ring-emerald-500/25",
    highlight: "bg-emerald-500/10 ring-1 ring-emerald-500/20",
  },
  yellow: {
    label: "Negotiate",
    dot: "bg-amber-500",
    badge: "bg-amber-500/15 text-amber-400 ring-1 ring-inset ring-amber-500/25",
    highlight: "bg-amber-500/10 ring-1 ring-amber-500/20",
  },
  red: {
    label: "Flag Before Signing",
    dot: "bg-red-500",
    badge: "bg-red-500/15 text-red-400 ring-1 ring-inset ring-red-500/25",
    highlight: "bg-red-500/10 ring-1 ring-red-500/20",
  },
}

export const OFFER_META = {
  company: "Northwind AI",
  stage: "Series B",
  role: "Senior Software Engineer",
  base: "$185,000",
  equity: "0.18% (40,000 options)",
  date: "March 3, 2026",
}

/**
 * The raw offer letter text. Paragraphs that map to a clause embed the
 * clause's `excerpt` verbatim so the left panel can highlight them.
 */
export const OFFER_TEXT = `Northwind AI, Inc.
548 Market Street, San Francisco, CA 94104

March 3, 2026

Dear Candidate,

We are thrilled to extend an offer of employment for the position of Senior Software Engineer, reporting to the VP of Engineering. We believe your skills will be invaluable as we scale our platform.

COMPENSATION. Your annual base salary will be $185,000, paid semi-monthly in accordance with the Company's standard payroll practices, less applicable withholdings. You will also be eligible for a discretionary annual performance bonus targeted at 10% of base salary.

EQUITY. Subject to Board approval, you will be granted an option to purchase 40,000 shares of common stock, representing approximately 0.18% of the Company on a fully-diluted basis. The shares shall vest over four (4) years, with twenty-five percent (25%) vesting after twelve (12) months of continuous service, and the remainder vesting in equal monthly installments thereafter.

INTELLECTUAL PROPERTY. You agree that all inventions, discoveries, and works of authorship that you conceive or develop, whether or not during working hours and whether or not using Company resources, shall be the sole and exclusive property of the Company. This assignment includes any work product created during your employment.

NON-COMPETITION. For a period of twelve (12) months following the termination of your employment for any reason, you agree not to engage in, be employed by, or provide services to any business that competes with the Company anywhere in the United States.

CLAWBACK. In the event the Company determines, in its sole discretion, that you have engaged in misconduct, the Company reserves the right to recover any bonus or equity compensation paid or vested during the preceding twenty-four (24) month period.

DISPUTE RESOLUTION. Any dispute arising out of or relating to this Agreement or your employment shall be resolved exclusively through final and binding arbitration administered in San Francisco, California. You waive any right to a trial by jury or to participate in a class action.

AT-WILL EMPLOYMENT. Your employment with the Company is at-will, meaning that either you or the Company may terminate the employment relationship at any time, with or without cause and with or without notice.

We are excited about the prospect of you joining the team. This offer is contingent upon successful completion of a background check and your execution of the Company's standard Confidential Information and Invention Assignment Agreement.

Sincerely,
The Northwind AI Team`

export const CLAUSES: Clause[] = [
  {
    id: "vesting",
    name: "Vesting Schedule",
    risk: "green",
    explanation:
      "Your stock options unlock over four years, and you must stay a full year before any of it is yours. After that one-year mark you get 25% at once, then a little more every month. This is the standard setup almost every startup uses.",
    redline:
      "Nothing to change here — this is the market-standard 4-year vest with a 1-year cliff. If anything, you could ask whether they offer early exercise to start the capital-gains clock sooner.",
    excerpt:
      "The shares shall vest over four (4) years, with twenty-five percent (25%) vesting after twelve (12) months of continuous service, and the remainder vesting in equal monthly installments thereafter.",
  },
  {
    id: "at-will",
    name: "At-Will Employment",
    risk: "green",
    explanation:
      "Either you or the company can end the job at any time, for almost any reason. This is normal in nearly every U.S. tech offer and isn't a red flag on its own.",
    redline:
      "Generally fine to accept as-is. If you want protection, you can ask for a severance provision (e.g. 2–3 months pay) if you're let go without cause, but most companies won't add this at this level.",
    excerpt:
      "Your employment with the Company is at-will, meaning that either you or the Company may terminate the employment relationship at any time, with or without cause and with or without notice.",
  },
  {
    id: "clawback",
    name: "Clawback",
    risk: "yellow",
    explanation:
      "If the company decides — on its own — that you did something wrong, it can take back bonuses and vested equity from the last two years. The problem is they get to define 'misconduct' however they want.",
    redline:
      "Ask them to narrow this to financial restatements or proven fraud, not 'sole discretion.' Request that 'misconduct' be defined in writing and that any clawback require a finding of cause, not a unilateral company decision.",
    excerpt:
      "the Company reserves the right to recover any bonus or equity compensation paid or vested during the preceding twenty-four (24) month period.",
  },
  {
    id: "arbitration",
    name: "Mandatory Arbitration",
    risk: "yellow",
    explanation:
      "You give up your right to sue in court or join a class action. Any disagreement goes to a private arbitrator that the company's process selects. This is increasingly common but it does limit your options if something goes wrong.",
    redline:
      "Ask to carve out claims that can't legally be forced into arbitration (e.g. harassment/discrimination, which many states now exempt) and request that the company pays all arbitration fees.",
    excerpt:
      "Any dispute arising out of or relating to this Agreement or your employment shall be resolved exclusively through final and binding arbitration",
  },
  {
    id: "non-compete",
    name: "Non-Compete",
    risk: "red",
    explanation:
      "For a full year after you leave, you can't work for any competitor anywhere in the country. This is extremely broad — and in California, where this company is based, non-competes are generally unenforceable. Signing it can still chill your next move even if a court wouldn't uphold it.",
    redline:
      "Push to strike this entirely given the California location. If they insist, cap it at a short non-solicit of customers/employees rather than a blanket non-compete, and limit the duration to 3–6 months with defined competitors.",
    excerpt:
      "you agree not to engage in, be employed by, or provide services to any business that competes with the Company anywhere in the United States.",
  },
  {
    id: "ip-assignment",
    name: "IP Assignment",
    risk: "red",
    explanation:
      "The company claims ownership of everything you create — even on your own time, on your own laptop, unrelated to your job. That could sweep up a weekend side project or open-source work. California law (Labor Code 2870) actually protects personal projects, so this clause is overreaching.",
    redline:
      "Insist on a carve-out for inventions developed on your own time without company resources and unrelated to the business, with the explicit Labor Code 2870 language. Add a Schedule A listing any prior inventions you want excluded.",
    excerpt:
      "all inventions, discoveries, and works of authorship that you conceive or develop, whether or not during working hours and whether or not using Company resources, shall be the sole and exclusive property of the Company.",
  },
]

export function riskCounts(clauses: Clause[]) {
  return clauses.reduce(
    (acc, c) => {
      acc[c.risk] += 1
      return acc
    },
    { green: 0, yellow: 0, red: 0 } as Record<RiskLevel, number>,
  )
}

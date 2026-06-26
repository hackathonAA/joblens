export type CompanyStage = "Seed" | "Series A" | "Series B" | "Public"

export type Offer = {
  id: string
  company: string
  role: string
  stage: CompanyStage
  initials: string
  /** Tailwind classes for the logo placeholder */
  logo: string
  baseSalary: number
  /** Total equity dollar value at current preferred price */
  equityValue: number
  vesting: string
  cliff: string
  signingBonus: number
  /** 0 = no risk, 10 = brutal non-compete */
  nonCompeteRisk: number
  /** 0–10 */
  benefitsScore: number
  upside: { low: number; mid: number; high: number }
}

export type Recommendation = "Strong Take" | "Lean Take" | "Negotiate First"

export const STAGE_RANK: Record<CompanyStage, number> = {
  Seed: 0,
  "Series A": 1,
  "Series B": 2,
  Public: 3,
}

export const SAMPLE_OFFERS: Offer[] = [
  {
    id: "meta",
    company: "Meta",
    role: "E5 Software Engineer",
    stage: "Public",
    initials: "M",
    logo: "bg-blue-500/15 text-blue-400 ring-1 ring-inset ring-blue-500/25",
    baseSalary: 232000,
    equityValue: 360000,
    vesting: "4 yr (16/28/28/28)",
    cliff: "1 year",
    signingBonus: 50000,
    nonCompeteRisk: 1,
    benefitsScore: 9,
    upside: { low: 320000, mid: 360000, high: 410000 },
  },
  {
    id: "northwind",
    company: "Northwind AI",
    role: "Senior Software Engineer",
    stage: "Series B",
    initials: "N",
    logo: "bg-emerald-500/15 text-emerald-400 ring-1 ring-inset ring-emerald-500/25",
    baseSalary: 185000,
    equityValue: 220000,
    vesting: "4 yr (25/mo)",
    cliff: "1 year",
    signingBonus: 25000,
    nonCompeteRisk: 8,
    benefitsScore: 6,
    upside: { low: 0, mid: 480000, high: 2100000 },
  },
]

export const EXTRA_OFFER: Offer = {
  id: "lumen",
  company: "Lumen Labs",
  role: "Founding Engineer",
  stage: "Series A",
  initials: "L",
  logo: "bg-amber-500/15 text-amber-400 ring-1 ring-inset ring-amber-500/25",
  baseSalary: 170000,
  equityValue: 140000,
  vesting: "4 yr (25/mo)",
  cliff: "1 year",
  signingBonus: 15000,
  nonCompeteRisk: 3,
  benefitsScore: 5,
  upside: { low: 0, mid: 620000, high: 3400000 },
}

export function totalComp(o: Offer) {
  return o.baseSalary + o.equityValue / 4 + o.signingBonus / 4
}

export function recommendationFor(o: Offer): Recommendation {
  if (o.nonCompeteRisk >= 7) return "Negotiate First"
  if (totalComp(o) > 320000) return "Strong Take"
  return "Lean Take"
}

export const REC_CONFIG: Record<Recommendation, string> = {
  "Strong Take":
    "bg-emerald-500/15 text-emerald-400 ring-1 ring-inset ring-emerald-500/25",
  "Lean Take":
    "bg-amber-500/15 text-amber-400 ring-1 ring-inset ring-amber-500/25",
  "Negotiate First":
    "bg-red-500/15 text-red-400 ring-1 ring-inset ring-red-500/25",
}

export const fmtMoney = (n: number, symbol = "₹") =>
  n === 0
    ? `${symbol}0`
    : n >= 1000
      ? `${symbol}${Math.round(n / 1000)}k`
      : `${symbol}${n.toLocaleString()}`

export const fmtFull = (n: number, symbol = "₹") => `${symbol}${n.toLocaleString()}`

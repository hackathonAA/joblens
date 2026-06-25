export type StatusType = "active" | "waiting" | "rejected"

// ColumnId is now dynamic \u2014 widened to string
export type ColumnId = string

export type JobCard = {
  id: string
  company: string
  role: string
  lastActivity: string
  salaryMin: number
  salaryMax: number
  status: StatusType
  columnId: ColumnId
  location?: string
  jobUrl?: string
  notes?: string
}

export type Column = {
  id: string
  title: string
}

export function formatSalary(min: number, max: number): string {
  if (!min && !max) return "Salary TBD"
  if (!max) return `$${min}k+`
  return `$${min}k\u2013$${max}k`
}

export function daysSince(iso: string): string {
  const then = new Date(iso).getTime()
  const now = Date.now()
  const days = Math.floor((now - then) / (1000 * 60 * 60 * 24))
  if (days <= 0) return "Today"
  if (days === 1) return "1 day ago"
  return `${days} days ago`
}

export function getInitials(company: string): string {
  const words = company.trim().split(/\s+/)
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase()
  return (words[0][0] + words[1][0]).toUpperCase()
}



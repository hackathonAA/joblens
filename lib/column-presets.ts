export type DynamicColumn = {
  id: string
  columnKey: string
  title: string
  position: number
  isDefault: boolean
  isRejected: boolean
  isInterviewEligible: boolean
  isOfferStage: boolean
}

export const DEFAULT_COLUMNS: Omit<DynamicColumn, "id">[] = [
  { columnKey: "applied",          title: "Applied",          position: 0, isDefault: true,  isRejected: false, isInterviewEligible: false, isOfferStage: false },
  { columnKey: "recruiter-screen", title: "Recruiter Screen", position: 1, isDefault: false, isRejected: false, isInterviewEligible: true,  isOfferStage: false },
  { columnKey: "technical-round",  title: "Technical Round",  position: 2, isDefault: false, isRejected: false, isInterviewEligible: true,  isOfferStage: false },
  { columnKey: "final-round",      title: "Final Round",      position: 3, isDefault: false, isRejected: false, isInterviewEligible: true,  isOfferStage: false },
  { columnKey: "offer",            title: "Offer",            position: 4, isDefault: false, isRejected: false, isInterviewEligible: true,  isOfferStage: true  },
  { columnKey: "accepted",         title: "Accepted",         position: 5, isDefault: false, isRejected: false, isInterviewEligible: false, isOfferStage: true  },
  { columnKey: "rejected",         title: "Rejected",         position: 6, isDefault: false, isRejected: true,  isInterviewEligible: false, isOfferStage: false },
]

export const SALES_COLUMNS: Omit<DynamicColumn, "id">[] = [
  { columnKey: "prospecting",  title: "Prospecting",    position: 0, isDefault: true,  isRejected: false, isInterviewEligible: false, isOfferStage: false },
  { columnKey: "outreach",     title: "Outreach Sent",  position: 1, isDefault: false, isRejected: false, isInterviewEligible: false, isOfferStage: false },
  { columnKey: "first-call",   title: "First Call",     position: 2, isDefault: false, isRejected: false, isInterviewEligible: true,  isOfferStage: false },
  { columnKey: "proposal",     title: "Proposal Sent",  position: 3, isDefault: false, isRejected: false, isInterviewEligible: true,  isOfferStage: false },
  { columnKey: "negotiation",  title: "Negotiation",    position: 4, isDefault: false, isRejected: false, isInterviewEligible: true,  isOfferStage: false },
  { columnKey: "closed-won",   title: "Closed Won",     position: 5, isDefault: false, isRejected: false, isInterviewEligible: false, isOfferStage: true  },
  { columnKey: "closed-lost",  title: "Closed Lost",    position: 6, isDefault: false, isRejected: true,  isInterviewEligible: false, isOfferStage: false },
]

export const FINANCE_COLUMNS: Omit<DynamicColumn, "id">[] = [
  { columnKey: "applied",         title: "Applied",          position: 0, isDefault: true,  isRejected: false, isInterviewEligible: false, isOfferStage: false },
  { columnKey: "hr-screen",       title: "HR Screen",        position: 1, isDefault: false, isRejected: false, isInterviewEligible: true,  isOfferStage: false },
  { columnKey: "case-study",      title: "Case Study",       position: 2, isDefault: false, isRejected: false, isInterviewEligible: true,  isOfferStage: false },
  { columnKey: "panel-interview", title: "Panel Interview",  position: 3, isDefault: false, isRejected: false, isInterviewEligible: true,  isOfferStage: false },
  { columnKey: "partner-round",   title: "Partner Round",    position: 4, isDefault: false, isRejected: false, isInterviewEligible: true,  isOfferStage: false },
  { columnKey: "offer",           title: "Offer",            position: 5, isDefault: false, isRejected: false, isInterviewEligible: false, isOfferStage: true  },
  { columnKey: "rejected",        title: "Rejected",         position: 6, isDefault: false, isRejected: true,  isInterviewEligible: false, isOfferStage: false },
]

export const PRESETS = {
  tech: DEFAULT_COLUMNS,
  sales: SALES_COLUMNS,
  finance: FINANCE_COLUMNS,
} as const

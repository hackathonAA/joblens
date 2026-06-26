"use client"

import { createContext, useContext, useState, useEffect } from "react"

export type Currency = { symbol: string; code: string; label: string }

export const CURRENCIES: Currency[] = [
  { symbol: "₹", code: "INR", label: "₹ INR" },
  { symbol: "$", code: "USD", label: "$ USD" },
  { symbol: "€", code: "EUR", label: "€ EUR" },
  { symbol: "£", code: "GBP", label: "£ GBP" },
]

const LS_KEY = "joblens_currency"

type CurrencyCtx = { currency: Currency; setCurrency: (c: Currency) => void }
const CurrencyContext = createContext<CurrencyCtx>({
  currency: CURRENCIES[0],
  setCurrency: () => {},
})

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrencyState] = useState<Currency>(CURRENCIES[0])

  useEffect(() => {
    const saved = localStorage.getItem(LS_KEY)
    if (saved) {
      const found = CURRENCIES.find(c => c.code === saved)
      if (found) setCurrencyState(found)
    }
  }, [])

  function setCurrency(c: Currency) {
    setCurrencyState(c)
    localStorage.setItem(LS_KEY, c.code)
  }

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency }}>
      {children}
    </CurrencyContext.Provider>
  )
}

export function useCurrency() {
  return useContext(CurrencyContext)
}

export function fmtAmount(n: number, symbol: string): string {
  if (n === 0) return `${symbol}0`
  if (n >= 10_00_000) return `${symbol}${(n / 10_00_000).toFixed(1)}Cr`
  if (n >= 1_00_000) return `${symbol}${(n / 1_00_000).toFixed(1)}L`
  if (n >= 1000) return `${symbol}${Math.round(n / 1000)}k`
  return `${symbol}${n.toLocaleString()}`
}

export function fmtFull(n: number, symbol: string): string {
  return `${symbol}${n.toLocaleString()}`
}

export function fmtSalaryRange(min: number, max: number, symbol: string): string {
  if (!min && !max) return "Salary TBD"
  if (!max) return `${symbol}${min}+`
  return `${symbol}${min}–${symbol}${max}`
}

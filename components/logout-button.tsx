"use client"

import { signOut } from "next-auth/react"

export function LogoutButton() {
  function handleSignOut() {
    const domain = process.env.NEXT_PUBLIC_COGNITO_DOMAIN
    const clientId = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID
    const region = process.env.NEXT_PUBLIC_COGNITO_REGION ?? "us-east-1"
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
    const logoutUri = encodeURIComponent(`${appUrl}/login`)

    signOut({ redirect: false }).then(() => {
      if (domain && clientId) {
        window.location.href = `https://${domain}.auth.${region}.amazoncognito.com/logout?client_id=${clientId}&logout_uri=${logoutUri}`
      } else {
        window.location.href = "/login"
      }
    })
  }

  return (
    <button
      onClick={handleSignOut}
      className="rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
    >
      Sign out
    </button>
  )
}

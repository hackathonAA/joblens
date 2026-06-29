import NextAuth from "next-auth"
import CognitoProvider from "next-auth/providers/cognito"
import type { NextAuthOptions } from "next-auth"
import { db } from "@/lib/db"
import { users } from "@/lib/schema"
import { eq } from "drizzle-orm"

export const authOptions: NextAuthOptions = {
  providers: [
    CognitoProvider({
      clientId: process.env.COGNITO_CLIENT_ID!,
      clientSecret: process.env.COGNITO_CLIENT_SECRET!,
      issuer: `https://cognito-idp.${process.env.COGNITO_REGION}.amazonaws.com/${process.env.COGNITO_USER_POOL_ID}`,
      wellKnown: `https://cognito-idp.${process.env.COGNITO_REGION}.amazonaws.com/${process.env.COGNITO_USER_POOL_ID}/.well-known/openid-configuration`,
      authorization: {
        url: `https://${process.env.COGNITO_DOMAIN}.auth.${process.env.COGNITO_REGION}.amazoncognito.com/oauth2/authorize`,
        params: {
          scope: "openid email phone",
          response_type: "code",
          redirect_uri: `${process.env.NEXTAUTH_URL}/api/auth/callback/cognito`,
        },
      },
      token: `https://${process.env.COGNITO_DOMAIN}.auth.${process.env.COGNITO_REGION}.amazoncognito.com/oauth2/token`,
      userinfo: `https://${process.env.COGNITO_DOMAIN}.auth.${process.env.COGNITO_REGION}.amazoncognito.com/oauth2/userInfo`,
    }),
  ],
  pages: { signIn: "/login" },
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) token.id = user.id
      if (account) token.accessToken = account.access_token
      return token
    },
    async session({ session, token }) {
      if (session.user) session.user.id = token.sub as string
      return session
    },
    async signIn({ user, account }) {
      try {
        if (account?.provider === "cognito" && user.email && account.providerAccountId) {
          const existing = await db.select().from(users).where(eq(users.cognitoSub, account.providerAccountId))
          if (existing.length === 0) {
            await db.insert(users).values({
              cognitoSub: account.providerAccountId,
              email: user.email,
              name: user.name ?? null,
            })
          }
        }
      } catch (e) {
        console.error("signIn DB error:", e)
      }
      return true
    },
  },
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }

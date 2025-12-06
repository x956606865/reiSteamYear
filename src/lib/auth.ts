import type { NextAuthOptions } from "next-auth";
import SteamProvider from "next-auth-steam";
import type { NextRequest } from "next/server";

export function getAuthOptions(req: NextRequest): NextAuthOptions {
    return {
        providers: [
            SteamProvider(req, {
                clientSecret: process.env.STEAM_CLIENT_SECRET!,
                callbackUrl: `${process.env.NEXTAUTH_URL}/api/auth/callback/steam`,
            }),
        ],
        callbacks: {
            jwt({ token, account, profile }) {
                if (account?.provider === "steam" && profile) {
                    token.steamId = (profile as any).steamid;
                    token.picture = (profile as any).avatarfull;
                    token.name = (profile as any).personaname;
                }
                return token;
            },
            session({ session, token }) {
                if ("steamId" in token) {
                    // @ts-expect-error type extension
                    session.user.steamId = token.steamId;
                    session.user.image = token.picture;
                    session.user.name = token.name;
                }
                return session;
            },
        },
        secret: process.env.NEXTAUTH_SECRET,
    };
}

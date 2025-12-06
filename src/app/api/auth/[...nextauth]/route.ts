import NextAuth from "next-auth/next";
import type { NextRequest } from "next/server";
import { getAuthOptions } from "@/lib/auth";

async function handler(
    req: NextRequest,
    props: { params: Promise<{ nextauth: string[] }> }
) {
    const params = await props.params;
    return NextAuth(req, { params }, getAuthOptions(req));
}

export const runtime = 'edge';
export { handler as GET, handler as POST };

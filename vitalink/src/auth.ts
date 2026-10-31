import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { z } from "zod";
import type { RoleKey } from "@prisma/client";
import { prisma } from "@/lib/db";
import { rateLimit, resetRateLimit } from "@/lib/rate-limit";

declare module "next-auth" {
  interface User {
    role?: RoleKey;
    organizationId?: string;
  }
  interface Session {
    user: { id: string; name: string; email: string; role: RoleKey; organizationId: string };
  }
}

class RateLimited extends CredentialsSignin {
  code = "rate_limited";
}

const credentialsSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(200),
  password: z.string().min(1).max(200),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  session: { strategy: "jwt", maxAge: 60 * 60 * 10 },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      async authorize(raw, request) {
        const parsed = credentialsSchema.safeParse(raw);
        if (!parsed.success) return null;
        const { email, password } = parsed.data;
        const ip = request?.headers?.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
        const rl = rateLimit(`login:${ip}:${email}`, 8, 5 * 60_000);
        if (!rl.ok) throw new RateLimited();

        const user = await prisma.user.findUnique({ where: { email } });
        const ok = user && user.active ? await bcrypt.compare(password, user.passwordHash) : false;
        await prisma.auditEvent.create({
          data: {
            userId: ok ? user!.id : null,
            userEmail: email,
            role: ok ? user!.role : null,
            orgId: ok ? user!.organizationId : null,
            action: ok ? "auth.login" : "auth.login_failed",
            entityType: "User",
            entityId: user?.id ?? null,
            ip,
            userAgent: request?.headers?.get("user-agent")?.slice(0, 250) ?? null,
          },
        });
        if (!ok || !user) return null;
        resetRateLimit(`login:${ip}:${email}`);
        await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
        return { id: user.id, name: user.name, email: user.email, role: user.role, organizationId: user.organizationId };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.uid = user.id;
        token.role = user.role;
        token.org = user.organizationId;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.uid as string;
      session.user.role = token.role as RoleKey;
      session.user.organizationId = token.org as string;
      return session;
    },
  },
});

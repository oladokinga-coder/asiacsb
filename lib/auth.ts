import { cookies } from "next/headers";
import { prisma } from "./db";

const SESSION_COOKIE = "bank_session";
const SESSION_DAYS = 30;

export async function createSession(userId: string): Promise<string> {
  const token =
    Math.random().toString(36).slice(2) + Date.now().toString(36) + Math.random().toString(36).slice(2);
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + SESSION_DAYS);

  await prisma.session.create({
    data: { userId, token, expiresAt },
  });

  const c = await cookies();
  c.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
    path: "/",
  });

  return token;
}

export async function getSessionUserId(): Promise<string | null> {
  const c = await cookies();
  const token = c.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { token },
    include: { user: true },
  });

  if (!session || session.expiresAt < new Date()) return null;
  return session.userId;
}

export async function deleteSession(): Promise<void> {
  const c = await cookies();
  const token = c.get(SESSION_COOKIE)?.value;
  if (token) await prisma.session.deleteMany({ where: { token } });
  c.delete(SESSION_COOKIE);
}

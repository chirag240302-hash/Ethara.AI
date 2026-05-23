import bcrypt from "bcryptjs";
import { jwtVerify, SignJWT } from "jose";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Role } from "@/lib/domain";

export const SESSION_COOKIE_NAME = "ttm_session";
const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 7;

function getSecretKey() {
  const secretValue = process.env.AUTH_SECRET;

  if (process.env.NODE_ENV === "production" && !secretValue) {
    throw new Error("AUTH_SECRET is required in production.");
  }

  return new TextEncoder().encode(secretValue ?? "development-only-secret-change-me");
}

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
};

function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_DURATION_SECONDS,
  };
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, passwordHash: string) {
  if (passwordHash.startsWith("plain:")) {
    return password === passwordHash.slice(6);
  }

  return bcrypt.compare(password, passwordHash);
}

export async function createSessionToken(user: SessionUser) {
  return new SignJWT({
    email: user.email,
    name: user.name,
    role: user.role,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION_SECONDS}s`)
    .sign(getSecretKey());
}

export function attachSessionCookie(response: NextResponse, token: string) {
  response.cookies.set(SESSION_COOKIE_NAME, token, sessionCookieOptions());
}

export function clearSessionCookie(response: NextResponse) {
  response.cookies.set(SESSION_COOKIE_NAME, "", {
    ...sessionCookieOptions(),
    maxAge: 0,
  });
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    const userId = payload.sub;

    if (!userId) {
      return null;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    return user;
  } catch {
    return null;
  }
}

export async function getUserProfileByEmail(email: string) {
  return prisma.user.findUnique({
    where: { email },
  });
}
import { NextResponse } from "next/server";
import { createSessionToken, getUserProfileByEmail, hashPassword, attachSessionCookie } from "@/lib/auth";
import { readRequestBody } from "@/lib/request";
import { jsonError, jsonSuccess } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { signupSchema } from "@/lib/validators";

export async function POST(request: Request) {
  const body = await readRequestBody(request);
  const parsed = signupSchema.safeParse(body);

  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message ?? "Invalid registration details");
  }

  const existingUser = await getUserProfileByEmail(parsed.data.email);

  if (existingUser) {
    return jsonError("An account with that email already exists", 409);
  }

  const adminCount = await prisma.user.count({ where: { role: "ADMIN" } });
  const role = parsed.data.role === "ADMIN" && adminCount > 0 ? "MEMBER" : parsed.data.role;

  const user = await prisma.user.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      passwordHash: await hashPassword(parsed.data.password),
      role,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
  });

  const token = await createSessionToken(user);
  const response = jsonSuccess({ user }, 201);
  attachSessionCookie(response, token);

  return response;
}
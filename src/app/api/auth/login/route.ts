import { createSessionToken, attachSessionCookie, getUserProfileByEmail, verifyPassword } from "@/lib/auth";
import { readRequestBody } from "@/lib/request";
import { jsonError, jsonSuccess } from "@/lib/http";
import { loginSchema } from "@/lib/validators";

export async function POST(request: Request) {
  const body = await readRequestBody(request);
  const parsed = loginSchema.safeParse(body);

  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message ?? "Invalid credentials");
  }

  const user = await getUserProfileByEmail(parsed.data.email);

  if (!user) {
    return jsonError("Invalid email or password", 401);
  }

  const passwordOk = await verifyPassword(parsed.data.password, user.passwordHash);

  if (!passwordOk) {
    return jsonError("Invalid email or password", 401);
  }

  const sessionUser = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };

  const token = await createSessionToken(sessionUser);
  const response = jsonSuccess({ user: sessionUser });
  attachSessionCookie(response, token);

  return response;
}
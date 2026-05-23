import { getCurrentUser } from "@/lib/auth";
import { jsonError, jsonSuccess } from "@/lib/http";

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return jsonError("Unauthorized", 401);
  }

  return jsonSuccess({ user });
}
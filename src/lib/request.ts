export async function readRequestBody(request: Request): Promise<Record<string, unknown>> {
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    const data = await request.json();

    if (data && typeof data === "object") {
      return data as Record<string, unknown>;
    }

    return {};
  }

  const formData = await request.formData();
  return Object.fromEntries(formData.entries());
}

export function readString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export function readOptionalString(value: unknown): string | undefined {
  const text = readString(value);
  return text.length ? text : undefined;
}

export function normalizeOptionalDate(value: unknown): Date | undefined {
  const text = readOptionalString(value);

  if (!text) {
    return undefined;
  }

  const parsed = new Date(text);

  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}
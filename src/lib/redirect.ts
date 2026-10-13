// Only allow same-site paths after sign-in, so ?next= can't send people to another website.
export function safeNext(value: string | string[] | undefined): string {
  const next = Array.isArray(value) ? value[0] : value;
  return next && next.startsWith("/") && !next.startsWith("//") ? next : "/";
}

export type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const TRACKING_PARAMS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
  "fbclid",
  "gclid"
];

export function normalizeUrl(input: string): string {
  try {
    const url = new URL(input);
    url.hash = "";
    TRACKING_PARAMS.forEach((param) => url.searchParams.delete(param));
    const sortedParams = Array.from(url.searchParams.entries()).sort(
      ([a], [b]) => a.localeCompare(b)
    );
    url.search = "";
    sortedParams.forEach(([key, value]) => url.searchParams.append(key, value));
    return url.toString();
  } catch {
    return input.trim();
  }
}

export function truncateText(value: string | null | undefined, maxLength: number) {
  if (!value) {
    return null;
  }
  const trimmed = value.trim();
  if (trimmed.length <= maxLength) {
    return trimmed;
  }
  return `${trimmed.slice(0, maxLength)}…`;
}

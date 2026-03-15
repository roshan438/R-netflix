export function extractYouTubeVideoId(input: string) {
  const value = input.trim();
  if (!value) return null;

  const directMatch = value.match(/^[a-zA-Z0-9_-]{11}$/);
  if (directMatch) return directMatch[0];

  try {
    const url = new URL(value);
    if (url.hostname.includes("youtu.be")) {
      return url.pathname.replace("/", "").slice(0, 11) || null;
    }

    if (url.hostname.includes("youtube.com")) {
      const fromQuery = url.searchParams.get("v");
      if (fromQuery) return fromQuery.slice(0, 11);

      const embedMatch = url.pathname.match(/\/embed\/([a-zA-Z0-9_-]{11})/);
      if (embedMatch) return embedMatch[1];

      const shortsMatch = url.pathname.match(/\/shorts\/([a-zA-Z0-9_-]{11})/);
      if (shortsMatch) return shortsMatch[1];
    }
  } catch {
    return null;
  }

  return null;
}

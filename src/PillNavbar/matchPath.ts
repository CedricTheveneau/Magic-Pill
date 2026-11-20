/** How a nav item matches the current path (L8). */
export type NavMatch = "exact" | "prefix" | ((pathname: string) => boolean);

export interface MatchableItem {
  href: string;
  match?: NavMatch;
}

const SLASH = 47; // "/"

/** "/blog/?q=1#top" → "/blog": no query, no hash, no trailing slash (except the root). */
function normalisePath(path: string): string {
  const withoutSuffix = path.split(/[?#]/, 1)[0];
  // A loop, not /\/+$/: that regex backtracks quadratically on a long run of
  // slashes followed by another character, and the path comes from the URL (ReDoS)
  let end = withoutSuffix.length;
  while (end > 1 && withoutSuffix.charCodeAt(end - 1) === SLASH) end--;
  return withoutSuffix.slice(0, end);
}

function matches(pathname: string, item: MatchableItem): boolean {
  // The item's own matcher function (not String.prototype.match: no regular
  // expression is built from the path)
  const customMatch = item.match;
  if (typeof customMatch === "function") {
    return customMatch(pathname);
  }
  // Only same-site paths can match by themselves; anything else needs a function
  if (!item.href.startsWith("/") || item.href.startsWith("//")) {
    return false;
  }
  const path = normalisePath(pathname);
  const href = normalisePath(item.href);
  if (item.match === "exact" || href === "/") {
    return path === href;
  }
  // Whole segments only: "/blog" matches "/blog" and "/blog/post", not "/blogroll"
  return path === href || path.startsWith(`${href}/`);
}

/**
 * The index of the active item, or -1. Several items can match ("/blog" and
 * "/blog/drafts" on "/blog/drafts/1"): the longest href wins, so exactly one
 * item is active.
 */
export function findActiveIndex(pathname: string | undefined, items: readonly MatchableItem[]): number {
  if (pathname === undefined) {
    return -1;
  }
  let activeIndex = -1;
  let activeLength = -1;
  items.forEach((item, index) => {
    const length = normalisePath(item.href).length;
    if (length > activeLength && matches(pathname, item)) {
      activeIndex = index;
      activeLength = length;
    }
  });
  return activeIndex;
}

// Link safety (L16): React 18 renders `javascript:` URLs as-is, so every href
// the library renders goes through this check first.

const ALLOWED_SCHEMES = new Set(["http", "https", "mailto", "tel"]);

/**
 * Whether an href is safe to render: relative URLs (including `#…`, `?…`
 * and `//host`), or absolute URLs with an `http(s):`, `mailto:` or `tel:` scheme.
 *
 * It normalises the URL the way browsers do before reading the scheme
 * (leading spaces and control characters dropped, tabs and newlines removed),
 * so `" java\tscript:…"` is caught too.
 */
export function isSafeHref(href: string): boolean {
  const normalised = href
    .replace(/^[\x00-\x20]+/, "")
    .replace(/[\t\n\r]/g, "");
  const scheme = /^([a-z][a-z\d+.-]*):/i.exec(normalised);
  return scheme === null || ALLOWED_SCHEMES.has(scheme[1].toLowerCase());
}

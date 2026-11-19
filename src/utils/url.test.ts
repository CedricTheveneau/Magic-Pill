import { describe, expect, it } from "vitest";

import { isSafeHref } from "./url";

describe("isSafeHref", () => {
  it.each([
    "/",
    "/blog/post?id=1#top",
    "blog",
    "./a",
    "../a",
    "#section",
    "?query",
    "//cdn.example.com/a",
    "https://example.com",
    "HTTP://EXAMPLE.COM",
    "mailto:hello@example.com",
    "tel:+33100000000",
    "path/with:colon-after-slash",
    "",
  ])("allows %j", (href) => {
    // Act
    const safe = isSafeHref(href);

    // Assert
    expect(safe).toBe(true);
  });

  it.each([
    "javascript:alert(1)",
    "JavaScript:alert(1)",
    " javascript:alert(1)",
    "\u0000javascript:alert(1)",
    "java\tscript:alert(1)",
    "java\nscript:alert(1)",
    "data:text/html,<script>alert(1)</script>",
    "vbscript:msgbox",
    "file:///etc/passwd",
  ])("blocks %j", (href) => {
    // Act
    const safe = isSafeHref(href);

    // Assert
    expect(safe).toBe(false);
  });
});

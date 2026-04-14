import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import HomePage from "../app/page";


vi.stubGlobal("React", React);


describe("HomePage", () => {
  it("keeps the reviewer sign-in path as the primary hero action", () => {
    const html = renderToStaticMarkup(React.createElement(HomePage));
    const primaryButtons = html.match(/class="primary-button"/g) ?? [];

    expect(html).toContain("Primary path");
    expect(html).toContain("Sign in with GitHub");
    expect(html).toContain(
      'href="/api/auth/github/login?next_path=%2F"',
    );
    expect(primaryButtons).toHaveLength(1);
    expect(html.indexOf("Sign in with GitHub")).toBeLessThan(
      html.indexOf("What reviewers actually open"),
    );
    expect(html).toContain("Need setup first?");
    expect(html).toContain("Open workspace quick start");
  });
});

import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import HomePage from "../app/page";


vi.stubGlobal("React", React);

const WORKSPACE_QUICKSTART_URL =
  "https://notebooklens.github.io/notebooklens/quickstart-workspace/";

async function renderHomePage(
  searchParams: Record<string, string | string[] | undefined> = {},
) {
  return renderToStaticMarkup(
    await HomePage({ searchParams: Promise.resolve(searchParams) }),
  );
}


describe("HomePage", () => {
  it("keeps the landing path singular with one GitHub-first primary action", async () => {
    const html = await renderHomePage();
    const primaryButtons = html.match(/class="primary-button"/g) ?? [];
    const secondaryButtons = html.match(/class="secondary-button"/g) ?? [];

    expect(html).toContain("Next step");
    expect(html).toContain("Continue with GitHub");
    expect(html).toContain(
      'href="/api/auth/github/login?next_path=%2F"',
    );
    expect(primaryButtons).toHaveLength(1);
    expect(secondaryButtons).toHaveLength(0);
    expect(html.indexOf("Continue with GitHub")).toBeLessThan(
      html.indexOf("What reviewers actually open"),
    );
    expect(html).toContain("The one-time repository setup lives in the");
    expect(html).toContain("Keep setup details in one place");
    expect(html).not.toContain("Need setup first?");
    expect(html).not.toContain("Install the GitHub App review flow");
  });

  it("switches the same primary CTA to the setup reference after GitHub app install returns home", async () => {
    const html = await renderHomePage({
      installation_id: "123",
      setup_action: "install",
    });

    expect(html).toContain("Finish opening the review flow");
    expect(html).toContain("NotebookLens already received your GitHub App setup handoff.");
    expect(html).toContain(`href="${WORKSPACE_QUICKSTART_URL}"`);
    expect(html).toContain("Open workspace quick start");
    expect(html).not.toContain(
      'href="/api/auth/github/login?next_path=%2F"',
    );
  });

  it("marks the reviewer proof panel as an illustration instead of a live thread surface", async () => {
    const html = await renderHomePage();

    expect(html).toContain("Illustration only");
    expect(html).toContain("Static preview of the GitHub check run");
    expect(html).toContain("Example thread");
    expect(html).not.toContain("Open thread");
  });
});

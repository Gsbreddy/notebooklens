import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { ReviewWorkspace } from "../components/review-workspace";
import type { RenderRow, WorkspacePayload } from "./types";


vi.stubGlobal("React", React);

vi.mock("next/image", () => ({
  default: (props: Record<string, unknown>) => React.createElement("img", props),
}));

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...props
  }: {
    children: React.ReactNode;
    href: string;
  }) => React.createElement("a", { href, ...props }, children),
}));


function buildRow(overrides: Partial<RenderRow> = {}): RenderRow {
  return {
    locator: {
      cell_id: "metric-cell",
      base_index: 1,
      head_index: 1,
      display_index: 1,
    },
    cell_type: "code",
    change_type: "modified",
    summary: "Metric output changed.",
    source: {
      base: "print('accuracy')",
      head: "print('accuracy')",
      changed: false,
    },
    outputs: {
      changed: true,
      items: [],
    },
    metadata: {
      changed: false,
      summary: null,
    },
    review_context: [],
    thread_anchors: {
      source: {
        notebook_path: "analysis/notebook.ipynb",
        cell_locator: {
          cell_id: "metric-cell",
          base_index: 1,
          head_index: 1,
          display_index: 1,
        },
        block_kind: "source",
        source_fingerprint: "source-fingerprint",
        cell_type: "code",
      },
      outputs: {
        notebook_path: "analysis/notebook.ipynb",
        cell_locator: {
          cell_id: "metric-cell",
          base_index: 1,
          head_index: 1,
          display_index: 1,
        },
        block_kind: "outputs",
        source_fingerprint: "output-fingerprint",
        cell_type: "code",
      },
      metadata: {
        notebook_path: "analysis/notebook.ipynb",
        cell_locator: {
          cell_id: "metric-cell",
          base_index: 1,
          head_index: 1,
          display_index: 1,
        },
        block_kind: "metadata",
        source_fingerprint: "metadata-fingerprint",
        cell_type: "code",
      },
    },
    ...overrides,
  };
}


function buildWorkspace(row: RenderRow): WorkspacePayload {
  return {
    review: {
      id: "review-id",
      owner: "octo-org",
      repo: "notebooklens",
      pull_number: 7,
      base_branch: "main",
      status: "ready",
      installation: {
        id: "installation-id",
        account_login: "octo-org",
        account_type: "organization",
      },
      latest_snapshot_id: "snapshot-2",
      latest_snapshot_index: 2,
      selected_snapshot_index: 2,
      thread_counts: {
        unresolved: 1,
        resolved: 0,
        outdated: 0,
      },
      snapshot_history: [
        {
          id: "snapshot-2",
          snapshot_index: 2,
          status: "ready",
          base_sha: "base-sha",
          head_sha: "head-sha",
          created_at: "2026-04-12T12:00:00Z",
          is_latest: true,
        },
      ],
    },
    snapshot: {
      id: "snapshot-2",
      snapshot_index: 2,
      status: "ready",
      base_sha: "base-sha",
      head_sha: "head-sha",
      schema_version: 1,
      summary_text: null,
      flagged_findings: [],
      reviewer_guidance: [],
      payload: {
        schema_version: 1,
        review: {
          notices: [],
          notebooks: [
            {
              path: "analysis/notebook.ipynb",
              change_type: "modified",
              notices: [],
              render_rows: [row],
            },
          ],
        },
      },
      notebook_count: 1,
      changed_cell_count: 1,
      failure_reason: null,
      created_at: "2026-04-12T12:00:00Z",
    },
    threads: [],
  };
}


function renderWorkspace(row: RenderRow): string {
  return renderToStaticMarkup(
    React.createElement(ReviewWorkspace, {
      workspace: buildWorkspace(row),
      currentPath: "/reviews/octo-org/notebooklens/pulls/7",
      flashNotice: null,
    }),
  );
}


describe("review workspace rendering", () => {
  it("suppresses empty output and metadata rows instead of rendering a shell card", () => {
    const markup = renderWorkspace(
      buildRow({
        outputs: {
          changed: true,
          items: [],
        },
        metadata: {
          changed: true,
          summary: "   ",
        },
      }),
    );

    expect(markup).not.toContain("Output summary diff");
    expect(markup).not.toContain("Metadata diff");
    expect(markup).not.toContain("Metric output changed.");
    expect(markup).toContain("No reviewable notebook changes on this version");
  });

  it("skips empty output cards inside an otherwise meaningful output block", () => {
    const markup = renderWorkspace(
      buildRow({
        outputs: {
          changed: true,
          items: [
            {
              kind: "placeholder",
              output_type: "execute_result",
              mime_group: "text",
              summary: "   ",
              truncated: false,
              change_type: "modified",
            },
            {
              kind: "placeholder",
              output_type: "stream",
              mime_group: "text",
              summary: "Accuracy dropped from 0.92 to 0.88.",
              truncated: false,
              change_type: "modified",
            },
          ],
        },
      }),
    );

    expect(markup).toContain("Output changes");
    expect(markup).toContain("Accuracy dropped from 0.92 to 0.88.");
    expect(markup).not.toContain("execute_result");
  });
});

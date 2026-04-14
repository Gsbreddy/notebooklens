import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { ReviewWorkspace } from "../components/review-workspace";
import type { RenderRow, ReviewThread, SnapshotNotebook, WorkspacePayload } from "./types";


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


function buildRowForNotebook(
  notebookPath: string,
  overrides: Partial<RenderRow> = {},
): RenderRow {
  return buildRow({
    thread_anchors: {
      source: {
        notebook_path: notebookPath,
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
        notebook_path: notebookPath,
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
        notebook_path: notebookPath,
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
  });
}


function buildNotebook(path: string, row: RenderRow): SnapshotNotebook {
  return {
    path,
    change_type: "modified",
    notices: [],
    render_rows: [row],
  };
}


function buildWorkspaceFromNotebooks(
  notebooks: SnapshotNotebook[],
  summaryText: string | null = null,
): WorkspacePayload {
  const changedCellCount = notebooks.reduce(
    (total, notebook) => total + notebook.render_rows.length,
    0,
  );

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
      summary_text: summaryText,
      flagged_findings: [],
      reviewer_guidance: [],
      payload: {
        schema_version: 1,
        review: {
          notices: [],
          notebooks,
        },
      },
      notebook_count: notebooks.length,
      changed_cell_count: changedCellCount,
      failure_reason: null,
      created_at: "2026-04-12T12:00:00Z",
    },
    threads: [],
  };
}


function buildWorkspace(row: RenderRow): WorkspacePayload {
  return buildWorkspaceFromNotebooks([
    buildNotebook("analysis/notebook.ipynb", row),
  ]);
}


function buildThread(
  row: RenderRow,
  overrides: Partial<ReviewThread> = {},
): ReviewThread {
  return {
    id: "thread-id",
    managed_review_id: "review-id",
    origin_snapshot_id: "snapshot-1",
    current_snapshot_id: "snapshot-2",
    anchor: row.thread_anchors.outputs,
    status: "open",
    carried_forward: true,
    created_by_github_user_id: 101,
    created_at: "2026-04-12T12:00:00Z",
    updated_at: "2026-04-12T12:00:00Z",
    resolved_at: null,
    resolved_by_github_user_id: null,
    github_mirror_state: "pending",
    github_root_comment_url: null,
    github_last_mirrored_at: null,
    messages: [
      {
        id: "message-1",
        author_github_user_id: 101,
        author_login: "octo-reviewer",
        body_markdown: "Please explain why the validation accuracy regressed on this output.",
        created_at: "2026-04-12T12:00:00Z",
        github_reply_comment_id: null,
        github_reply_comment_url: null,
      },
    ],
    ...overrides,
  };
}


function renderWorkspacePayload(workspace: WorkspacePayload): string {
  return renderToStaticMarkup(
    React.createElement(ReviewWorkspace, {
      workspace,
      currentPath: "/reviews/octo-org/notebooklens/pulls/7",
      flashNotice: null,
    }),
  );
}


function renderWorkspace(row: RenderRow): string {
  return renderWorkspacePayload(buildWorkspace(row));
}


describe("review workspace rendering", () => {
  it("keeps the create-thread composer hidden until a reviewer opens it", () => {
    const markup = renderWorkspace(
      buildRow({
        source: {
          base: "print('accuracy')",
          head: "print('new accuracy')",
          changed: true,
        },
      }),
    );

    expect(markup).toContain("Add comment");
    expect(markup).not.toContain("Start a thread");
    expect(markup).not.toContain("Create thread");
    expect(markup).not.toContain("Keep it attached to this block.");
  });

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

  it("uses disclosures for snapshot details and multi-notebook navigation", () => {
    const firstNotebook = buildNotebook(
      "analysis/notebook.ipynb",
      buildRowForNotebook("analysis/notebook.ipynb", {
        source: {
          base: "print('accuracy')",
          head: "print('new accuracy')",
          changed: true,
        },
      }),
    );
    const secondNotebook = buildNotebook(
      "analysis/second-notebook.ipynb",
      buildRowForNotebook("analysis/second-notebook.ipynb", {
        locator: {
          cell_id: "second-cell",
          base_index: 2,
          head_index: 2,
          display_index: 2,
        },
        summary: "Validation chart changed.",
        source: {
          base: "display(validation_chart_old)",
          head: "display(validation_chart_new)",
          changed: true,
        },
      }),
    );

    const markup = renderWorkspacePayload(
      buildWorkspaceFromNotebooks(
        [firstNotebook, secondNotebook],
        "Two notebooks changed in this review version.",
      ),
    );

    expect(markup).toContain("Snapshot details");
    expect(markup).toContain("Jump between notebooks");
    expect(markup).toContain("2 changed notebooks");
    expect(markup).toContain("Two notebooks changed in this review version.");
  });

  it("keeps the default rail focused and moves review signals into collapsible summaries", () => {
    const row = buildRow({
      outputs: {
        changed: true,
        items: [
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
    });
    const notebook = buildNotebook("analysis/notebook.ipynb", row);
    notebook.notices = ["Re-run this notebook after refreshing the staged fixture data."];
    const workspace = buildWorkspaceFromNotebooks([notebook]);
    workspace.snapshot!.payload.review.notices = ["Check the staged benchmark inputs before merging."];
    workspace.snapshot!.flagged_findings = [
      {
        severity: "high",
        summary: "Validation accuracy regressed in the benchmark output.",
      },
    ];
    workspace.snapshot!.reviewer_guidance = [
      {
        label: "Regression triage",
        prompt: "Confirm whether the metric drop is expected for this push.",
      },
    ];
    workspace.threads = [buildThread(row)];

    const markup = renderWorkspacePayload(workspace);

    expect(markup).toContain("PR Versions");
    expect(markup).toContain("Open thread");
    expect(markup).not.toContain("Where to look first");
    expect(markup).not.toContain("Review signals");
    expect(markup).not.toContain("Workspace access");
    expect(markup).toContain("Review notes");
    expect(markup).toContain("Check the staged benchmark inputs before merging.");
    expect(markup).toContain("Validation accuracy regressed in the benchmark output.");
    expect(markup).toContain("Confirm whether the metric drop is expected for this push.");
    expect(markup).toContain("First changed row: Cell 2. Metric output changed.");
    expect(markup).toContain("1 open thread.");
    expect(markup).toContain("1 notebook note.");
    expect(markup).toContain("Notebook notes");
    expect(markup).toContain("Re-run this notebook after refreshing the staged fixture data.");
    expect(markup).not.toContain("Review items");
    expect(markup).not.toContain("Inline threads");
    expect(markup).not.toContain("PR version</span><strong>#2</strong>");
    expect(markup).toContain("Session &amp; review settings");
    expect(markup).toContain("Open LiteLLM settings");
  });

  it("renders existing threads as collapsed summaries with compact GitHub metadata", () => {
    const row = buildRow({
      outputs: {
        changed: true,
        items: [
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
    });
    const workspace = buildWorkspace(row);
    workspace.threads = [
      buildThread(row, {
        github_mirror_state: "mirrored",
        github_root_comment_url: "https://github.example/thread/1",
        github_last_mirrored_at: "2026-04-12T13:30:00Z",
      }),
    ];

    const markup = renderWorkspacePayload(workspace);

    expect(markup).toContain("Add comment");
    expect(markup).not.toContain('class="thread-column-head"');
    expect(markup).toContain("Please explain why the validation accuracy regressed on this output.");
    expect(markup).toContain("GitHub: Mirrored to GitHub");
    expect(markup).toContain("Open mirrored PR thread");
    expect(markup).toContain('class="thread-card thread-card-flat thread-details"');
    expect(markup).not.toContain('thread-card thread-card-flat thread-details" open');
  });
});

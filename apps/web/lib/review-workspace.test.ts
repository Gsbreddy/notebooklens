import { describe, expect, it } from "vitest";

import {
  buildAnchorKey,
  buildAiGatewayRoute,
  buildFlashRedirect,
  buildWorkspaceActionPath,
  canStartThread,
  getMeaningfulOutputItems,
  getVisibleBlockKinds,
  groupThreadsByAnchor,
  hasMeaningfulBlockContent,
  hasVisibleBlocks,
  isBlockChanged,
  summarizeGitHubMirrorStatus,
} from "@/lib/review-workspace";
import type { RenderRow, ReviewSnapshotRecord, ReviewThread, WorkspaceReview } from "@/lib/types";


function buildRow(): RenderRow {
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
  };
}


function buildSnapshot(id: string): ReviewSnapshotRecord {
  return {
    id,
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
        notebooks: [],
      },
    },
    notebook_count: 1,
    changed_cell_count: 1,
    failure_reason: null,
    created_at: "2026-04-12T12:00:00Z",
  };
}


function buildReview(latestSnapshotId: string): WorkspaceReview {
  return {
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
    latest_snapshot_id: latestSnapshotId,
    latest_snapshot_index: 2,
    selected_snapshot_index: 2,
    thread_counts: {
      unresolved: 1,
      resolved: 0,
      outdated: 0,
    },
    snapshot_history: [],
  };
}


function buildThread(row: RenderRow): ReviewThread {
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
    messages: [],
  };
}


describe("review workspace helpers", () => {
  it("groups threads by normalized anchor", () => {
    const row = buildRow();
    const thread = buildThread(row);
    const grouped = groupThreadsByAnchor([thread]);

    expect(grouped.get(buildAnchorKey(row.thread_anchors.outputs))).toEqual([thread]);
  });

  it("only allows new threads on changed blocks in the latest ready snapshot", () => {
    const row = {
      ...buildRow(),
      outputs: {
        changed: true,
        items: [
          {
            kind: "placeholder" as const,
            output_type: "stream",
            mime_group: "text",
            summary: "Accuracy dropped from 0.92 to 0.88.",
            truncated: false,
            change_type: "modified" as const,
          },
        ],
      },
    };
    const latestSnapshot = buildSnapshot("snapshot-2");
    const oldSnapshot = buildSnapshot("snapshot-1");

    expect(canStartThread(buildReview("snapshot-2"), latestSnapshot, row, "outputs")).toBe(true);
    expect(canStartThread(buildReview("snapshot-2"), latestSnapshot, row, "source")).toBe(false);
    expect(canStartThread(buildReview("snapshot-2"), oldSnapshot, row, "outputs")).toBe(false);
    expect(canStartThread(buildReview("snapshot-2"), latestSnapshot, buildRow(), "outputs")).toBe(false);
  });

  it("keeps flash redirects on the same route", () => {
    expect(
      buildFlashRedirect("/reviews/octo/notebooklens/pulls/7/snapshots/2", {
        tone: "error",
        message: "Thread anchor does not exist on the selected snapshot",
      }),
    ).toContain("/reviews/octo/notebooklens/pulls/7/snapshots/2?flash=error");
  });

  it("reports whether a specific block changed", () => {
    const row = buildRow();

    expect(isBlockChanged(row, "outputs")).toBe(true);
    expect(isBlockChanged(row, "metadata")).toBe(false);
  });

  it("treats empty metadata and output blocks as not meaningful", () => {
    const row = buildRow();

    expect(hasMeaningfulBlockContent(row, "outputs")).toBe(false);
    expect(hasMeaningfulBlockContent(row, "metadata")).toBe(false);
    expect(hasMeaningfulBlockContent(row, "source")).toBe(true);
  });

  it("suppresses empty changed blocks when they have no threads", () => {
    const row = buildRow();

    expect(getVisibleBlockKinds(row, new Map())).toEqual([]);
    expect(hasVisibleBlocks(row, new Map())).toBe(false);
  });

  it("keeps thread-only blocks visible even when the diff content is empty", () => {
    const row = buildRow();
    const thread = {
      ...buildThread(row),
      anchor: row.thread_anchors.outputs,
    };
    const threadsByAnchor = groupThreadsByAnchor([thread]);

    expect(getVisibleBlockKinds(row, threadsByAnchor)).toEqual(["outputs"]);
    expect(hasVisibleBlocks(row, threadsByAnchor)).toBe(true);
  });

  it("filters empty output placeholder cards out of a visible block", () => {
    const row = {
      ...buildRow(),
      outputs: {
        changed: true,
        items: [
          {
            kind: "placeholder" as const,
            output_type: "execute_result",
            mime_group: "text",
            summary: "   ",
            truncated: false,
            change_type: "modified" as const,
          },
          {
            kind: "placeholder" as const,
            output_type: "stream",
            mime_group: "text",
            summary: "Accuracy dropped from 0.92 to 0.88.",
            truncated: false,
            change_type: "modified" as const,
          },
        ],
      },
    };

    expect(getMeaningfulOutputItems(row)).toEqual([row.outputs.items[1]]);
  });

  it("builds the review-scoped LiteLLM settings route", () => {
    expect(buildAiGatewayRoute("octo", "notebooklens", 7)).toBe(
      "/reviews/octo/notebooklens/pulls/7/settings/ai-gateway",
    );
  });

  it("builds stable post routes for review mutations", () => {
    expect(buildWorkspaceActionPath("create-thread")).toBe("/actions/threads/create");
    expect(buildWorkspaceActionPath("reply-thread")).toBe("/actions/threads/reply");
    expect(buildWorkspaceActionPath("resolve-thread")).toBe("/actions/threads/resolve");
    expect(buildWorkspaceActionPath("reopen-thread")).toBe("/actions/threads/reopen");
    expect(buildWorkspaceActionPath("logout")).toBe("/actions/auth/logout");
  });

  it("summarizes mirrored GitHub threads", () => {
    const thread = {
      ...buildThread(buildRow()),
      github_mirror_state: "mirrored" as const,
      github_root_comment_url: "https://github.example.test/thread/1",
    };

    expect(summarizeGitHubMirrorStatus(thread)).toEqual({
      label: "Mirrored to GitHub",
      tone: "success",
      description: "GitHub reviewers can open the mirrored PR thread directly.",
      linkLabel: "Open mirrored PR thread",
    });
  });
});

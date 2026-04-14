"use client";

import type { Route } from "next";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { buildApiHref, buildLoginHref } from "@/lib/public-hrefs";
import {
  buildAnchorKey,
  buildAiGatewayRoute,
  buildSnapshotRoute,
  buildWorkspaceActionPath,
  canStartThread,
  formatCellLabel,
  getMeaningfulOutputItems,
  getVisibleBlockKinds,
  groupThreadsByAnchor,
  hasMeaningfulBlockContent,
  hasVisibleBlocks,
  isBlockChanged,
  summarizeGitHubMirrorStatus,
  summarizeFinding,
  summarizeGuidance,
  toggleThreadComposer,
} from "@/lib/review-workspace";
import type {
  FlashNotice,
  RenderRow,
  ReviewSnapshotRecord,
  ReviewThread,
  SnapshotBlockKind,
  SnapshotNotebook,
  ThreadAnchor,
  WorkspacePayload,
} from "@/lib/types";


type ReviewWorkspaceProps = {
  workspace: WorkspacePayload;
  currentPath: string;
  flashNotice: FlashNotice | null;
};


export function ReviewWorkspace({
  workspace,
  currentPath,
  flashNotice,
}: ReviewWorkspaceProps) {
  const snapshot = workspace.snapshot;
  const threadsByAnchor = groupThreadsByAnchor(workspace.threads);
  const openThreads = workspace.threads.filter((thread) => thread.status === "open");
  const primaryOpenThread = openThreads[0] ?? null;
  const [openComposerKey, setOpenComposerKey] = useState<string | null>(null);
  const visibleNotebooks = snapshot?.status === "ready"
    ? snapshot.payload.review.notebooks.filter(
        (notebook) =>
          notebook.notices.length > 0 ||
          notebook.render_rows.some((row) => hasVisibleBlocks(row, threadsByAnchor)),
      )
    : [];
  const latestSnapshotLabel =
    workspace.review.latest_snapshot_index === null
      ? "No review version yet"
      : `Latest push ${workspace.review.latest_snapshot_index}`;
  const selectedSnapshotLabel =
    snapshot === null
      ? "No version selected"
      : snapshot.snapshot_index === workspace.review.latest_snapshot_index
        ? "Reviewing latest push"
        : `Reviewing push ${snapshot.snapshot_index}`;
  const reviewStatusLabel = formatReviewStatusLabel(workspace.review.status);
  const installationLabel = `${workspace.review.installation.account_login} (${workspace.review.installation.account_type})`;

  useEffect(() => {
    setOpenComposerKey(null);
  }, [snapshot?.id]);

  return (
    <div className="workspace-shell">
      <header className="summary-card workspace-pr-strip">
        <div className="workspace-pr-strip-main">
          <p className="workspace-breadcrumb">
            NotebookLens review workspace
          </p>
          <div className="workspace-pr-strip-head">
            <h1 className="workspace-title workspace-title-compact">
              {workspace.review.owner}/{workspace.review.repo}
            </h1>
            <span className="workspace-pr-number">
              PR #{workspace.review.pull_number}
            </span>
            <span className="workspace-pr-installation">
              {installationLabel}
            </span>
          </div>
        </div>
        <div className="workspace-pr-strip-meta">
          <div className="hero-meta workspace-meta">
            <StatusPill label={reviewStatusLabel} tone="default" />
            <StatusPill label={selectedSnapshotLabel} tone="default" />
            <StatusPill
              label={`${workspace.review.thread_counts.unresolved} open`}
              tone="accent"
            />
          </div>
          <p className="workspace-strip-caption workspace-strip-caption-inline">
            {latestSnapshotLabel} · {workspace.review.thread_counts.resolved} resolved ·{" "}
            {workspace.review.thread_counts.outdated} outdated
          </p>
        </div>
      </header>

      {flashNotice ? (
        <div className={`flash-banner flash-${flashNotice.tone}`}>
          {flashNotice.message}
        </div>
      ) : null}

      <div className="workspace-grid">
        <main className="workspace-main">
          {snapshot ? (
            <SnapshotOverview review={workspace.review} snapshot={snapshot} />
          ) : (
            <EmptyState
              title="This review is not ready yet"
              description="Open the PR check run again after NotebookLens finishes preparing the next review version."
            />
          )}

          {snapshot?.status === "failed" ? (
            <EmptyState
              title="NotebookLens could not prepare this review"
              description={snapshot.failure_reason ?? "Try reopening the PR check run after the latest push finishes."}
            />
          ) : null}

          {snapshot?.status === "ready" &&
          visibleNotebooks.length > 0 ? (
            <section className="notebook-stack">
              {visibleNotebooks.length > 1 ? (
                <details className="summary-card notebook-jump-card">
                  <summary className="notebook-jump-summary">
                    <span>
                      <strong>Jump between notebooks</strong>
                      <span className="history-caption notebook-jump-summary-copy">
                        {visibleNotebooks.length} changed notebooks
                      </span>
                    </span>
                    <span className="muted-copy">
                      Open navigator
                    </span>
                  </summary>
                  <div className="notebook-jump-grid">
                    {visibleNotebooks.map((notebook) => {
                      const [directoryLabel, fileLabel] = splitNotebookPath(notebook.path);
                      const reviewItemCount = notebook.render_rows.filter((row) =>
                        hasVisibleBlocks(row, threadsByAnchor),
                      ).length;
                      const threadCount = countThreadsForNotebook(notebook, threadsByAnchor);

                      return (
                        <a
                          className="history-link notebook-jump-link"
                          href={`#${buildNotebookSectionId(notebook.path)}`}
                          key={`jump-${notebook.path}`}
                        >
                          <span className="notebook-jump-copy">
                            <strong>{fileLabel}</strong>
                            <span className="history-caption">{directoryLabel}</span>
                          </span>
                          <span className="notebook-jump-meta">
                            <span>{reviewItemCount} items</span>
                            <span>{threadCount} threads</span>
                          </span>
                        </a>
                      );
                    })}
                  </div>
                </details>
              ) : null}
              {visibleNotebooks.map((notebook) => (
                <NotebookCard
                  currentPath={currentPath}
                  key={`${notebook.path}-${snapshot.id}`}
                  notebook={notebook}
                  onToggleComposer={(composerKey) => {
                    setOpenComposerKey((currentComposerKey) =>
                      toggleThreadComposer(currentComposerKey, composerKey),
                    );
                  }}
                  openComposerKey={openComposerKey}
                  reviewId={workspace.review.id}
                  review={workspace.review}
                  snapshot={snapshot}
                  threadsByAnchor={threadsByAnchor}
                />
              ))}
            </section>
          ) : null}

          {snapshot?.status === "ready" &&
          visibleNotebooks.length === 0 ? (
            <EmptyState
              title="No reviewable notebook changes on this version"
              description="Choose another PR version from the sidebar if you want to compare a different push."
            />
          ) : null}
        </main>

        <aside className="workspace-sidebar">
          <section className="side-card">
            <h2>PR Versions</h2>
            <div className="history-list">
              {workspace.review.snapshot_history
                .slice()
                .reverse()
                .map((entry) => {
                  const href = entry.is_latest
                    ? buildSnapshotRoute(
                        workspace.review.owner,
                        workspace.review.repo,
                        workspace.review.pull_number,
                        null,
                      )
                    : buildSnapshotRoute(
                        workspace.review.owner,
                        workspace.review.repo,
                        workspace.review.pull_number,
                        entry.snapshot_index,
                      );

                  return (
                    <Link
                      className={`history-link ${
                        workspace.review.selected_snapshot_index === entry.snapshot_index
                          ? "history-link-active"
                          : ""
                      }`}
                      href={href as Route}
                      key={entry.id}
                    >
                      <span>
                        {entry.is_latest
                          ? `Latest push (${entry.snapshot_index})`
                          : `Push ${entry.snapshot_index}`}
                      </span>
                      <span className="history-caption">{entry.head_sha.slice(0, 12)}</span>
                    </Link>
                  );
                })}
            </div>
          </section>

          {primaryOpenThread ? (
            <OpenThreadRailCard
              openThreadCount={openThreads.length}
              thread={primaryOpenThread}
            />
          ) : null}
        </aside>
      </div>

      <details className="summary-card workspace-utility-card">
        <summary className="workspace-utility-summary">
          <span>
            <strong>Session &amp; review settings</strong>
            <span className="history-caption notebook-jump-summary-copy">
              Keep these nearby without interrupting the diff.
            </span>
          </span>
          <span className="muted-copy">Open only if needed</span>
        </summary>
        <div className="workspace-utility-panel">
          <p className="muted-copy">
            Refresh access, sign out, or adjust installation-scoped AI settings for{" "}
            {installationLabel}.
          </p>
          <div className="workspace-utility-actions">
            <a className="secondary-button" href={buildLoginHref(currentPath)}>
              Refresh access
            </a>
            <form action={buildWorkspaceActionPath("logout")} method="post">
              <input name="returnTo" type="hidden" value={currentPath} />
              <button className="ghost-button" type="submit">
                Sign out
              </button>
            </form>
            <Link
              className="text-link"
              href={
                buildAiGatewayRoute(
                  workspace.review.owner,
                  workspace.review.repo,
                  workspace.review.pull_number,
                ) as Route
              }
            >
              Open LiteLLM settings
            </Link>
          </div>
        </div>
      </details>
    </div>
  );
}


type SnapshotOverviewProps = {
  review: WorkspacePayload["review"];
  snapshot: ReviewSnapshotRecord;
};


function SnapshotOverview({ review, snapshot }: SnapshotOverviewProps) {
  const reviewSignalCount =
    snapshot.payload.review.notices.length +
    snapshot.flagged_findings.length +
    snapshot.reviewer_guidance.length;

  return (
    <section className="summary-card snapshot-overview-card">
      <div className="summary-head snapshot-overview-head">
        <div>
          <p className="eyebrow">PR version {snapshot.snapshot_index}</p>
          <h2 className="snapshot-overview-title">This push at a glance</h2>
          <p className="summary-text snapshot-summary-kicker">
            {snapshot.notebook_count} notebook{snapshot.notebook_count === 1 ? "" : "s"} changed ·{" "}
            {snapshot.changed_cell_count} changed cell
            {snapshot.changed_cell_count === 1 ? "" : "s"}
          </p>
        </div>
        <StatusPill
          label={formatSnapshotStatusLabel(snapshot.status)}
          tone={snapshot.status === "failed" ? "danger" : "default"}
        />
      </div>
      {snapshot.summary_text ? (
        <p className="summary-text snapshot-summary-text">{snapshot.summary_text}</p>
      ) : null}
      {reviewSignalCount > 0 ? (
        <details className="snapshot-disclosure">
          <summary>
            <span>
              Review notes
              <span className="history-caption notebook-jump-summary-copy">
                {reviewSignalCount} signal{reviewSignalCount === 1 ? "" : "s"}
              </span>
            </span>
            <span className="muted-copy">Expand</span>
          </summary>
          <div className="snapshot-disclosure-panel">
            {snapshot.payload.review.notices.length ? (
              <div className="sidebar-subsection">
                <p className="sidebar-subtitle">Heads up</p>
                <ul className="chip-list">
                  {snapshot.payload.review.notices.map((notice) => (
                    <li className="chip-item" key={notice}>
                      {notice}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {snapshot.flagged_findings.length ? (
              <div className="sidebar-subsection">
                <p className="sidebar-subtitle">Flagged findings</p>
                <ul className="text-list">
                  {snapshot.flagged_findings.map((finding, index) => (
                    <li key={`${finding.code ?? "finding"}-${index}`}>
                      {summarizeFinding(finding)}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {snapshot.reviewer_guidance.length ? (
              <div className="sidebar-subsection">
                <p className="sidebar-subtitle">Reviewer guidance</p>
                <ul className="text-list">
                  {snapshot.reviewer_guidance.map((guidance, index) => (
                    <li key={`${guidance.label ?? "guidance"}-${index}`}>
                      {summarizeGuidance(guidance)}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        </details>
      ) : null}
      <details className="snapshot-disclosure">
        <summary>Snapshot details</summary>
        <div className="snapshot-disclosure-panel">
          <div className="snapshot-strip snapshot-context-strip">
            <span>Prepared {formatTimestamp(snapshot.created_at)}</span>
            <span>
              {review.base_branch} · {snapshot.base_sha.slice(0, 12)} {"->"} {snapshot.head_sha.slice(0, 12)}
            </span>
          </div>
          <div className="snapshot-overview-stats">
            <div className="summary-metric snapshot-metric">
              <span className="summary-label">PR</span>
              <strong>#{review.pull_number}</strong>
            </div>
            <div className="summary-metric snapshot-metric">
              <span className="summary-label">Compared against</span>
              <strong>{review.base_branch}</strong>
            </div>
            <div className="summary-metric snapshot-metric">
              <span className="summary-label">Latest commit in view</span>
              <strong>{snapshot.head_sha.slice(0, 12)}</strong>
            </div>
            <div className="summary-metric snapshot-metric">
              <span className="summary-label">Thread status</span>
              <strong>
                {review.thread_counts.unresolved} open · {review.thread_counts.resolved} resolved
              </strong>
            </div>
          </div>
        </div>
      </details>
    </section>
  );
}


type NotebookCardProps = {
  review: WorkspacePayload["review"];
  reviewId: string;
  snapshot: ReviewSnapshotRecord;
  notebook: SnapshotNotebook;
  threadsByAnchor: Map<string, ReviewThread[]>;
  currentPath: string;
  openComposerKey: string | null;
  onToggleComposer: (composerKey: string) => void;
};


function NotebookCard({
  review,
  reviewId,
  snapshot,
  notebook,
  threadsByAnchor,
  currentPath,
  openComposerKey,
  onToggleComposer,
}: NotebookCardProps) {
  const [directoryLabel, fileLabel] = splitNotebookPath(notebook.path);
  const notebookThreads = getThreadsForNotebook(notebook, threadsByAnchor);
  const openThreadCount = notebookThreads.filter((thread) => thread.status === "open").length;
  const visibleRows = notebook.render_rows.filter((row) => hasVisibleBlocks(row, threadsByAnchor));
  const notebookSectionId = buildNotebookSectionId(notebook.path);
  const notebookReviewSummary = buildNotebookReviewSummary({
    firstVisibleRow: visibleRows[0] ?? null,
    reviewItemCount: visibleRows.length,
    noticeCount: notebook.notices.length,
    openThreadCount,
  });
  const notebookNotesLabel = `${notebook.notices.length} notebook ${pluralize(
    notebook.notices.length,
    "note",
  )}`;

  return (
    <section className="notebook-card notebook-card-flat" id={notebookSectionId}>
      <div className="notebook-head">
        <div>
          <h2>{fileLabel}</h2>
          <p className="notebook-subpath">{directoryLabel}</p>
        </div>
        <StatusPill label={formatChangeTypeLabel(notebook.change_type)} tone="default" />
      </div>

      <p className="notebook-review-summary">{notebookReviewSummary}</p>

      {notebook.notices.length ? (
        <details className="notebook-summary-card">
          <summary className="notebook-summary-toggle">
            <span>
              <strong>Notebook notes</strong>
              <span className="history-caption notebook-jump-summary-copy">
                {notebookNotesLabel}
              </span>
            </span>
            <span className="muted-copy">Open only if needed</span>
          </summary>
          <div className="notebook-summary-panel">
            <div className="notebook-summary-section">
              <ul className="chip-list">
                {notebook.notices.map((notice) => (
                  <li className="chip-item" key={notice}>
                    {notice}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </details>
      ) : null}

      <div className="row-stack">
        {visibleRows.map((row) => (
          <CellRowCard
            currentPath={currentPath}
            key={`${notebook.path}-${buildAnchorKey(row.thread_anchors.source)}`}
            onToggleComposer={onToggleComposer}
            openComposerKey={openComposerKey}
            review={review}
            reviewId={reviewId}
            row={row}
            snapshot={snapshot}
            threadsByAnchor={threadsByAnchor}
          />
        ))}
      </div>
    </section>
  );
}


function OpenThreadRailCard({
  thread,
  openThreadCount,
}: {
  thread: ReviewThread;
  openThreadCount: number;
}) {
  const [directoryLabel, fileLabel] = splitNotebookPath(thread.anchor.notebook_path);

  return (
    <section className="side-card side-card-compact">
      <div className="sidebar-rail-head">
        <h2>{openThreadCount === 1 ? "Open thread" : "Open threads"}</h2>
        <StatusPill label={`${openThreadCount} open`} tone="accent" />
      </div>
      <p className="muted-copy side-card-copy">
        {openThreadCount === 1
          ? "Jump back into the active discussion without scanning the full diff."
          : "Showing one active discussion so the rail stays compact."}
      </p>
      <a
        className="history-link rail-thread-link"
        href={`#${buildNotebookSectionId(thread.anchor.notebook_path)}`}
      >
        <span className="notebook-jump-copy">
          <strong>{fileLabel}</strong>
          <span className="history-caption">{directoryLabel}</span>
        </span>
        <span className="history-caption">{formatThreadAnchorSummary(thread.anchor)}</span>
      </a>
      <p className="thread-preview rail-thread-preview">{summarizeThreadPreview(thread)}</p>
    </section>
  );
}


type CellRowCardProps = {
  review: WorkspacePayload["review"];
  reviewId: string;
  snapshot: ReviewSnapshotRecord;
  row: RenderRow;
  threadsByAnchor: Map<string, ReviewThread[]>;
  currentPath: string;
  openComposerKey: string | null;
  onToggleComposer: (composerKey: string) => void;
};


function CellRowCard({
  review,
  reviewId,
  snapshot,
  row,
  threadsByAnchor,
  currentPath,
  openComposerKey,
  onToggleComposer,
}: CellRowCardProps) {
  const blocks = getVisibleBlockKinds(row, threadsByAnchor);
  const changedBlockCount = blocks.filter((blockKind) => isBlockChanged(row, blockKind)).length;

  return (
    <article className="cell-card cell-card-flat">
      <div className="cell-card-head">
        <div>
          <p className="eyebrow">{formatCellLabel(row)}</p>
          <h3>
            {formatCellTypeLabel(row.cell_type)} · {formatRowChangeLabel(row.change_type)}
          </h3>
        </div>
        <div className="cell-card-meta">
          <StatusPill
            label={`${changedBlockCount} changed block${changedBlockCount === 1 ? "" : "s"}`}
            tone="default"
          />
          <p className="cell-summary">{row.summary}</p>
        </div>
      </div>

      {row.review_context.length ? (
        <div className="context-strip">
          {row.review_context.map((context, index) => (
            <span className="context-pill" key={`${context.relative_position}-${index}`}>
              {context.relative_position}: {context.summary}
            </span>
          ))}
        </div>
      ) : null}

      <div className="block-stack">
        {blocks.map((blockKind) => {
          const anchor = row.thread_anchors[blockKind];
          const composerKey = buildAnchorKey(anchor);
          const composerId = buildThreadComposerId(anchor);
          const composerOpen = openComposerKey === composerKey;
          const threads = threadsByAnchor.get(buildAnchorKey(anchor)) ?? [];
          const threadable = canStartThread(review, snapshot, row, blockKind);

          return (
            <section className="diff-block diff-block-flat" key={blockKind}>
              <div className="diff-block-head">
                <div>
                  <h4>{blockTitle(blockKind)}</h4>
                </div>
                <div className="diff-block-meta">
                  {isBlockChanged(row, blockKind) ? (
                    <StatusPill label="changed here" tone="accent" />
                  ) : (
                    <StatusPill label="discussion only" tone="default" />
                  )}
                  {threads.length ? (
                    <StatusPill label={`${threads.length} thread${threads.length === 1 ? "" : "s"}`} tone="default" />
                  ) : null}
                  {threadable ? (
                    <button
                      aria-controls={composerId}
                      aria-expanded={composerOpen}
                      className={`${composerOpen ? "secondary-button" : "ghost-button"} thread-affordance-button`}
                      onClick={() => onToggleComposer(composerKey)}
                      type="button"
                    >
                      {composerOpen ? "Commenting" : "Add comment"}
                    </button>
                  ) : null}
                </div>
              </div>

              <BlockContent blockKind={blockKind} row={row} />

              <ThreadColumn
                anchor={anchor}
                composerId={composerId}
                composerOpen={composerOpen}
                currentPath={currentPath}
                onCancelComposer={() => onToggleComposer(composerKey)}
                reviewId={reviewId}
                snapshotId={snapshot.id}
                threadable={threadable}
                threads={threads}
              />
            </section>
          );
        })}
      </div>
    </article>
  );
}


function BlockContent({
  blockKind,
  row,
}: {
  blockKind: SnapshotBlockKind;
  row: RenderRow;
}) {
  if (!hasMeaningfulBlockContent(row, blockKind)) {
    return null;
  }

  if (blockKind === "source") {
    return (
      <div className="code-grid">
        <CodePane label="Base source" value={row.source.base} />
        <CodePane label="Head source" value={row.source.head} />
      </div>
    );
  }

  if (blockKind === "outputs") {
    const outputItems = getMeaningfulOutputItems(row);

    return (
      <div className="output-list">
        {outputItems.map((item, index) => (
          item.kind === "image" ? (
            <ImageOutputCard item={item} key={`${item.asset_id}-${index}`} />
          ) : (
            <article className="output-card" key={`${item.output_type}-${index}`}>
              <div className="output-head">
                <strong>{item.output_type}</strong>
                <div className="output-meta">
                  <span>{item.mime_group}</span>
                  <StatusPill
                    label={item.change_type}
                    tone={outputChangeTone(item.change_type)}
                  />
                </div>
              </div>
              <p>{item.summary}</p>
              {item.truncated ? (
                <span className="muted-copy">Output summary truncated</span>
              ) : null}
            </article>
          )
        ))}
      </div>
    );
  }

  return (
    <div className="metadata-card">
      <p>{row.metadata.summary}</p>
    </div>
  );
}


function ImageOutputCard({
  item,
}: {
  item: Extract<RenderRow["outputs"]["items"][number], { kind: "image" }>;
}) {
  return (
    <article className="output-card image-output-card">
      <div className="output-head">
        <strong>Notebook image output</strong>
        <div className="output-meta">
          <span>{item.mime_type}</span>
          <StatusPill label={item.change_type} tone={outputChangeTone(item.change_type)} />
        </div>
      </div>
      <div className="output-image-frame">
        <Image
          alt={`Notebook output image (${item.mime_type})`}
          className="output-image"
          height={item.height ?? 675}
          loading="lazy"
          src={buildApiHref(`/api/review-assets/${item.asset_id}`)}
          unoptimized
          width={item.width ?? 1200}
        />
      </div>
      <p className="muted-copy">
        {item.width && item.height
          ? `${item.width} x ${item.height} px`
          : "Dimensions unavailable"}
      </p>
    </article>
  );
}


function CodePane({
  label,
  value,
}: {
  label: string;
  value: string | null;
}) {
  return (
    <div className="code-pane">
      <span className="code-pane-label">{label}</span>
      <pre>{value && value.length > 0 ? value : "No source on this side."}</pre>
    </div>
  );
}


type ThreadColumnProps = {
  reviewId: string;
  snapshotId: string;
  anchor: ThreadAnchor;
  threads: ReviewThread[];
  threadable: boolean;
  currentPath: string;
  composerOpen: boolean;
  composerId: string;
  onCancelComposer: () => void;
};


function ThreadColumn({
  reviewId,
  snapshotId,
  anchor,
  threads,
  threadable,
  currentPath,
  composerOpen,
  composerId,
  onCancelComposer,
}: ThreadColumnProps) {
  const showThreadingNote = !threadable && threads.length === 0;

  return (
    <div className="thread-column">
      {threadable && composerOpen ? (
        <InlineThreadComposer
          anchor={anchor}
          composerId={composerId}
          currentPath={currentPath}
          onCancel={onCancelComposer}
          reviewId={reviewId}
          snapshotId={snapshotId}
        />
      ) : null}

      {showThreadingNote ? (
        <p className="muted-copy">
          New threads can only start on changed areas in the latest ready snapshot.
        </p>
      ) : null}

      {threads.length ? (
        <div className="thread-stack">
          {threads.map((thread) => (
            <ThreadCard currentPath={currentPath} key={thread.id} thread={thread} />
          ))}
        </div>
      ) : null}
    </div>
  );
}


function InlineThreadComposer({
  reviewId,
  snapshotId,
  anchor,
  currentPath,
  composerId,
  onCancel,
}: {
  reviewId: string;
  snapshotId: string;
  anchor: ThreadAnchor;
  currentPath: string;
  composerId: string;
  onCancel: () => void;
}) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    const focusHandle = window.requestAnimationFrame(() => {
      textareaRef.current?.focus();
    });

    return () => {
      window.cancelAnimationFrame(focusHandle);
    };
  }, []);

  return (
    <form
      action={buildWorkspaceActionPath("create-thread")}
      className="thread-form thread-form-inline"
      id={composerId}
      method="post"
    >
      <input name="returnTo" type="hidden" value={currentPath} />
      <input name="reviewId" type="hidden" value={reviewId} />
      <input name="snapshotId" type="hidden" value={snapshotId} />
      <input name="anchorJson" type="hidden" value={JSON.stringify(anchor)} />
      <div className="thread-form-inline-head">
        <strong>Start a thread</strong>
        <span className="muted-copy">Keep it attached to this block.</span>
      </div>
      <textarea
        autoFocus
        name="bodyMarkdown"
        placeholder="Ask for context, call out a regression, or note the follow-up you want here."
        ref={textareaRef}
        required
        rows={3}
      />
      <div className="thread-form-actions">
        <span className="muted-copy">Posts to this review block.</span>
        <button className="ghost-button thread-inline-button" onClick={onCancel} type="button">
          Cancel
        </button>
        <button className="primary-button thread-inline-button" type="submit">
          Create thread
        </button>
      </div>
    </form>
  );
}


function ThreadCard({
  thread,
  currentPath,
}: {
  thread: ReviewThread;
  currentPath: string;
}) {
  const mirrorStatus = summarizeGitHubMirrorStatus(thread);
  const authorLabel = thread.messages[0]?.author_login ?? "NotebookLens reviewer";
  const previewText = summarizeThreadPreview(thread);
  const messageCount = thread.messages.length;

  return (
    <details className="thread-card thread-card-flat thread-details">
      <summary className="thread-summary">
        <div className="thread-summary-main">
          <div className="thread-heading-copy">
            <strong>{authorLabel}</strong>
            <p className="thread-preview">{previewText}</p>
          </div>
          <div className="thread-head-pills">
            <StatusPill label={thread.status} tone={threadTone(thread.status)} />
            {thread.carried_forward ? <StatusPill label="continued here" tone="accent" /> : null}
          </div>
        </div>
        <div className="thread-secondary-row">
          <span className="muted-copy">
            Started {formatTimestamp(thread.created_at)} · {messageCount} message{messageCount === 1 ? "" : "s"}
          </span>
          <span className="muted-copy thread-mirror-note" title={mirrorStatus.description}>
            GitHub: {mirrorStatus.label}
          </span>
        </div>
      </summary>

      {(thread.github_root_comment_url || thread.github_last_mirrored_at) ? (
        <div className="thread-secondary-row thread-secondary-row-expanded">
          <span className="muted-copy thread-mirror-note" title={mirrorStatus.description}>
            GitHub: {mirrorStatus.label}
          </span>
          <div className="thread-secondary-links">
            {thread.github_root_comment_url && mirrorStatus.linkLabel ? (
              <a
                className="text-link"
                href={thread.github_root_comment_url}
                rel="noreferrer"
                target="_blank"
              >
                {mirrorStatus.linkLabel}
              </a>
            ) : null}
            {thread.github_last_mirrored_at ? (
              <span className="muted-copy">
                Last update {formatTimestamp(thread.github_last_mirrored_at)}
              </span>
            ) : null}
          </div>
        </div>
      ) : null}

      <div className="message-stack">
        {thread.messages.map((message) => (
          <div className="message-card" key={message.id}>
            <div className="message-meta">
              <strong>{message.author_login}</strong>
              <div className="message-meta-links">
                <span>{formatTimestamp(message.created_at)}</span>
                {message.github_reply_comment_url ? (
                  <a
                    className="text-link"
                    href={message.github_reply_comment_url}
                    rel="noreferrer"
                    target="_blank"
                  >
                    Mirrored reply
                  </a>
                ) : null}
              </div>
            </div>
            <p className="message-body">{message.body_markdown}</p>
          </div>
        ))}
      </div>

      <div className="thread-actions">
        <details className="reply-details">
          <summary>Quick reply</summary>
          <form
            action={buildWorkspaceActionPath("reply-thread")}
            className="thread-form thread-form-reply"
            method="post"
          >
            <input name="returnTo" type="hidden" value={currentPath} />
            <input name="threadId" type="hidden" value={thread.id} />
            <textarea
              name="bodyMarkdown"
              placeholder="Add context or answer the open question."
              required
              rows={3}
            />
            <div className="thread-form-actions">
              <span className="muted-copy">Reply in place.</span>
              <button className="primary-button" type="submit">
                Add reply
              </button>
            </div>
          </form>
        </details>

        {thread.status === "resolved" ? (
          <form action={buildWorkspaceActionPath("reopen-thread")} method="post">
            <input name="returnTo" type="hidden" value={currentPath} />
            <input name="threadId" type="hidden" value={thread.id} />
            <button className="secondary-button" type="submit">
              Reopen
            </button>
          </form>
        ) : (
          <form action={buildWorkspaceActionPath("resolve-thread")} method="post">
            <input name="returnTo" type="hidden" value={currentPath} />
            <input name="threadId" type="hidden" value={thread.id} />
            <button className="secondary-button" type="submit">
              Resolve
            </button>
          </form>
        )}
      </div>
    </details>
  );
}


function summarizeThreadPreview(thread: ReviewThread): string {
  const body = thread.messages[0]?.body_markdown?.replace(/\s+/g, " ").trim();

  if (!body) {
    return "Open the thread for the full discussion.";
  }

  if (body.length <= 110) {
    return body;
  }

  return `${body.slice(0, 107).trimEnd()}...`;
}


function StatusPill({
  label,
  tone,
}: {
  label: string;
  tone: "default" | "accent" | "success" | "warning" | "danger";
}) {
  return <span className={`status-pill tone-${tone}`}>{label}</span>;
}


function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <section className="summary-card empty-state-card">
      <p className="eyebrow">Review status</p>
      <h2>{title}</h2>
      <p className="muted-copy">{description}</p>
    </section>
  );
}


function blockTitle(blockKind: SnapshotBlockKind): string {
  if (blockKind === "source") {
    return "Code changes";
  }
  if (blockKind === "outputs") {
    return "Output changes";
  }
  return "Metadata changes";
}


function formatTimestamp(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}


function threadTone(status: ReviewThread["status"]): "accent" | "success" | "warning" {
  if (status === "resolved") {
    return "success";
  }
  if (status === "outdated") {
    return "warning";
  }
  return "accent";
}


function outputChangeTone(
  changeType: "added" | "removed" | "modified",
): "accent" | "warning" | "default" {
  if (changeType === "added") {
    return "accent";
  }
  if (changeType === "removed") {
    return "warning";
  }
  return "default";
}


function formatReviewStatusLabel(status: WorkspacePayload["review"]["status"]): string {
  if (status === "ready") {
    return "Review ready";
  }
  if (status === "pending") {
    return "Preparing review";
  }
  if (status === "failed") {
    return "Needs attention";
  }
  return "Review closed";
}


function formatSnapshotStatusLabel(status: ReviewSnapshotRecord["status"]): string {
  if (status === "ready") {
    return "Ready to review";
  }
  if (status === "pending") {
    return "Preparing";
  }
  return "Needs attention";
}


function formatChangeTypeLabel(changeType: SnapshotNotebook["change_type"]): string {
  if (changeType === "modified") {
    return "updated";
  }
  if (changeType === "added") {
    return "new";
  }
  if (changeType === "deleted") {
    return "removed";
  }
  return changeType;
}


function formatCellTypeLabel(cellType: RenderRow["cell_type"]): string {
  if (cellType === "code") {
    return "Code cell";
  }
  if (cellType === "markdown") {
    return "Markdown cell";
  }
  return "Raw cell";
}


function formatRowChangeLabel(changeType: RenderRow["change_type"]): string {
  if (changeType === "modified") {
    return "updated";
  }
  if (changeType === "added") {
    return "added";
  }
  if (changeType === "deleted") {
    return "removed";
  }
  if (changeType === "output_changed") {
    return "outputs changed";
  }
  return "moved";
}


function splitNotebookPath(path: string): [string, string] {
  const parts = path.split("/");
  const fileLabel = parts.pop() ?? path;
  const directoryLabel = parts.length ? parts.join(" / ") : "Repository root";
  return [directoryLabel, fileLabel];
}


function countThreadsForNotebook(
  notebook: SnapshotNotebook,
  threadsByAnchor: Map<string, ReviewThread[]>,
): number {
  return getThreadsForNotebook(notebook, threadsByAnchor).length;
}


function getThreadsForNotebook(
  notebook: SnapshotNotebook,
  threadsByAnchor: Map<string, ReviewThread[]>,
): ReviewThread[] {
  const seen = new Set<string>();
  const notebookThreads: ReviewThread[] = [];

  for (const row of notebook.render_rows) {
    for (const anchor of Object.values(row.thread_anchors)) {
      const threads = threadsByAnchor.get(buildAnchorKey(anchor)) ?? [];
      for (const thread of threads) {
        if (!seen.has(thread.id)) {
          seen.add(thread.id);
          notebookThreads.push(thread);
        }
      }
    }
  }

  return notebookThreads;
}


function buildNotebookSectionId(path: string): string {
  return `notebook-${path
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")}`;
}


function buildThreadComposerId(anchor: ThreadAnchor): string {
  return `thread-composer-${buildAnchorKey(anchor)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")}`;
}


function buildNotebookReviewSummary({
  firstVisibleRow,
  reviewItemCount,
  noticeCount,
  openThreadCount,
}: {
  firstVisibleRow: RenderRow | null;
  reviewItemCount: number;
  noticeCount: number;
  openThreadCount: number;
}): string | null {
  const sentences: string[] = [];

  if (firstVisibleRow) {
    const firstRowSummary = firstVisibleRow.summary.trim();
    const firstRowLabel = formatCellLabel(firstVisibleRow);
    sentences.push(
      firstRowSummary
        ? `First changed row: ${firstRowLabel}. ${firstRowSummary}`
        : `First changed row: ${firstRowLabel}.`,
    );
    if (reviewItemCount > 1) {
      const remainingCount = reviewItemCount - 1;
      sentences.push(`${remainingCount} more ${pluralize(remainingCount, "changed row")}.`);
    }
  } else if (noticeCount > 0) {
    sentences.push(`Notebook notes only. ${noticeCount} ${pluralize(noticeCount, "note")}.`);
  }

  if (openThreadCount > 0) {
    sentences.push(`${openThreadCount} open ${pluralize(openThreadCount, "thread")}.`);
  }

  if (noticeCount > 0 && firstVisibleRow) {
    sentences.push(`${noticeCount} notebook ${pluralize(noticeCount, "note")}.`);
  }

  if (sentences.length === 0) {
    return "Notebook change ready for review.";
  }

  return sentences.join(" ");
}


function formatThreadAnchorSummary(anchor: ThreadAnchor): string {
  const displayIndex = anchor.cell_locator.display_index;
  const cellLabel = displayIndex === null ? "Notebook-level" : `Cell ${displayIndex}`;

  return `${cellLabel} · ${blockTitle(anchor.block_kind)}`;
}


function pluralize(count: number, singular: string): string {
  return count === 1 ? singular : `${singular}s`;
}

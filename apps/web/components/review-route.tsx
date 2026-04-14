import Link from "next/link";
import { notFound } from "next/navigation";

import { ApiRequestError, buildLoginHref, getReviewWorkspace, getSnapshotWorkspace } from "@/lib/api";
import { readFlashNotice } from "@/lib/review-workspace";
import { ReviewWorkspace } from "@/components/review-workspace";


type ReviewRouteProps = {
  owner: string;
  repo: string;
  pullNumber: number;
  snapshotIndex?: number;
  currentPath: string;
  searchParams: Record<string, string | string[] | undefined>;
};


export async function ReviewRoute(props: ReviewRouteProps) {
  const { currentPath, owner, pullNumber, repo, searchParams, snapshotIndex } = props;

  try {
    const workspace =
      snapshotIndex === undefined
        ? await getReviewWorkspace(owner, repo, pullNumber)
        : await getSnapshotWorkspace(owner, repo, pullNumber, snapshotIndex);

    return (
      <ReviewWorkspace
        currentPath={currentPath}
        flashNotice={readFlashNotice(searchParams)}
        workspace={workspace}
      />
    );
  } catch (error) {
    if (error instanceof ApiRequestError) {
      if (error.status === 401) {
        return (
          <AuthWall
            currentPath={currentPath}
            owner={owner}
            pullNumber={pullNumber}
            repo={repo}
            snapshotIndex={snapshotIndex}
          />
        );
      }

      if (error.status === 404) {
        notFound();
      }

      return <ErrorWall detail={error.detail} />;
    }

    throw error;
  }
}


type AuthWallProps = {
  currentPath: string;
  owner: string;
  repo: string;
  pullNumber: number;
  snapshotIndex?: number;
};


function AuthWall({
  currentPath,
  owner,
  pullNumber,
  repo,
  snapshotIndex,
}: AuthWallProps) {
  const reviewIdentity = `${owner}/${repo} · PR #${pullNumber}`;
  const reviewContext =
    snapshotIndex === undefined
      ? reviewIdentity
      : `${reviewIdentity} · Push ${snapshotIndex}`;

  return (
    <main className="center-stage">
      <section className="hero-card compact-card wall-card">
        <p className="eyebrow">Review access</p>
        <h1>{reviewContext}</h1>
        <p className="hero-summary">
          Sign in with GitHub so NotebookLens can confirm your access to this pull
          request review and bring you back to the same workspace page.
        </p>
        <ul className="wall-list">
          <li>Use the GitHub account that can already open {owner}/{repo}.</li>
          <li>Make sure the NotebookLens GitHub App is installed on this repository.</li>
          <li>Reopen the `NotebookLens Review Workspace` check run when you want the fastest path back here.</li>
        </ul>
        <p className="muted-copy">
          After sign-in, NotebookLens continues directly to this review instead of
          sending you to a generic landing page.
        </p>
        <div className="wall-actions">
          <a className="primary-button" href={buildLoginHref(currentPath)}>
            Continue to {reviewContext}
          </a>
          <Link className="secondary-button" href="/">
            Back to home
          </Link>
        </div>
      </section>
    </main>
  );
}


function ErrorWall({ detail }: { detail: string }) {
  return (
    <main className="center-stage">
      <section className="hero-card compact-card wall-card">
        <p className="eyebrow">Review unavailable</p>
        <h1>NotebookLens could not open this pull request review</h1>
        <p className="hero-summary">{detail}</p>
        <ul className="wall-list">
          <li>Confirm the GitHub check run finished for the latest push.</li>
          <li>Make sure your GitHub session still has access to the repository.</li>
          <li>Retry from the pull request after refreshing your NotebookLens sign-in.</li>
        </ul>
        <p className="muted-copy">
          Reopening the `NotebookLens Review Workspace` check run from GitHub is usually
          the fastest way back to the right page.
        </p>
        <div className="wall-actions">
          <Link className="secondary-button" href="/">
            Return home
          </Link>
        </div>
      </section>
    </main>
  );
}

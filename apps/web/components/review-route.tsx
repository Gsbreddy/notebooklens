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
        return <AuthWall currentPath={currentPath} />;
      }

      if (error.status === 404) {
        notFound();
      }

      return <ErrorWall detail={error.detail} />;
    }

    throw error;
  }
}


function AuthWall({ currentPath }: { currentPath: string }) {
  return (
    <main className="center-stage">
      <section className="hero-card compact-card wall-card">
        <p className="eyebrow">Managed Review Access</p>
        <h1>Sign in with GitHub to open this review workspace</h1>
        <p className="hero-summary">
          NotebookLens checks repository visibility with your GitHub OAuth
          session before it loads snapshot history, rendered outputs, or inline
          discussion threads.
        </p>
        <ul className="wall-list">
          <li>Make sure the NotebookLens GitHub App is installed on this repository.</li>
          <li>Open the review route from a GitHub check run when possible.</li>
          <li>Use the same GitHub account that can already view the pull request.</li>
        </ul>
        <p className="muted-copy">
          If you just completed installation, GitHub may take a moment to redirect you
          back into the correct review route.
        </p>
        <div className="wall-actions">
          <a className="primary-button" href={buildLoginHref(currentPath)}>
            Continue with GitHub
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
        <p className="eyebrow">Workspace Error</p>
        <h1>NotebookLens could not load this review</h1>
        <p className="hero-summary">{detail}</p>
        <ul className="wall-list">
          <li>Confirm the workspace check run finished for the latest PR push.</li>
          <li>Make sure your GitHub session still has access to the repository.</li>
          <li>Retry from the pull request after refreshing your NotebookLens access.</li>
        </ul>
        <p className="muted-copy">
          NotebookLens keeps the PR check run as the canonical entry point, so reopening
          the check run is usually the fastest way back to a healthy review route.
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

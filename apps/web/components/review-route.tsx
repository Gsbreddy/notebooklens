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
        <p className="eyebrow">Review access</p>
        <h1>Sign in with GitHub to open this pull request review</h1>
        <p className="hero-summary">
          NotebookLens checks your GitHub access before it shows notebook changes,
          outputs, and review threads for this pull request.
        </p>
        <ul className="wall-list">
          <li>Make sure the NotebookLens GitHub App is installed on this repository.</li>
          <li>Open this page from the `NotebookLens Review Workspace` check run when possible.</li>
          <li>Use the same GitHub account that can already view the pull request.</li>
        </ul>
        <p className="muted-copy">
          If you just installed the app or signed in, GitHub may take a moment to send
          you back to the right review page.
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
        <p className="eyebrow">Review problem</p>
        <h1>NotebookLens could not open this pull request review</h1>
        <p className="hero-summary">{detail}</p>
        <ul className="wall-list">
          <li>Confirm the workspace check run finished for the latest push.</li>
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

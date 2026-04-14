import { buildLoginHref } from "@/lib/api";

export default function HomePage() {
  return (
    <main className="center-stage home-stage">
      <section className="hero-card landing-hero">
        <div className="hero-copy">
          <p className="eyebrow">NotebookLens Review Workspace</p>
          <h1>Open notebook reviews from the pull request and get straight to what changed</h1>
          <p className="hero-summary">
            NotebookLens turns changed <code>.ipynb</code> files into a
            review workspace with visual diffs, changed outputs, reviewer
            guidance, and inline discussion.
          </p>
          <p className="hero-subsummary">
            Install the app, open a pull request with notebook changes, and jump into
            one review page instead of piecing context together from raw notebook JSON
            and scattered comments.
          </p>
          <div className="hero-meta">
            <span className="status-pill tone-accent">Managed workspace beta</span>
            <span className="status-pill tone-default">Built for DS and ML teams</span>
            <span className="status-pill tone-success">GitHub App + OAuth</span>
          </div>
        </div>

        <div className="hero-actions landing-actions">
          <a className="primary-button" href={buildLoginHref("/")}>
            Sign in with GitHub
          </a>
          <a
            className="secondary-button"
            href="https://github.com/Gsbreddy/notebooklens#readme"
            rel="noreferrer"
            target="_blank"
          >
            Read setup docs
          </a>
        </div>
      </section>

      <section className="landing-grid">
        <article className="summary-card landing-card">
          <p className="eyebrow">Shortest Evaluator Flow</p>
          <h2>How teams usually try NotebookLens</h2>
          <ol className="landing-list">
            <li>Install the NotebookLens GitHub App on a repo with notebooks.</li>
            <li>Sign in here with GitHub OAuth.</li>
            <li>Open or update a pull request with notebook changes.</li>
            <li>Open the “NotebookLens Review Workspace” check run from GitHub.</li>
            <li>Review the latest changes and start inline threads on the parts that matter.</li>
          </ol>
        </article>

        <article className="summary-card landing-card">
          <p className="eyebrow">Before You Start</p>
          <h2>Three things must be true</h2>
          <ul className="landing-list">
            <li>The GitHub App is installed on the repository you want to review.</li>
            <li>Your GitHub account can see that repository and pull request.</li>
            <li>The PR already shows a NotebookLens workspace check run.</li>
          </ul>
          <p className="muted-copy">
            If any of those are missing, the review route usually lands on an
            auth, not-found, or empty snapshot state.
          </p>
        </article>

        <article className="summary-card landing-card">
          <p className="eyebrow">What You See In The Workspace</p>
          <h2>One review page, three layers of context</h2>
          <div className="landing-feature-stack">
            <div className="landing-feature">
              <strong>PR version history</strong>
              <p className="muted-copy">
                Compare the latest push with earlier review versions when context is missing.
              </p>
            </div>
            <div className="landing-feature">
              <strong>Notebook-aware diffs</strong>
              <p className="muted-copy">
                Compare source, outputs, metadata, and rendered images in one place.
              </p>
            </div>
            <div className="landing-feature">
              <strong>Inline review threads</strong>
              <p className="muted-copy">
                Keep questions and decisions attached to the exact changed block.
              </p>
            </div>
          </div>
        </article>

        <article className="summary-card landing-card landing-card-wide">
          <p className="eyebrow">Why Teams Use It</p>
          <h2>Notebook review without leaving the PR workflow</h2>
          <div className="landing-feature-stack two-column-feature-stack">
            <div className="landing-feature">
              <strong>Stay anchored to GitHub</strong>
              <p className="muted-copy">
                Reviews still start from a pull request check run, so DS/ML teams keep
                the repo workflow they already know.
              </p>
            </div>
            <div className="landing-feature">
              <strong>See the context reviewers actually need</strong>
              <p className="muted-copy">
                Changed outputs, notebook context, and inline threads stay attached to
                the exact notebook sections under review.
              </p>
            </div>
          </div>
        </article>
      </section>
    </main>
  );
}

import { buildLoginHref } from "@/lib/api";

export default function HomePage() {
  return (
    <main className="center-stage home-stage">
      <section className="hero-card landing-hero">
        <div className="hero-copy">
          <p className="eyebrow">NotebookLens Review Workspace</p>
          <h1>Open hosted notebook reviews straight from a GitHub pull request</h1>
          <p className="hero-summary">
            NotebookLens turns changed <code>.ipynb</code> files into a
            review workspace with snapshot history, image-aware diffs, reviewer
            guidance, and inline discussion threads.
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
            href="https://notebooklens.github.io/notebooklens/"
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
          <h2>How teams usually test NotebookLens</h2>
          <ol className="landing-list">
            <li>Install the NotebookLens GitHub App on a repo with notebooks.</li>
            <li>Sign in here with GitHub OAuth.</li>
            <li>Open or update a pull request with notebook changes.</li>
            <li>Open the “NotebookLens Review Workspace” check run from GitHub.</li>
            <li>Review the latest snapshot and start inline threads on changed blocks.</li>
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
          <h2>One review route, three layers of context</h2>
          <div className="landing-feature-stack">
            <div className="landing-feature">
              <strong>Snapshot history</strong>
              <p className="muted-copy">
                Switch between PR revisions without losing thread context.
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
      </section>
    </main>
  );
}

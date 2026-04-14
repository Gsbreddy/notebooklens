import { buildLoginHref } from "@/lib/api";

const WORKSPACE_QUICKSTART_URL =
  "https://notebooklens.github.io/notebooklens/quickstart-workspace/";
const EXAMPLES_URL = "https://notebooklens.github.io/notebooklens/examples/";
const REPOSITORY_URL = "https://github.com/notebooklens/notebooklens";

export default function HomePage() {
  return (
    <main className="center-stage home-stage">
      <section className="hero-card landing-hero landing-hero-compact">
        <div className="hero-copy">
          <p className="eyebrow">NotebookLens Review Workspace</p>
          <h1>Review notebook pull requests in one workspace instead of decoding raw <code>.ipynb</code> diffs.</h1>
          <p className="hero-summary">
            Open the GitHub check run and land on the latest notebook snapshot
            with changed cells, outputs, and inline threads already anchored to
            the parts reviewers need to inspect.
          </p>
          <p className="hero-subsummary landing-support-copy">
            Need the full flow or a second proof point? Check the{" "}
            <a
              className="landing-inline-link"
              href={EXAMPLES_URL}
              rel="noreferrer"
              target="_blank"
            >
              current examples
            </a>{" "}
            and{" "}
            <a
              className="landing-inline-link"
              href={REPOSITORY_URL}
              rel="noreferrer"
              target="_blank"
            >
              repository docs
            </a>
            .
          </p>
        </div>
      </section>

      <section className="landing-proof-layout">
        <article className="summary-card landing-proof-card">
          <div className="summary-head">
            <div>
              <p className="eyebrow">Proof</p>
              <h2>What reviewers actually open</h2>
              <p className="summary-text">
                A compact view of the current GitHub check run plus the
                notebook-aware workspace it opens.
              </p>
            </div>
          </div>

          <div className="landing-proof-stack">
            <div className="landing-checkrun-card">
              <div className="landing-checkrun-head">
                <strong>NotebookLens Review Workspace</strong>
                <span className="status-pill tone-default">latest snapshot ready</span>
              </div>
              <p className="landing-checkrun-copy">
                1 open thread · 0 resolved · Open in NotebookLens
              </p>
            </div>

            <div className="landing-proof-surface">
              <div className="landing-proof-strip">
                <div>
                  <p className="eyebrow">Workspace snapshot</p>
                  <h3 className="landing-proof-title">acme/forecasting · PR #128</h3>
                </div>
                <div className="landing-proof-meta">
                  <span className="status-pill tone-default">reviewing latest push</span>
                  <span className="status-pill tone-accent">1 open</span>
                </div>
              </div>

              <div className="landing-proof-grid">
                <div className="summary-metric landing-proof-metric">
                  <span className="summary-label">Notebook</span>
                  <strong>sales_forecast.ipynb</strong>
                </div>
                <div className="summary-metric landing-proof-metric">
                  <span className="summary-label">Review surface</span>
                  <strong>Changed output plot + markdown diff</strong>
                </div>
              </div>

              <ul className="landing-list landing-proof-list">
                <li>Inspect the changed notebook output without leaving the review surface.</li>
                <li>See the latest snapshot context before replying on the PR.</li>
                <li>Keep one inline thread attached to the exact changed block.</li>
              </ul>

              <div className="landing-proof-thread">
                <span className="summary-label">Open thread</span>
                <strong>Explain whether the widened confidence band is expected.</strong>
              </div>
            </div>
          </div>
        </article>

        <div className="landing-path-stack">
          <article className="summary-card landing-path-card">
            <p className="eyebrow">Install path</p>
            <h2>Set up the GitHub App review flow</h2>
            <p className="muted-copy">
              Use the current workspace quick start to install the app, open a
              notebook PR, and launch the check run.
            </p>
            <a
              className="primary-button"
              href={WORKSPACE_QUICKSTART_URL}
              rel="noreferrer"
              target="_blank"
            >
              Open workspace quick start
            </a>
          </article>

          <article className="summary-card landing-path-card">
            <p className="eyebrow">Sign-in path</p>
            <h2>Open the workspace with GitHub</h2>
            <p className="muted-copy">
              Sign in with the GitHub account that already has access to the
              repository and pull request.
            </p>
            <a className="secondary-button" href={buildLoginHref("/")}>
              Sign in with GitHub
            </a>
          </article>
        </div>
      </section>
    </main>
  );
}

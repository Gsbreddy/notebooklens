import { buildLoginHref } from "@/lib/public-hrefs";

const WORKSPACE_QUICKSTART_URL =
  "https://notebooklens.github.io/notebooklens/quickstart-workspace/";
const EXAMPLES_URL = "https://notebooklens.github.io/notebooklens/examples/";
const REPOSITORY_URL = "https://github.com/notebooklens/notebooklens";

export default function HomePage() {
  return (
    <main className="center-stage home-stage">
      <section className="hero-card landing-hero landing-hero-priority">
        <div className="hero-copy landing-hero-copy">
          <p className="eyebrow">NotebookLens Review Workspace</p>
          <h1>
            Review notebook pull requests at the exact cells, outputs, and
            threads that changed.
          </h1>
          <p className="hero-summary">
            Sign in with GitHub and jump from the PR check run to the latest
            push with notebook-aware context already anchored where reviewers
            need to inspect.
          </p>
        </div>

        <div className="landing-hero-panel">
          <p className="eyebrow">Primary path</p>
          <h2>Open the workspace with GitHub</h2>
          <p className="muted-copy">
            Use the GitHub account that already has access to the repository
            and pull request.
          </p>
          <div className="hero-actions landing-actions landing-hero-actions">
            <a className="primary-button" href={buildLoginHref("/")}>
              Sign in with GitHub
            </a>
          </div>
          <p className="hero-subsummary landing-hero-note">
            Need to install the GitHub App first?{" "}
            <a
              className="landing-inline-link"
              href={WORKSPACE_QUICKSTART_URL}
              rel="noreferrer"
              target="_blank"
            >
              Open workspace quick start
            </a>
            .
          </p>
        </div>
      </section>

      <section className="landing-proof-layout">
        <article className="summary-card landing-proof-card">
          <div className="summary-head">
            <div>
              <p className="eyebrow">After sign-in</p>
              <h2>What reviewers actually open</h2>
              <p className="summary-text">
                An illustrated snapshot of the current GitHub check run plus
                the notebook-aware workspace it opens on the latest push.
              </p>
            </div>
          </div>

          <div className="landing-proof-stack">
            <figure
              aria-labelledby="landing-proof-preview-caption"
              className="landing-proof-figure"
            >
              <figcaption
                className="landing-proof-banner"
                id="landing-proof-preview-caption"
              >
                <span className="landing-proof-banner-label">
                  Illustration only
                </span>
                <span className="landing-proof-banner-copy">
                  Static preview of the GitHub check run opening the latest
                  notebook-aware review workspace.
                </span>
              </figcaption>

              <div className="landing-checkrun-card">
                <div className="landing-checkrun-head">
                  <strong>NotebookLens Review Workspace</strong>
                  <span className="status-pill tone-default">
                    latest push ready
                  </span>
                </div>
                <p className="landing-checkrun-copy">
                  1 open thread · 0 resolved · GitHub handoff to workspace
                </p>
              </div>

              <div className="landing-proof-surface">
                <div className="landing-proof-strip">
                  <div>
                    <p className="eyebrow">Workspace preview</p>
                    <h3 className="landing-proof-title">
                      acme/forecasting · PR #128
                    </h3>
                  </div>
                  <div className="landing-proof-meta">
                    <span className="status-pill tone-default">
                      reviewing latest push
                    </span>
                    <span className="status-pill tone-accent">1 open</span>
                  </div>
                </div>

                <div className="landing-proof-grid">
                  <div className="summary-metric landing-proof-metric">
                    <span className="summary-label">Notebook</span>
                    <strong>sales_forecast.ipynb</strong>
                  </div>
                  <div className="summary-metric landing-proof-metric">
                    <span className="summary-label">What changed</span>
                    <strong>Changed output plot + markdown diff</strong>
                  </div>
                </div>

                <ul className="landing-list landing-proof-list">
                  <li>Changed notebook output stays visible inside the review.</li>
                  <li>Latest push context stays attached before replying on the PR.</li>
                  <li>Inline discussion stays anchored to the exact changed block.</li>
                </ul>

                <div className="landing-proof-thread">
                  <span className="summary-label">Example thread</span>
                  <strong>
                    Explain whether the widened confidence band is expected.
                  </strong>
                </div>
              </div>
            </figure>
          </div>
        </article>

        <article className="summary-card landing-support-card">
          <p className="eyebrow">Need setup first?</p>
          <h2>Install the GitHub App review flow</h2>
          <p className="muted-copy">
            Use the quick start to install the app, open a notebook pull
            request, and launch the review workspace check run.
          </p>
          <a
            className="secondary-button"
            href={WORKSPACE_QUICKSTART_URL}
            rel="noreferrer"
            target="_blank"
          >
            Open workspace quick start
          </a>
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
        </article>
      </section>
    </main>
  );
}

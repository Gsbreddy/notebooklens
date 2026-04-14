import { buildLoginHref } from "@/lib/api";

export default function HomePage() {
  return (
    <main className="center-stage home-stage">
      <section className="hero-card landing-hero">
        <div className="hero-copy">
          <p className="eyebrow">NotebookLens Review Workspace</p>
          <h1>Review notebook changes without decoding raw JSON diffs</h1>
          <p className="hero-summary">
            NotebookLens turns changed <code>.ipynb</code> files into a
            review workspace with visual diffs, changed outputs, reviewer
            guidance, and inline discussion.
          </p>
          <p className="hero-subsummary">
            Open the GitHub check run and land on one reviewer-oriented page with the
            notebook context that usually gets lost: changed cells, outputs, PR version
            history, and inline threads.
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
        <article className="summary-card landing-card landing-card-primary">
          <p className="eyebrow">Why Reviewers Like It</p>
          <h2>See the notebook context that PR diffs usually hide</h2>
          <div className="landing-feature-stack">
            <div className="landing-feature">
              <strong>Notebook-aware diffs</strong>
              <p className="muted-copy">
                Compare source, outputs, metadata, and rendered images in one review surface.
              </p>
            </div>
            <div className="landing-feature">
              <strong>Inline review threads</strong>
              <p className="muted-copy">
                Keep questions and follow-ups attached to the exact changed block under review.
              </p>
            </div>
            <div className="landing-feature">
              <strong>PR version history</strong>
              <p className="muted-copy">
                Revisit earlier pushes without losing the context around why something changed.
              </p>
            </div>
          </div>
        </article>

        <article className="summary-card landing-card">
          <p className="eyebrow">Fastest Way To Try It</p>
          <h2>Most teams can evaluate NotebookLens in one PR</h2>
          <ol className="landing-list">
            <li>Install the NotebookLens GitHub App on a repo with notebooks.</li>
            <li>Open or update a pull request with notebook changes.</li>
            <li>Open the “NotebookLens Review Workspace” check run from GitHub.</li>
            <li>Sign in with GitHub if prompted.</li>
            <li>Review the latest notebook changes and start threads where they matter.</li>
          </ol>
          <p className="muted-copy">
            Hosted access is still beta, so some teams will still be onboarding or using self-hosted deployments.
          </p>
        </article>

        <article className="summary-card landing-card">
          <p className="eyebrow">What You Need</p>
          <h2>Just enough to open a review</h2>
          <div className="landing-checks">
            <div className="landing-check">
              <strong>GitHub App installed</strong>
              <p className="muted-copy">NotebookLens needs repo access before a workspace check run can appear.</p>
            </div>
            <div className="landing-check">
              <strong>Notebook PR</strong>
              <p className="muted-copy">The hosted workspace opens for pull requests that actually include <code>.ipynb</code> changes.</p>
            </div>
            <div className="landing-check">
              <strong>Repo access</strong>
              <p className="muted-copy">Use a GitHub account that can already see the target repository and pull request.</p>
            </div>
          </div>
        </article>

        <article className="summary-card landing-card landing-card-wide">
          <p className="eyebrow">What Opens In The Workspace</p>
          <h2>One review surface for the parts that usually get lost</h2>
          <div className="landing-feature-stack two-column-feature-stack">
            <div className="landing-feature">
              <strong>Stay anchored to GitHub</strong>
              <p className="muted-copy">
                Reviews still start from a PR check run, so teams stay in the repo workflow they already use.
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

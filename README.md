# NotebookLens

GitHub Action for Jupyter notebook PR review. Detects `.ipynb` changes, diffs cells, and posts one auto-updating PR comment — with optional Claude AI summaries. No checkout required. `none` mode needs no external AI key.

## Quick Start

Use this first. It needs no AI key and sends nothing to external model providers.

```yaml
name: NotebookLens

on:
  pull_request:
    types: [opened, synchronize, reopened]

permissions:
  contents: read
  pull-requests: write

jobs:
  notebooklens:
    runs-on: ubuntu-latest
    steps:
      # Replace your-org/notebooklens@v0 with the actual published ref
      - name: Run NotebookLens
        uses: your-org/notebooklens@v0
        env:
          GITHUB_TOKEN: ${{ github.token }}
        with:
          ai-provider: none
          redact-secrets: true
          redact-emails: true
```

**Note:** `your-org/notebooklens@v0` is a placeholder. Substitute the owner/repo and ref of your published action before deploying. See the [Releases](https://github.com/your-org/notebooklens/releases) page for available tags.

`GITHUB_TOKEN` is the built-in Actions token used to read PR file metadata and create or update the review comment. No extra setup is required — GitHub provides it automatically in every workflow run.

## Enable Claude (optional)

After `none` mode is useful for your PR triage flow, enable Claude for richer summaries and findings.

```yaml
- name: Run NotebookLens (Claude mode)
  uses: your-org/notebooklens@v0
  env:
    GITHUB_TOKEN: ${{ github.token }}
  with:
    ai-provider: claude
    ai-api-key: ${{ secrets.ANTHROPIC_API_KEY }}
    redact-secrets: true
    redact-emails: true
```

If `ai-provider=claude` is requested without a key, or Claude fails, the run degrades safely to `none` mode and adds a visible notice in the PR comment.

**Fork PRs:** When a PR originates from a fork, GitHub Actions does not expose repository secrets to the workflow. If `ai-provider: claude` is configured but the fork provides no `ai-api-key`, NotebookLens automatically falls back to `none` mode and adds a visible notice in the PR comment. No manual handling is needed.

## PR Comment Format

NotebookLens posts one comment per PR identified by the HTML marker `<!-- notebooklens-comment -->`. The comment is updated in place on each push. It is deleted if the PR no longer contains `.ipynb` changes.

A typical comment looks like this:

```markdown
## NotebookLens

Reviewed **2** notebook(s) with **5** changed cell(s).

### Notebook Changes

#### `analysis/model.ipynb` (`modified`)
- Changed cells: **3** (added 1, modified 1, deleted 0, moved 1, output-only 0)
- Cells with output updates: **1**
- Cell 2 · `code` · `modified` · cell modified (source) Output updates: text stream output updated (42 chars)
- Cell 4 · `code` · `added` · cell added
- Cell 7 · `code` · `moved` · cell reordered without material content changes

#### `reports/summary.ipynb` (`added`)
- Changed cells: **2** (added 2, modified 0, deleted 0, moved 0, output-only 0)
- Cells with output updates: **0**
- Cell 1 · `markdown` · `added` · cell added
- Cell 2 · `code` · `added` · cell added

### Flagged Findings
- **MEDIUM** `analysis/model.ipynb` · Cell 2 · `error` · Changed cell includes an error output. Verify the failing state is intentional. (`error_output_present`, confidence: high)

<details>
<summary>AI summary (Claude)</summary>

Model training cell updated with new learning rate parameter. Output confirms lower final loss. One error output in the preprocessing cell appears intentional (expected data validation failure).

</details>

### Notices
- analysis/model.ipynb: notebook material metadata changed (kernelspec/language_info)
```

The `<details>` block with the AI summary appears only when `ai-provider: claude` succeeds. The `### Notices` section appears only when there are limit-related or processing notices.

## How It Works

NotebookLens runs as a Docker GitHub Action triggered only on `pull_request` events with actions `opened`, `synchronize`, or `reopened`. It never checks out your repository — all file content is fetched directly from the GitHub Contents API.

**Pipeline:**

1. **Event validation** — Exits silently for unsupported events (e.g., `closed`, `labeled`).

2. **Notebook discovery** — Calls the GitHub Files API to list PR changes; filters `.ipynb` files. Handles `added`, `modified`, `deleted`, and `renamed` file statuses. Renamed notebooks where both old and new paths are `.ipynb` are treated as modified.

3. **Content fetch** — Retrieves base and head versions via GitHub Contents API (base64 decode with `download_url` fallback). Notebooks over 50 MB are skipped with a notice.

4. **Cell diff** — Three-phase cell alignment (cell ID match, then sequence similarity, then positional). Detects five cell change types: `added`, `deleted`, `modified`, `output_changed` (outputs differ, source unchanged), and `moved` (unchanged content reordered). Execution count changes are ignored. Binary outputs are summarized, not forwarded.

5. **Redaction** — Before any external call, applies five pattern families: URI credentials (`scheme://user:pass@host`), connection strings (postgres/mysql/etc.), sensitive assignments (`TOKEN=`, `API_KEY=`, etc.), long base64 blobs, and (if enabled) email addresses.

6. **Review** — In `none` mode: deterministic findings only, no external calls. In `claude` mode: sends redacted diff JSON to `claude-3-5-sonnet-latest`; validates strict JSON response schema; attempts one JSON repair pass on failure; falls back to `none` with a visible notice if repair also fails.

7. **Comment sync** — Creates, updates, or deletes exactly one bot-authored PR comment identified by the HTML marker `<!-- notebooklens-comment -->`. If notebook changes disappear from a later commit, the comment is deleted automatically.

## Inputs

| Input | Type | Default | Description |
|---|---|---|---|
| `ai-provider` | `none` \| `claude` | `none` | Provider for review enrichment. `none` uses local deterministic findings only. `claude` calls the Anthropic API. |
| `ai-api-key` | string | — | Anthropic API key. Required only when `ai-provider: claude`. Leave unset for `none` mode. |
| `redact-secrets` | bool | `true` | Redact URI credentials, connection strings, sensitive assignments, and long base64 blobs before any external call. |
| `redact-emails` | bool | `true` | Redact email addresses before any external call. |

`GITHUB_TOKEN` is passed via `env:`, not `with:`. It must have `contents: read` and `pull-requests: write` permissions. These are explicitly declared in the workflow `permissions:` block (see Quick Start).

**Out of scope for v0.1.0:** OpenAI/Ollama providers, GitLab/Bitbucket, hosted review UI, inline notebook threads.

## Hard Limits

| Limit | Value |
|---|---|
| Notebooks processed per PR | 20 (first 20 in GitHub file order; remainder skipped with notice) |
| Cells aligned per notebook | 500 (first 500 alignment rows; remainder skipped with notice) |
| Notebook size | 50 MB (notebooks over this size are skipped with notice) |
| AI input token budget | 16,000 tokens (payload compacted or truncated with notice before Claude call) |
| Output text forwarded for AI | 2,000 characters per output block |

When any limit is exceeded, NotebookLens adds a notice line in the PR comment and continues processing remaining notebooks.

## What `none` Mode Detects

In `none` mode, NotebookLens applies four deterministic checks to every changed cell. No external calls are made.

| Code | Category | Severity | Condition |
|---|---|---|---|
| `notebook_material_metadata_changed` | metadata | low | Notebook-level `kernelspec` or `language_info` changed. |
| `cell_material_metadata_changed` | metadata | low | A cell's review-relevant metadata (e.g., tags) changed. |
| `error_output_present` | error | medium | A changed cell has an error-type output. |
| `large_output_change` | output | low | A changed cell has output content that exceeded the 2,000-character AI forwarding limit. |

Claude mode includes all of the above plus AI-generated findings across the full issue schema (`documentation`, `output`, `error`, `data`, `metadata`, `policy`, `review_guidance`).

## Privacy Note

- In `none` mode, NotebookLens performs local diff/review logic only and does not call external AI APIs.
- In `claude` mode, NotebookLens sends redaction-processed review payload data to Anthropic.
- Redaction is best effort. It targets:
  - URI credentials (`scheme://user:pass@host`)
  - Connection strings (PostgreSQL, MySQL, MongoDB, Redis, AMQP, Snowflake, JDBC)
  - Sensitive assignments (`TOKEN=`, `SECRET=`, `API_KEY=`, `PASSWORD=`, `PRIVATE_KEY=`, `DSN=`, etc.)
  - Long base64 blobs (80+ character sequences)
  - Email addresses (when `redact-emails: true`)
- Binary cell outputs (images, HTML, JSON display data) are never forwarded verbatim; output type and size are summarized.

If your policy disallows third-party model calls, keep `ai-provider: none`.

## Structured Logging

Every run emits two JSON log lines to stdout.

`notebooklens.runtime` is emitted after the diff/review phase:

```json
{
  "status": "review_ready",
  "requested_provider": "claude",
  "effective_provider": "none",
  "used_fallback": true,
  "fallback_reason": "Fork PR has no ai-api-key for ai-provider=claude; falling back to none mode.",
  "claude_called": false,
  "input_tokens": null,
  "output_tokens": null,
  "changed_notebooks": 1,
  "total_cells_changed": 3
}
```

`notebooklens.comment_sync` is emitted after comment create/update/delete:

```json
{
  "action": "created",
  "comment_id": 987654321,
  "deleted_comment_ids": [],
  "details": "Created marker comment."
}
```

`action` is one of: `created`, `updated`, `deleted`, `unchanged`, `noop`.

## Troubleshooting

`No comment appears on a PR`
- Confirm event is `pull_request` with one of: `opened`, `synchronize`, `reopened`.
- Confirm at least one changed file ends in `.ipynb`.
- Confirm workflow/job permissions include `contents: read` and `pull-requests: write`.
- Confirm `GITHUB_TOKEN` is passed to the action environment.

`Expected Claude output, but got none-mode behavior`
- Check `ai-provider` is exactly `claude`.
- Check `ai-api-key` is present and valid.
- For fork PRs, secret availability may be restricted; fallback to `none` is expected and is surfaced in notices.

`Existing NotebookLens comment did not update as expected`
- NotebookLens only updates/deletes marker comments it owns (bot-authored comment containing `<!-- notebooklens-comment -->`).
- If notebook changes are removed from later commits in the PR, NotebookLens deletes its marker comment by design.

`Large/malformed notebook behavior`
- Notebooks over size/cell limits are skipped or truncated deterministically with explicit notices.
- Malformed or unreadable notebook JSON is surfaced through notices while processing continues for other notebooks.

`Claude mode was requested but comment shows none-mode findings and a notice`
- This is expected when: (a) `ai-api-key` is missing or empty, (b) the PR is from a fork and the secret is unavailable, (c) Claude returned an invalid JSON response that could not be repaired in one attempt.
- Check the `notebooklens.runtime` log line: `used_fallback: true` and `fallback_reason` will contain the specific cause.

`Action fails immediately with an import error or ModuleNotFoundError`
- The published Dockerfile does not include a `pip install` step. If running a locally built image, add `RUN pip install --no-cache-dir anthropic pydantic requests python-dotenv` before the ENTRYPOINT line. This is a known packaging gap that will be corrected before the first published release.

## Example Workflow File

See [.github/notebooklens-pr.example.yml](.github/notebooklens-pr.example.yml) for a runnable baseline.

## License

MIT. See [LICENSE](LICENSE).

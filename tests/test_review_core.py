from __future__ import annotations

from pathlib import Path
from typing import Any, Dict, Mapping, Optional, Sequence

import pytest

from src import github_action as github_action_module
from src.claude_integration import NoneProvider, ProviderConfig, ProviderInterface
from src.diff_engine import NotebookInput, build_notebook_diff
from src.review_core import (
    REVIEW_SNAPSHOT_SCHEMA_VERSION,
    ReviewArtifacts,
    ReviewCoreRequest,
    build_review_artifacts,
    build_review_snapshot_payload,
)


FIXTURES_DIR = Path(__file__).parent / "fixtures"


def fixture_text(name: str) -> str:
    return (FIXTURES_DIR / name).read_text(encoding="utf-8")


class StubGitHubNotebookApi:
    def __init__(self, *, files: Sequence[Mapping[str, Any]], contents: Mapping[tuple[str, str], str]) -> None:
        self.files = [dict(item) for item in files]
        self.contents = dict(contents)

    def list_pull_request_files(self, *, repository: str, pull_number: int) -> Sequence[Any]:
        del repository, pull_number
        return list(self.files)

    def get_file_content(self, *, repository: str, path: str, ref: str) -> Optional[str]:
        del repository
        return self.contents.get((path, ref))


class NoneProviderFactory:
    def __call__(self, config: ProviderConfig) -> ProviderInterface:
        del config
        return NoneProvider()


def _modified_input() -> NotebookInput:
    return NotebookInput(
        path="analysis/notebook.ipynb",
        change_type="modified",
        base_content=fixture_text("simple_base.ipynb"),
        head_content=fixture_text("simple_head.ipynb"),
    )


def test_build_review_artifacts_produces_versioned_snapshot_payload() -> None:
    artifacts = build_review_artifacts(
        ReviewCoreRequest(
            notebook_inputs=[_modified_input()],
            reviewer=NoneProvider(),
        )
    )

    assert artifacts.notebook_diff.total_notebooks_changed == 1
    assert artifacts.review_result.summary is None

    payload = artifacts.snapshot_payload
    assert payload["schema_version"] == REVIEW_SNAPSHOT_SCHEMA_VERSION
    notebook = payload["review"]["notebooks"][0]
    assert notebook["path"] == "analysis/notebook.ipynb"
    assert notebook["render_rows"]

    modified_row = next(row for row in notebook["render_rows"] if row["change_type"] == "modified")
    assert modified_row["source"]["changed"] is True
    assert isinstance(modified_row["source"]["base"], str)
    assert isinstance(modified_row["source"]["head"], str)
    assert set(modified_row["thread_anchors"]) == {"source", "outputs", "metadata"}
    assert modified_row["thread_anchors"]["source"]["notebook_path"] == "analysis/notebook.ipynb"
    assert modified_row["thread_anchors"]["source"]["source_fingerprint"]


def test_build_review_snapshot_payload_rejects_unknown_schema_version() -> None:
    diff = build_notebook_diff([_modified_input()])

    with pytest.raises(ValueError, match="Unsupported review snapshot schema version: 2"):
        build_review_snapshot_payload(diff, schema_version=2)


def test_run_action_consumes_shared_review_core_boundary(monkeypatch: pytest.MonkeyPatch) -> None:
    api = StubGitHubNotebookApi(
        files=[
            {
                "filename": "analysis/notebook.ipynb",
                "status": "modified",
                "size": 1024,
            }
        ],
        contents={
            ("analysis/notebook.ipynb", "base-sha"): fixture_text("simple_base.ipynb"),
            ("analysis/notebook.ipynb", "head-sha"): fixture_text("simple_head.ipynb"),
        },
    )
    observed: Dict[str, Any] = {}

    def fake_build_review_artifacts(request: ReviewCoreRequest) -> ReviewArtifacts:
        observed["paths"] = [item.path for item in request.notebook_inputs]
        diff = build_notebook_diff(request.notebook_inputs, limits=request.limits)
        review_result = request.reviewer.review(diff)
        return ReviewArtifacts(
            notebook_diff=diff,
            review_result=review_result,
            snapshot_payload={"schema_version": 1, "review": {"notices": [], "notebooks": []}},
        )

    monkeypatch.setattr(github_action_module, "build_review_artifacts", fake_build_review_artifacts)

    result = github_action_module.run_action(
        github_api=api,
        context=github_action_module.PullRequestContext(
            repository="acme/notebooklens-fixture",
            pull_number=42,
            base_sha="base-sha",
            head_sha="head-sha",
            is_fork=False,
            event_name="pull_request",
            event_action="opened",
        ),
        inputs=github_action_module.ActionInputs(ai_provider="none"),
        provider_factory=NoneProviderFactory(),
        emit_logs=False,
    )

    assert observed["paths"] == ["analysis/notebook.ipynb"]
    assert result.status == "review_ready"
    assert result.notebook_diff is not None
    assert result.review_result is not None

"""Shared review-core boundary for OSS action and managed review snapshot builders."""

from __future__ import annotations

from dataclasses import dataclass
import hashlib
from typing import Any, Dict, List, Literal, Optional, Protocol, Sequence, Union

from .diff_engine import (
    CellChange,
    CellLocator,
    ContextCell,
    DiffLimits,
    NotebookDiff,
    NotebookFileDiff,
    NotebookInput,
    ReviewResult,
    build_notebook_diff,
)


SnapshotBlockKind = Literal["source", "outputs", "metadata"]
REVIEW_SNAPSHOT_SCHEMA_VERSION = 1
_SNAPSHOT_BLOCK_KINDS: Sequence[SnapshotBlockKind] = ("source", "outputs", "metadata")


class ReviewCoreReviewer(Protocol):
    """Minimal reviewer contract shared by OSS and managed review flows."""

    def review(self, diff: NotebookDiff) -> ReviewResult:
        """Return structured review output for a notebook diff."""


@dataclass(frozen=True)
class ReviewCoreRequest:
    """Shared review-core input used by both the Action and managed services."""

    notebook_inputs: Sequence[NotebookInput]
    reviewer: ReviewCoreReviewer
    limits: DiffLimits = DiffLimits()
    snapshot_schema_version: int = REVIEW_SNAPSHOT_SCHEMA_VERSION


@dataclass(frozen=True)
class ReviewArtifacts:
    """Structured review outputs reusable by multiple runtime surfaces."""

    notebook_diff: NotebookDiff
    review_result: ReviewResult
    snapshot_payload: Dict[str, Any]


def build_review_artifacts(request: ReviewCoreRequest) -> ReviewArtifacts:
    """Build reusable diff, review result, and normalized snapshot payload."""
    notebook_diff = build_notebook_diff(request.notebook_inputs, limits=request.limits)
    review_result = request.reviewer.review(notebook_diff)
    snapshot_payload = build_review_snapshot_payload(
        notebook_diff,
        schema_version=request.snapshot_schema_version,
    )
    return ReviewArtifacts(
        notebook_diff=notebook_diff,
        review_result=review_result,
        snapshot_payload=snapshot_payload,
    )


def build_review_snapshot_payload(
    notebook_diff: NotebookDiff,
    *,
    schema_version: int = REVIEW_SNAPSHOT_SCHEMA_VERSION,
) -> Dict[str, Any]:
    """Build the versioned normalized review snapshot payload for hosted rendering."""
    if schema_version != REVIEW_SNAPSHOT_SCHEMA_VERSION:
        raise ValueError(
            f"Unsupported review snapshot schema version: {schema_version}"
        )

    return {
        "schema_version": schema_version,
        "review": {
            "notices": list(notebook_diff.notices),
            "notebooks": [
                _notebook_snapshot(notebook)
                for notebook in notebook_diff.notebooks
            ],
        },
    }


def _notebook_snapshot(notebook: NotebookFileDiff) -> Dict[str, Any]:
    return {
        "path": notebook.path,
        "change_type": notebook.change_type,
        "notices": list(notebook.notices),
        "render_rows": [_render_row(notebook.path, change) for change in notebook.cell_changes],
    }


def _render_row(notebook_path: str, change: CellChange) -> Dict[str, Any]:
    return {
        "locator": _locator_dict(change.locator),
        "cell_type": change.cell_type,
        "change_type": change.change_type,
        "summary": change.summary,
        "source": {
            "base": change.base_source,
            "head": change.head_source,
            "changed": change.source_changed,
        },
        "outputs": {
            "changed": change.outputs_changed,
            "items": [
                {
                    "output_type": output.output_type,
                    "mime_group": output.mime_group,
                    "summary": output.summary,
                    "truncated": output.truncated,
                }
                for output in change.output_changes
            ],
        },
        "metadata": {
            "changed": change.material_metadata_changed,
            "summary": change.metadata_summary,
        },
        "review_context": [_review_context_item(context) for context in change.review_context],
        "thread_anchors": {
            block_kind: _thread_anchor(
                notebook_path=notebook_path,
                change=change,
                block_kind=block_kind,
            )
            for block_kind in _SNAPSHOT_BLOCK_KINDS
        },
    }


def _thread_anchor(
    *,
    notebook_path: str,
    change: CellChange,
    block_kind: SnapshotBlockKind,
) -> Dict[str, Any]:
    return {
        "notebook_path": notebook_path,
        "cell_locator": _locator_dict(change.locator),
        "block_kind": block_kind,
        "source_fingerprint": _source_fingerprint(change),
        "cell_type": change.cell_type,
    }


def _locator_dict(locator: CellLocator) -> Dict[str, Optional[Union[int, str]]]:
    return {
        "cell_id": locator.cell_id,
        "base_index": locator.base_index,
        "head_index": locator.head_index,
        "display_index": locator.display_index,
    }


def _review_context_item(context: ContextCell) -> Dict[str, str]:
    return {
        "relative_position": context.relative_position,
        "cell_type": context.cell_type,
        "summary": context.summary,
    }


def _source_fingerprint(change: CellChange) -> str:
    source_text = change.head_source if change.head_source is not None else change.base_source
    normalized = _normalize_fingerprint_text(source_text or change.summary)
    payload = f"{change.cell_type}\0{normalized}".encode("utf-8")
    return hashlib.sha256(payload).hexdigest()


def _normalize_fingerprint_text(value: str) -> str:
    return "\n".join(line.rstrip() for line in value.replace("\r", "").split("\n")).strip()


__all__ = [
    "REVIEW_SNAPSHOT_SCHEMA_VERSION",
    "ReviewArtifacts",
    "ReviewCoreRequest",
    "ReviewCoreReviewer",
    "SnapshotBlockKind",
    "build_review_artifacts",
    "build_review_snapshot_payload",
]

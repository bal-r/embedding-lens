"""Refresh public search examples from cached embeddings, without loading model weights.

    uv run python -m scripts.refresh_search

Existing sentence queries keep their exported scores. New examples must match a vocabulary
entry exactly, whose cached text embedding uses the same model's normal prompt.
"""

import json

from lens.config import ROOT
from lens.export import _zscore
from lens.index import load_segments, load_vocab
from lens.publication import SEARCH_QUERIES


def main() -> None:
    for path in (ROOT / "web/public/data/search").glob("*.json"):
        previous = json.loads(path.read_text())["scores"]
        _, videos = load_segments(path.stem)
        phrases, vectors = load_vocab(path.stem, "medium")
        index = {phrase: i for i, phrase in enumerate(phrases)}
        scores = {}
        for query in SEARCH_QUERIES:
            scores[query] = previous[query] if query in previous else _zscore(videos @ vectors[index[query]])
        path.write_text(json.dumps({"queries": SEARCH_QUERIES, "scores": scores}, separators=(",", ":")))


if __name__ == "__main__":
    main()

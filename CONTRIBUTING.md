# Contributing

Use [issues](https://github.com/bal-r/embedding-lens/issues) for reproducible bugs, questions about
the experiment or proposed comparisons. Include the model, vocabulary size, lens, video and
moment when reporting a surprising result. A screenshot helps explain a visual issue.

Keep changes focused. For an experiment, describe the question, input sampling, evaluation and
limitations. Preserve source video IDs so stored results can be compared. Do not present the
12-moment AI annotation sample as a general model benchmark.

## Local checks

```sh
npm ci
npm test
npm run build
uv sync --locked
uv run pytest
```

The Python environment includes large model dependencies. To run the current unit tests without
downloading model weights or installing the inference stack:

```sh
uv run --no-project --python 3.12 --with pytest --with numpy --with scipy python -m pytest
```

The static site uses committed exports, so frontend checks do not require running a model.
Keep downloaded videos, model caches, credentials and local editorial drafts out of commits.
Changes to public exports should preserve the exclusions in `lens/publication.py`.

For sensitive vulnerabilities, use the process in [SECURITY.md](SECURITY.md).

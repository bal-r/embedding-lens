from pathlib import Path

import pytest

from lens import vocab


@pytest.mark.parametrize("tier", vocab.TIERS)
def test_known_tiers_read_the_selected_cache(tmp_path, monkeypatch, tier):
    monkeypatch.setattr(vocab, "VOCAB_DIR", tmp_path)
    (tmp_path / f"{tier}.txt").write_text("computer screen\nice climbing\n", encoding="utf-8")
    assert vocab.load(tier) == ["computer screen", "ice climbing"]


@pytest.mark.parametrize("tier", ["../outside", "/tmp/outside", "small/../../outside", "SMALL", "", "unknown"])
def test_unknown_tiers_are_rejected_before_cache_access(tmp_path, monkeypatch, tier):
    monkeypatch.setattr(vocab, "VOCAB_DIR", tmp_path / "unused")

    def unexpected_access(*args, **kwargs):
        pytest.fail("an invalid tier must not access files or build vocabularies")

    monkeypatch.setattr(vocab, "build", unexpected_access)
    monkeypatch.setattr(Path, "exists", unexpected_access)
    with pytest.raises(ValueError, match="unknown vocabulary tier"):
        vocab.load(tier)

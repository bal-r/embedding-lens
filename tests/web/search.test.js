import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { alignLiveScores, rankResults } from "../../web/src/search-ranking.js";

const manifest = JSON.parse(readFileSync(new URL("../../web/public/data/manifest.json", import.meta.url)));
const readSearch = (model) => JSON.parse(readFileSync(new URL(`../../web/public/data/search/${model}.json`, import.meta.url)));

test("broad examples yield real high-scoring matches in several source videos", () => {
  for (const model of manifest.models) {
    const data = readSearch(model.id);
    for (const query of ["road", "sky", "racing", "outdoors"]) {
      const results = rankResults(manifest, data.scores[query]);
      assert.ok(results.length >= 2, `${model.id}: ${query}`);
      assert.ok(results.every((r) => r.score >= 1));
      assert.equal(new Set(results.map((r) => r.key.split(":")[0])).size, results.length);
    }
  }
});

test("the overall ranking is still available and excluded moments never return", () => {
  const scores = readSearch("qwen3vl").scores.road.slice();
  scores[40] = 100;
  scores[45] = 99;
  const results = rankResults(manifest, scores, { acrossVideos: false });
  assert.equal(results.length, 8);
  assert.ok(results.every((r) => !manifest.excludedSegments.includes(r.key)));
  assert.ok(results.every((r, i) => i === 0 || results[i - 1].score >= r.score));
});

test("live results align by segment identity even when responses are reordered or incomplete", () => {
  const scores = alignLiveScores(manifest, [{ key: "wetterstein:0", z: 2 }, { key: "zugspitze:2", z: 3 }]);
  const results = rankResults(manifest, scores);
  assert.deepEqual(results.map((r) => r.key), ["zugspitze:2", "wetterstein:0"]);
});

test("weak or missing results do not fill the page with unrelated videos", () => {
  const scores = Array(291).fill(NaN);
  scores[0] = 0.2;
  scores[91] = 0.1;
  assert.deepEqual(rankResults(manifest, scores), [{ key: "zugspitze:0", score: 0.2 }]);
  assert.deepEqual(rankResults(manifest, Array(291).fill(NaN)), []);
});

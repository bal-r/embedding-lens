import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import test from "node:test";
import { isAvailable, keyAt, visibleIndices } from "../../web/src/segments.js";

const manifest = JSON.parse(readFileSync(new URL("../../web/public/data/manifest.json", import.meta.url)));
const readouts = new URL("../../web/public/data/readouts/", import.meta.url);

test("withdrawn moments cannot be selected, without shifting other videos' corpus offsets", () => {
  assert.deepEqual(manifest.excludedSegments, ["zugspitze:40", "zugspitze:45"]);
  for (const key of manifest.excludedSegments) {
    assert.equal(isAvailable(manifest, key), false);
    const [video, index] = key.split(":");
    const sprite = new URL(`../../web/public/media/${video}/${index.padStart(3, "0")}.webp`, import.meta.url);
    assert.equal(existsSync(sprite), false);
    const game = new URL(`../../web/public/data/game/qwen3vl/${video}-${index.padStart(3, "0")}.bin`, import.meta.url);
    assert.equal(existsSync(game), false);
  }
  const indices = visibleIndices(manifest, "zugspitze");
  assert.deepEqual(indices.filter((i) => i >= 39 && i <= 46), [39, 41, 42, 43, 44, 46]);
  assert.equal(keyAt(manifest, 91), "wetterstein:0");
  assert.equal(keyAt(manifest, 140), "kart:0");
  assert.equal(manifest.videos.reduce((n, v) => n + visibleIndices(manifest, v.id).length, 0), 289);
});

test("every published readout and selected thumbnail has a published sprite", () => {
  for (const filename of readdirSync(readouts)) {
    const data = JSON.parse(readFileSync(new URL(filename, readouts)));
    for (const key of Object.keys(data.segments)) {
      assert.ok(isAvailable(manifest, key), `${filename}: ${key}`);
      const [video, index] = key.split(":");
      assert.ok(existsSync(new URL(`../../web/public/media/${video}/${index.padStart(3, "0")}.webp`, import.meta.url)), key);
    }
  }
  for (const video of manifest.videos) {
    assert.ok(isAvailable(manifest, `${video.id}:${video.thumbnailIndex}`));
  }
});

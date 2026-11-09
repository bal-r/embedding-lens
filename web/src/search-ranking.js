import { isAvailable, keyAt } from "./segments.js";

export function rankResults(manifest, scores, { acrossVideos = true, limit = 8 } = {}) {
  const ranked = scores.map((score, offset) => ({ score, key: keyAt(manifest, offset) }))
    .filter(({ score, key }) => Number.isFinite(score) && isAvailable(manifest, key))
    .sort((a, b) => b.score - a.score);
  if (!acrossVideos) return ranked.slice(0, limit);

  const seen = new Set();
  const distinct = ranked.filter(({ score, key }) => {
    const video = key.split(":")[0];
    if (score < 1 || seen.has(video)) return false;
    seen.add(video);
    return true;
  });
  // Keep the best available result for a flat/weak query rather than implying no match exists.
  return (distinct.length ? distinct : ranked.slice(0, 1)).slice(0, limit);
}

export function alignLiveScores(manifest, segments) {
  const byKey = new Map(segments.map((segment) => [segment.key, segment.z]));
  const length = manifest.videos.reduce((sum, video) => sum + video.segments, 0);
  return Array.from({ length }, (_, i) => byKey.get(keyAt(manifest, i)) ?? NaN);
}

// Keep original corpus offsets stable while omitting withdrawn moments from the demo.
export function isAvailable(manifest, key) {
  if (typeof key !== "string") return false;
  const [id, rawIndex] = key.split(":");
  const index = Number(rawIndex);
  const video = manifest.videos.find((v) => v.id === id);
  return Boolean(video && Number.isInteger(index) && index >= 0 && index < video.segments
    && !(manifest.excludedSegments ?? []).includes(key));
}

export function visibleIndices(manifest, videoId) {
  const video = manifest.videos.find((v) => v.id === videoId);
  return Array.from({ length: video?.segments ?? 0 }, (_, i) => i)
    .filter((i) => isAvailable(manifest, `${videoId}:${i}`));
}

export function keyAt(manifest, offset) {
  for (const video of manifest.videos) {
    if (offset < video.segments) return `${video.id}:${offset}`;
    offset -= video.segments;
  }
  return null;
}

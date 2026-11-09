// Search: text to video. Presets are precomputed; free text needs the live backend.
import { backend, formatTime, liveSearch, loadSearch, spriteUrl, timeOf, youtubeUrl } from "./data.js";
import { offsetOf } from "./explorer.js";
import { busy, waiting } from "./wait.js";
import { isAvailable } from "./segments.js";
import { alignLiveScores, rankResults } from "./search-ranking.js";

const SHOW = 8;

export function createSearch(manifest, state, explorer) {
  const $ = (id) => document.getElementById(id);
  const form = $("search-form");
  const input = $("search-input");
  const presets = $("search-presets");
  const hint = $("search-hint");
  const results = $("search-results");
  const lanes = $("search-lanes");
  const view = $("search-view");
  const summary = $("search-summary");
  let active = null;
  let acrossVideos = true;
  let currentScores = null;
  let request = 0;

  async function renderPresets() {
    const data = await loadSearch(state.model);
    presets.innerHTML = "";
    for (const q of data.queries) {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "chip";
      b.textContent = q;
      b.setAttribute("aria-pressed", q === active);
      b.addEventListener("click", () => run(q));
      presets.append(b);
    }
  }

  function updateHint() {
    hint.textContent = backend.live
      ? "Live: any sentence works, embedded by the live backend."
      : "Offline: try the suggestions. Free text needs the live backend (see the status pill above).";
  }

  async function run(query) {
    const token = ++request;
    const model = state.model;
    active = query;
    input.value = query;
    const data = await loadSearch(model);
    if (token !== request) return;
    let scores = data.scores[query];
    if (!scores) {
      if (!backend.live) {
        hint.textContent = "That query isn't precomputed. Free search needs the live backend.";
        return;
      }
      const done = busy(form.querySelector("button"), "Searching…");
      const stop = waiting(hint, "Embedding your sentence with the live model. This takes a few seconds.");
      try {
        scores = alignLiveScores(manifest, (await liveSearch(query, model)).segments);
      } catch {
        if (token === request) hint.textContent = "The live backend didn't answer. Try a suggestion, or again in a moment.";
        return;
      } finally {
        done();
        stop();
      }
      updateHint();
    }
    if (token !== request) return;
    currentScores = scores;
    renderPresets();
    render(scores);
  }

  function render(scores) {
    const order = rankResults(manifest, scores, { acrossVideos, limit: SHOW });
    const videos = new Set(order.map(({ key }) => key.split(":")[0])).size;
    summary.textContent = `${order.length} ${order.length === 1 ? "moment" : "moments"} from ${videos} ${videos === 1 ? "video" : "videos"}. `
      + (acrossVideos ? "Best match per video at 1σ or above; a weak query shows only its best match. " : "Highest-scoring moments overall. ")
      + "Scores are relative to this corpus, not confidence.";
    results.innerHTML = "";
    order.forEach(({ score, key }, n) => {
      const video = manifest.videos.find((v) => v.id === key.split(":")[0]);
      const a = document.createElement("a");
      a.className = "result";
      a.dataset.segment = key;
      a.href = youtubeUrl(manifest, key);
      a.target = "_blank";
      a.rel = "noopener";
      a.innerHTML = `
        <div class="sprite" style="background-image:url(${spriteUrl(key)})"></div>
        <span class="rank">#${n + 1}</span>
        <div class="meta"><span>${video.title.split(",")[0]} · ${formatTime(timeOf(manifest, key))}</span><span>${score.toFixed(1)}σ</span></div>`;
      results.append(a);
    });

    // Where in each video the query lights up
    lanes.innerHTML = "";
    const max = Math.max(1, ...scores.filter(Number.isFinite));
    for (const v of manifest.videos) {
      const start = offsetOf(manifest, v.id);
      const row = document.createElement("div");
      row.className = "search-lane";
      row.innerHTML = `<span>${v.title.split(",")[0]}</span><div class="cells"></div>`;
      const cells = row.querySelector(".cells");
      for (let j = 0; j < v.segments; j++) {
        if (!isAvailable(manifest, `${v.id}:${j}`)) continue;
        const s = scores[start + j];
        if (!Number.isFinite(s)) continue;
        const cell = document.createElement("span");
        cell.style.opacity = Math.max(0.05, Math.min(1, s / max)).toFixed(2);
        cell.title = `${formatTime(j * manifest.segmentSeconds)}  ${s.toFixed(2)}σ`;
        cell.addEventListener("click", () => {
          explorer.set({ video: v.id, index: j });
          document.getElementById("explore").scrollIntoView({ behavior: "smooth" });
        });
        cells.append(cell);
      }
      lanes.append(row);
    }
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const q = input.value.trim();
    if (q) run(q);
  });
  view.addEventListener("click", (e) => {
    const button = e.target.closest("button[data-view]");
    if (!button) return;
    acrossVideos = button.dataset.view === "videos";
    view.querySelectorAll("button").forEach((b) => b.setAttribute("aria-pressed", b === button));
    if (currentScores) render(currentScores);
  });
  backend.listeners.add(updateHint);
  updateHint();
  renderPresets().then(() => run("road"));
  return { run, refresh: () => active && run(active) };
}

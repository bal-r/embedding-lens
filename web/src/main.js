import "./styles.css";
import { drawBubbles } from "./bubbles.js";
import { backend, detectBackend, formatTime, loadManifest, loadReadouts, spriteUrl, timeOf } from "./data.js";
import { createExplorer } from "./explorer.js";
import { createGame } from "./game.js";
import "./lab-cards.js";
import { createLab } from "./lab.js";
import { createRerank } from "./rerank.js";
import { createSearch } from "./search.js";
import { createTour } from "./tour.js";
import { isAvailable, visibleIndices } from "./segments.js";

// Moments the hero cycles through
const FEATURED = ["zugspitze:3", "zugspitze:50", "f16:18", "kart:20", "zugspitze:88", "trex:10"];

async function hero(manifest, state) {
  const sprite = document.getElementById("hero-sprite");
  const svg = document.getElementById("hero-bubbles");
  const caption = document.getElementById("hero-caption");
  const lens = state.lens;
  const data = await loadReadouts(state.model, state.tier);
  const featured = FEATURED.filter((key) => isAvailable(manifest, key));
  let i = 0;
  let current;
  const draw = () => {
    if (!current) return;
    const compact = matchMedia("(max-width: 640px)").matches;
    drawBubbles(svg, data.segments[current][lens], { count: compact ? 5 : 9, minFont: compact ? 9 : 11, compact });
  };
  const show = () => {
    const key = featured[i % featured.length];
    current = key;
    const video = manifest.videos.find((v) => v.id === key.split(":")[0]);
    sprite.style.backgroundImage = `url(${spriteUrl(key)})`;
    caption.textContent = `${video.title.split(",")[0]} · ${formatTime(timeOf(manifest, key))}`;
    draw();
    i++;
  };
  show();
  new ResizeObserver(draw).observe(svg);
  if (!matchMedia("(prefers-reduced-motion: reduce)").matches) setInterval(show, 4200);
}

function stats(manifest) {
  const segments = manifest.videos.reduce((n, v) => n + visibleIndices(manifest, v.id).length, 0);
  const set = (name, value) => document.querySelectorAll(`[data-stat="${name}"]`).forEach((el) => { el.textContent = value; });
  set("segments", segments.toLocaleString());
  set("seconds", manifest.segmentSeconds);
  set("vocab", Math.max(...manifest.tiers.map((t) => t.size)).toLocaleString());
}

function statusPill() {
  const pill = document.getElementById("status");
  const help = document.getElementById("backend-help");
  const update = (live) => {
    pill.classList.toggle("live", live);
    pill.querySelector(".status-text").textContent = live ? "Live backend" : "Precomputed";
  };
  backend.listeners.add(update);
  pill.addEventListener("click", () => { help.hidden = false; });
  document.getElementById("backend-close").addEventListener("click", () => { help.hidden = true; });
  help.addEventListener("click", (e) => { if (e.target === help) help.hidden = true; });
}

async function main() {
  const manifest = await loadManifest();
  const model = manifest.models.find((m) => m.id === manifest.defaultModel);
  const state = { model: model.id, lens: model.bestLens, tier: manifest.defaultTier, video: "zugspitze", index: 50 };
  stats(manifest);
  statusPill();
  hero(manifest, state);
  const explorer = createExplorer(manifest, state);
  await explorer.set({});
  const rerank = createRerank(manifest, state);
  rerank.render();
  explorer.onChange(() => rerank.render());
  const search = createSearch(manifest, state, explorer);
  createGame(manifest);
  createLab(manifest);
  let searchModel = state.model;
  explorer.onChange(() => {
    if (searchModel !== state.model) {
      searchModel = state.model;
      search.refresh();
    }
  });
  const tour = createTour(explorer, state);
  document.getElementById("start-tour").addEventListener("click", () => tour.start());
  detectBackend();
}

main();

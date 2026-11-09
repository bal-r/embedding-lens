// Packed word bubbles, sized by score, animated between read-outs.
import { hierarchy, pack, select } from "d3";

const PALETTE = ["--c1", "--c2", "--c3", "--c4", "--c5", "--c6"];

function color(i) {
  return getComputedStyle(document.documentElement).getPropertyValue(PALETTE[i % PALETTE.length]).trim();
}

// Scores of different lenses live on different scales; sizes only use their order and spread.
function sizes(words) {
  const scores = words.map((w) => w[1]);
  const max = Math.max(...scores);
  const min = Math.min(...scores);
  const span = max - min || 1;
  return words.map(([phrase, score], rank) => ({ phrase, score, rank, size: 0.12 + Math.pow((score - min) / span, 1.6) }));
}

export function drawBubbles(svgEl, words, { count = 14, minFont = 10, compact = false } = {}) {
  const svg = select(svgEl);
  const { width, height } = svgEl.getBoundingClientRect();
  if (!width || !height) return;
  svg.attr("viewBox", `0 0 ${width} ${height}`);

  const data = sizes(words.slice(0, count));
  const root = pack().size([width, height]).padding(6)(
    hierarchy({ children: data }).sum((d) => d.size),
  );
  const nodes = root.leaves();
  const t = svg.transition().duration(650).ease((x) => 1 - Math.pow(1 - x, 3));

  const groups = svg.selectAll("g.bubble").data(nodes, (d) => d.data.phrase);
  groups.exit().transition(t).style("opacity", 0).attr("transform", (d) => `translate(${d.x},${d.y}) scale(0.2)`).remove();

  const enter = groups.enter().append("g").attr("class", "bubble")
    .attr("transform", (d) => `translate(${d.x},${d.y}) scale(0.2)`).style("opacity", 0);
  enter.append("circle");
  enter.append("text");
  enter.append("title");

  const all = enter.merge(groups);
  all.sort((a, b) => b.r - a.r);
  all.transition(t).style("opacity", 1).attr("transform", (d) => `translate(${d.x},${d.y}) scale(1)`);
  all.select("circle").transition(t)
    .attr("r", (d) => d.r)
    .style("fill", (d) => `color-mix(in srgb, ${color(d.data.rank)} 16%, transparent)`)
    .style("stroke", (d) => `color-mix(in srgb, ${color(d.data.rank)} 70%, transparent)`);
  all.select("title").text((d) => `${d.data.phrase}  ${d.data.score.toFixed(3)}`);
  all.select("text")
    .text((d) => d.data.phrase)
    .style("font-size", (d) => `${Math.max(minFont, Math.min(d.r / 3.2, (2.1 * d.r) / Math.max(d.data.phrase.length, 4)))}px`)
    .style("font-weight", (d) => (d.data.rank < 3 ? 600 : 400))
    .style("opacity", (d) => (d.r < 16 ? 0 : 1))
    .each(function (d) {
      if (!compact || d.r < 16) return;
      const text = select(this);
      const available = d.r * 1.65;
      const parts = d.data.phrase.split(/[ -]+/);
      if (this.getComputedTextLength() > available && parts.length > 1) {
        let split = 1;
        for (let i = 2; i < parts.length; i++) {
          if (Math.max(parts.slice(0, i).join(" ").length, parts.slice(i).join(" ").length)
            < Math.max(parts.slice(0, split).join(" ").length, parts.slice(split).join(" ").length)) split = i;
        }
        text.text(null);
        text.append("tspan").attr("x", 0).attr("dy", "-0.55em").text(parts.slice(0, split).join(" "));
        text.append("tspan").attr("x", 0).attr("dy", "1.1em").text(parts.slice(split).join(" "));
      }
      const lines = this.querySelectorAll("tspan");
      const length = lines.length ? Math.max(...[...lines].map((line) => line.getComputedTextLength())) : this.getComputedTextLength();
      const font = parseFloat(text.style("font-size")) * Math.min(1, available / (length || 1));
      text.style("font-size", `${font}px`).style("opacity", font < minFont ? 0 : 1);
    });
}

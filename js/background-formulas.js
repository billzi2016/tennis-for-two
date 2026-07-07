const layer = document.querySelector(".background-math");
const LAYERS = [
  { multiplier: 0.38, size: [17, 22], opacity: [0.11, 0.2], minDistance: 9 },
  { multiplier: 0.82, size: [13, 17], opacity: [0.14, 0.28], minDistance: 6.2 },
  { multiplier: 0.8, size: [10, 13], opacity: [0.12, 0.24], minDistance: 4.4 }
];

if (layer) {
  loadFormulas();
}

async function loadFormulas() {
  try {
    const response = await fetch("data/formulas.json", { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`Formula data failed: ${response.status}`);
    }

    const formulas = await response.json();
    renderFormulas(formulas);
  } catch (error) {
    console.warn(error);
  }
}

function renderFormulas(formulas) {
  const fragment = document.createDocumentFragment();
  const normalized = formulas.map((item) => typeof item === "string" ? { text: item } : item);

  fragment.appendChild(createSmithChart("smith-chart-left"));
  fragment.appendChild(createSmithChart("smith-chart-right"));

  for (const item of createDenseCloud(normalized)) {
    fragment.appendChild(createFormula(item));
  }

  layer.replaceChildren(fragment);
}

function createFormula(item) {
  const formula = document.createElement("span");
  formula.className = "formula";
  formula.textContent = item.text;

  setPosition(formula, item);
  formula.style.fontSize = `${item.size || 14}px`;
  formula.style.opacity = item.opacity ?? 0.42;
  formula.style.transform = `rotate(${item.rotate || 0}deg)`;

  return formula;
}

function setPosition(element, item) {
  for (const property of ["left", "right", "top", "bottom"]) {
    if (item[property]) {
      element.style[property] = item[property];
    }
  }
}

function createDenseCloud(formulas) {
  const cloud = [];
  const placed = [];
  let serial = 0;

  for (let layerIndex = 0; layerIndex < LAYERS.length; layerIndex += 1) {
    const layer = LAYERS[layerIndex];
    const count = Math.floor(formulas.length * layer.multiplier);

    for (let i = 0; i < count; i += 1) {
      const source = formulas[(serial * 37 + layerIndex * 19) % formulas.length];
      const point = findOpenPoint(serial, layer.minDistance, placed);

      placed.push(point);
      cloud.push({
        text: source.text,
        left: `${point.x.toFixed(2)}vw`,
        top: `${point.y.toFixed(2)}vh`,
        size: seededRange(serial, layer.size[0], layer.size[1]),
        opacity: seededRange(serial + 97, layer.opacity[0], layer.opacity[1]),
        rotate: seededRange(serial + 211, -4, 4)
      });

      serial += 1;
    }
  }

  return cloud;
}

function findOpenPoint(seed, minDistance, placed) {
  for (let attempt = 0; attempt < 28; attempt += 1) {
    const point = candidatePoint(seed, attempt);
    if (insideScope(point.x, point.y)) {
      continue;
    }

    if (hasClearance(point, placed, minDistance)) {
      return point;
    }
  }

  return fallbackPoint(seed);
}

function insideScope(x, y) {
  return x > 27 && x < 73 && y > 22 && y < 82;
}

function candidatePoint(seed, attempt) {
  return {
    x: seededRange(seed * 13 + attempt * 97, 1, 99),
    y: seededRange(seed * 17 + attempt * 89, 2, 98)
  };
}

function fallbackPoint(seed) {
  const side = seed % 4;

  if (side === 0) {
    return { x: seededRange(seed, 1, 99), y: seededRange(seed + 3, 2, 18) };
  }

  if (side === 1) {
    return { x: seededRange(seed, 1, 99), y: seededRange(seed + 3, 84, 98) };
  }

  if (side === 2) {
    return { x: seededRange(seed, 1, 24), y: seededRange(seed + 3, 18, 84) };
  }

  return { x: seededRange(seed, 76, 99), y: seededRange(seed + 3, 18, 84) };
}

function hasClearance(point, placed, minDistance) {
  return placed.every((other) => Math.hypot(point.x - other.x, point.y - other.y) >= minDistance);
}

function seededRange(seed, min, max) {
  const value = Math.sin(seed * 9301 + 49297) * 233280;
  const normalized = value - Math.floor(value);
  return min + normalized * (max - min);
}

function createSmithChart(extraClass) {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.classList.add("smith-chart", extraClass);
  svg.setAttribute("viewBox", "-1.08 -1.08 2.16 2.16");
  svg.setAttribute("aria-hidden", "true");

  const defs = document.createElementNS(svg.namespaceURI, "defs");
  const clip = document.createElementNS(svg.namespaceURI, "clipPath");
  clip.setAttribute("id", `${extraClass}-clip`);
  const clipCircle = document.createElementNS(svg.namespaceURI, "circle");
  clipCircle.setAttribute("cx", "0");
  clipCircle.setAttribute("cy", "0");
  clipCircle.setAttribute("r", "1");
  clip.appendChild(clipCircle);
  defs.appendChild(clip);
  svg.appendChild(defs);

  const grid = document.createElementNS(svg.namespaceURI, "g");
  grid.setAttribute("clip-path", `url(#${extraClass}-clip)`);

  appendCircle(svg, grid, 0, 0, 1, "smith-major");
  appendLine(svg, grid, -1, 0, 1, 0, "smith-axis");

  for (const r of [0.05, 0.1, 0.2, 0.3, 0.5, 0.7, 1, 1.5, 2, 3, 5, 8, 12, 20]) {
    const center = r / (1 + r);
    const radius = 1 / (1 + r);
    appendCircle(svg, grid, center, 0, radius, r === 1 ? "smith-major" : "smith-minor");
  }

  for (const x of [0.1, 0.15, 0.2, 0.3, 0.5, 0.7, 1, 1.5, 2, 3, 5, 8, 12, 20]) {
    appendCircle(svg, grid, 1, 1 / x, 1 / x, x === 1 ? "smith-major" : "smith-minor");
    appendCircle(svg, grid, 1, -1 / x, 1 / x, x === 1 ? "smith-major" : "smith-minor");
  }

  for (const radius of [0.2, 0.35, 0.5, 0.65, 0.8]) {
    appendCircle(svg, grid, 0, 0, radius, "smith-minor");
  }

  svg.appendChild(grid);
  return svg;
}

function appendCircle(svg, parent, cx, cy, r, className) {
  const circle = document.createElementNS(svg.namespaceURI, "circle");
  circle.setAttribute("cx", cx);
  circle.setAttribute("cy", cy);
  circle.setAttribute("r", r);
  circle.setAttribute("class", className);
  parent.appendChild(circle);
}

function appendLine(svg, parent, x1, y1, x2, y2, className) {
  const line = document.createElementNS(svg.namespaceURI, "line");
  line.setAttribute("x1", x1);
  line.setAttribute("y1", y1);
  line.setAttribute("x2", x2);
  line.setAttribute("y2", y2);
  line.setAttribute("class", className);
  parent.appendChild(line);
}

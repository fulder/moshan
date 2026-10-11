import {createNavbar} from './common/navbar.js';
import {MoshanApi} from './api/moshan.js';
import {isLoggedIn} from './common/auth.js';

createNavbar();

const moshanApi = new MoshanApi();
const stats = document.getElementById('stats');
const COLLECTIONS = [
  {apiName: 'tmdb', title: 'Movies', unit: 'movies'},
  {apiName: 'tvmaze', title: 'Shows', unit: 'episodes'},
  {apiName: 'mal', title: 'Anime', unit: 'episodes'},
];
const SVG = 'http://www.w3.org/2000/svg';
const HEIGHT = 160;
const TOP = 16; // room for the scale label above the bars
const AXIS = 20; // room for month labels below the bars
let watches = [];
// Watches per collection without a real date (1970 placeholders), not charted
const undated = {};
let range = '12';

const tip = document.createElement('div');
tip.id = 'statsTip';
tip.hidden = true;
document.body.appendChild(tip);

function monthKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

// Months from `first` to the current one, oldest first
function monthsSince(first) {
  const months = [];
  const now = new Date();
  for (let d = new Date(first.getFullYear(), first.getMonth(), 1); d <= now; d.setMonth(d.getMonth() + 1)) {
    months.push(new Date(d));
  }
  return months;
}

function el(name, attrs = {}) {
  const node = document.createElementNS(SVG, name);
  for (const [key, value] of Object.entries(attrs)) {
    node.setAttribute(key, value);
  }
  return node;
}

// Bar with a 4px rounded top, flat on the baseline
function barPath(x, y, w, h) {
  const r = Math.min(4, w / 2, h);
  return `M${x},${y + h}V${y + r}Q${x},${y} ${x + r},${y}H${x + w - r}Q${x + w},${y} ${x + w},${y + r}V${y + h}Z`;
}

function niceMax(value) {
  const step = 10 ** Math.floor(Math.log10(Math.max(value, 1)));
  return Math.ceil(value / step) * step;
}

function chart(collection, months, counts) {
  const values = months.map(m => counts.get(monthKey(m)) ?? 0);
  const total = values.reduce((a, b) => a + b, 0);
  const max = niceMax(Math.max(...values));
  const width = stats.clientWidth;
  const bottom = HEIGHT - AXIS;
  const plot = bottom - TOP;
  const slot = width / months.length;
  const gap = Math.min(2, slot / 4);

  const svg = el('svg', {width, height: HEIGHT, role: 'img',
    'aria-label': `${collection.title}: ${total} ${collection.unit} watched per month`});
  for (const y of [TOP, TOP + plot / 2, bottom]) {
    svg.appendChild(el('line', {class: 'grid', x1: 0, x2: width, y1: y, y2: y}));
  }
  const scale = el('text', {x: 0, y: TOP - 4});
  scale.textContent = `${max} / month`;
  svg.appendChild(scale);

  // Label every month for a year, else each January
  months.forEach((month, i) => {
    const x = i * slot;
    const monthly = months.length <= 13;
    if (monthly ? slot >= 28 || i % 2 === 0 : month.getMonth() === 0) {
      const label = el('text', {x: x + slot / 2, y: HEIGHT - 4, 'text-anchor': 'middle'});
      label.textContent = monthly
        ? month.toLocaleDateString(undefined, {month: 'short'})
        : month.getFullYear();
      svg.appendChild(label);
    }
    const value = values[i];
    // Hit target spans the whole column so thin bars are easy to hover
    const hit = el('rect', {class: 'hit', x, y: TOP, width: slot, height: plot, fill: 'transparent'});
    const name = month.toLocaleDateString(undefined, {month: 'long', year: 'numeric'});
    hit.addEventListener('mousemove', event => {
      tip.textContent = `${name}: ${value} ${collection.unit}`;
      tip.style.left = `${event.clientX + 12}px`;
      tip.style.top = `${event.clientY + 12}px`;
      tip.hidden = false;
    });
    hit.addEventListener('mouseleave', () => tip.hidden = true);
    svg.appendChild(hit);
    if (value > 0) {
      const h = Math.max(1, value / max * plot);
      svg.appendChild(el('path', {class: 'bar', d: barPath(x + gap / 2, bottom - h, slot - gap, h)}));
    }
  });

  const section = document.createElement('section');
  section.className = 'stats-chart';
  const heading = document.createElement('h3');
  heading.textContent = `${collection.title} `;
  const small = document.createElement('small');
  small.textContent = `${total} ${collection.unit}`;
  if (undated[collection.apiName]) {
    small.textContent += ` · ${undated[collection.apiName]} without a date`;
  }
  heading.appendChild(small);
  section.append(heading, svg);
  return section;
}

function render() {
  for (const button of document.querySelectorAll('#views button')) {
    button.classList.toggle('secondary', button.dataset.range !== range);
    button.setAttribute('aria-pressed', button.dataset.range === range);
  }
  try {
    localStorage.setItem('moshan_stats_range', range);
  } catch {
    // ignore
  }

  const now = new Date();
  const first = range === 'all' && watches.length > 0
    ? new Date(Math.min(...watches.map(w => w.date)))
    : new Date(now.getFullYear(), now.getMonth() - 11, 1);
  const months = monthsSince(first);

  stats.replaceChildren(...COLLECTIONS.map(collection => {
    const counts = new Map();
    for (const watch of watches) {
      if (watch.apiName === collection.apiName && watch.date >= months[0]) {
        const key = monthKey(watch.date);
        counts.set(key, (counts.get(key) ?? 0) + 1);
      }
    }
    return chart(collection, months, counts);
  }));
}

function savedRange() {
  try {
    return localStorage.getItem('moshan_stats_range') === 'all' ? 'all' : '12';
  } catch {
    return '12';
  }
}

async function load() {
  const res = await moshanApi.getWatches();
  watches = [];
  for (const watch of res.watches) {
    const date = new Date(watch.date);
    // Older dates are placeholders (1970 = watched, date unknown)
    if (date.getFullYear() >= 2000) {
      watches.push({...watch, date});
    } else {
      undated[watch.apiName] = (undated[watch.apiName] ?? 0) + 1;
    }
  }
  stats.removeAttribute('aria-busy');
  range = savedRange();
  render();
  // Drawn at the real width so labels keep their size on phones
  new ResizeObserver(() => render()).observe(stats);
}

for (const button of document.querySelectorAll('#views button')) {
  button.addEventListener('click', () => {
    range = button.dataset.range;
    render();
  });
}

if (isLoggedIn()) {
  load();
}

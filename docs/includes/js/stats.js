import {createNavbar} from './common/navbar.js';
import {MoshanApi} from './api/moshan.js';
import {isLoggedIn} from './common/auth.js';
import {viewingUser} from './common/viewing.js';

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
const TOP = 8; // room for the top tick label
const AXIS = 20; // room for month labels below the bars
const LEFT = 28; // room for the tick labels left of the bars
let watches = [];
// Watches per collection without a real date (1970 placeholders), not charted
let undated = {};
// Per profile, so viewing someone else doesn't flash or overwrite yours
const STORED = viewingUser === null ? 'moshan_stats_watches' : `moshan_stats_watches_${viewingUser}`;
let range = '12';

const tip = document.createElement('div');
tip.id = 'statsTip';
tip.hidden = true;
document.body.appendChild(tip);

function monthKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function dayKey(date) {
  return `${monthKey(date)}-${String(date.getDate()).padStart(2, '0')}`;
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

// Bars of the chosen range: days for the last 30 days, else months
function bars() {
  const now = new Date();
  if (range === '30') {
    return Array.from({length: 30}, (_, i) => {
      const day = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 29 + i);
      return {
        start: day,
        key: dayKey(day),
        // Label every Monday
        label: day.getDay() === 1 ? day.toLocaleDateString(undefined, {day: 'numeric', month: 'short'}) : null,
        name: day.toLocaleDateString(undefined, {weekday: 'short', day: 'numeric', month: 'long'}),
      };
    });
  }
  const first = range === 'all' && watches.length > 0
    ? new Date(Math.min(...watches.map(w => w.date)))
    : new Date(now.getFullYear(), now.getMonth() - 11, 1);
  const months = monthsSince(first);
  // Label every month for a year, else each January
  const monthly = months.length <= 13;
  const slot = (stats.clientWidth - LEFT) / months.length;
  return months.map((month, i) => ({
    start: month,
    key: monthKey(month),
    label: monthly
      ? (slot >= 28 || i % 2 === 0 ? month.toLocaleDateString(undefined, {month: 'short'}) : null)
      : (month.getMonth() === 0 ? String(month.getFullYear()) : null),
    name: month.toLocaleDateString(undefined, {month: 'long', year: 'numeric'}),
  }));
}

// Watch time, e.g. "45 min", "2 h 30 min", "128 h"
function duration(minutes) {
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h >= 10 || m === 0 ? `${h.toLocaleString()} h` : `${h} h ${m} min`;
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

// Whole-number tick step (1, 2, 5 × 10^n) giving at most 4 gridlines above 0
function tickStep(value) {
  const raw = Math.max(value, 1) / 4;
  const pow = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 5, 10].map(m => m * pow).find(s => s >= raw);
  return Math.max(1, step);
}

// Average per bar, e.g. "0.4", "3.5", "12"
function average(total, bars) {
  const avg = total / bars;
  return avg >= 10 ? String(Math.round(avg)) : String(Math.round(avg * 10) / 10);
}

function chart(collection, buckets, counts) {
  const values = buckets.map(b => counts.get(b.key) ?? {count: 0, minutes: 0});
  const total = values.reduce((a, b) => a + b.count, 0);
  const minutes = values.reduce((a, b) => a + b.minutes, 0);
  const peak = Math.max(...values.map(v => v.count));
  const step = tickStep(peak);
  const max = Math.max(step, Math.ceil(peak / step) * step);
  const width = stats.clientWidth;
  const bottom = HEIGHT - AXIS;
  const plot = bottom - TOP;
  const slot = (width - LEFT) / buckets.length;
  const per = range === '30' ? 'day' : 'month';
  const gap = Math.min(2, slot / 4);

  const svg = el('svg', {width, height: HEIGHT, role: 'img',
    'aria-label': `${collection.title}: ${total} ${collection.unit} watched per ${per}`});
  for (let tick = 0; tick <= max; tick += step) {
    const y = bottom - tick / max * plot;
    svg.appendChild(el('line', {class: 'grid', x1: LEFT, x2: width, y1: y, y2: y}));
    const label = el('text', {x: LEFT - 6, y: y + 4, 'text-anchor': 'end'});
    label.textContent = tick;
    svg.appendChild(label);
  }

  buckets.forEach((bucket, i) => {
    const x = LEFT + i * slot;
    if (bucket.label) {
      const label = el('text', {x: x + slot / 2, y: HEIGHT - 4, 'text-anchor': 'middle'});
      label.textContent = bucket.label;
      svg.appendChild(label);
    }
    const {count: value, minutes: time} = values[i];
    // Hit target spans the whole column so thin bars are easy to hover
    const hit = el('rect', {class: 'hit', x, y: TOP, width: slot, height: plot, fill: 'transparent'});
    hit.addEventListener('mousemove', event => {
      tip.textContent = `${bucket.name}: ${value} ${collection.unit}` + (time ? ` · ${duration(time)}` : '');
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
  if (minutes) {
    small.textContent += ` · ${duration(minutes)}`;
  }
  small.textContent += ` · avg ${average(total, buckets.length)} / ${per}`;
  // Undated watches have no place in a time range, only in the all-time total
  if (range === 'all' && undated[collection.apiName]) {
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

  const buckets = bars();
  const key = range === '30' ? dayKey : monthKey;

  stats.replaceChildren(...COLLECTIONS.map(collection => {
    const counts = new Map();
    for (const watch of watches) {
      if (watch.apiName === collection.apiName && watch.date >= buckets[0].start) {
        const bucket = counts.get(key(watch.date)) ?? {count: 0, minutes: 0};
        bucket.count += 1;
        bucket.minutes += watch.runtime ?? 0;
        counts.set(key(watch.date), bucket);
      }
    }
    return chart(collection, buckets, counts);
  }));
}

function savedRange() {
  try {
    const saved = localStorage.getItem('moshan_stats_range');
    return ['30', 'all'].includes(saved) ? saved : '12';
  } catch {
    return '12';
  }
}

function show(rawWatches) {
  watches = [];
  undated = {};
  for (const watch of rawWatches) {
    const date = new Date(watch.date);
    // Older dates are placeholders (1970 = watched, date unknown)
    if (date.getFullYear() >= 2000) {
      watches.push({...watch, date});
    } else {
      undated[watch.apiName] = (undated[watch.apiName] ?? 0) + 1;
    }
  }
  stats.removeAttribute('aria-busy');
  render();
}

// Draws the last visit's data right away, then redraws with fresh data
async function load() {
  range = savedRange();
  try {
    const stored = JSON.parse(localStorage.getItem(STORED));
    if (stored) {
      show(stored);
    }
  } catch {
    // nothing stored yet
  }
  const res = await moshanApi.getWatches();
  show(res.watches);
  try {
    localStorage.setItem(STORED, JSON.stringify(res.watches));
  } catch {
    // quota exceeded: next visit just waits for the API
  }
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

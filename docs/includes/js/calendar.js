import {createNavbar} from './common/navbar.js';
import {MoshanApi} from './api/moshan.js';
import {isLoggedIn} from './common/auth.js';
import {request} from './common/http.js';
import {TmdbApi} from './api/tmdb.js';

createNavbar();

const DAY = 24 * 60 * 60 * 1000;
const moshanApi = new MoshanApi();
const calendar = document.getElementById('calendar');
let futureDays = 7;
let pastDays = 7;
// Shows whose watched episodes were fetched
const watchedLoaded = new Set();
let events = [];
let loading = true;

function pad(n) {
  return String(n).padStart(2, '0');
}

function episodeLabel(season, number) {
  return `S${pad(season)}E${pad(number)}`;
}

function isPremiere(season, number) {
  return number === 1 && season > 1;
}

async function allItems() {
  const items = [];
  let cursor = '';
  do {
    const res = await moshanApi.getItems('', cursor);
    items.push(...res.items);
    cursor = res.endCursor;
  } while (cursor);
  return items;
}

// Tenrai rate limits parallel calls, so its requests go one at a time
let tenraiQueue = Promise.resolve();
function tenrai(path) {
  const result = tenraiQueue.then(async () => {
    for (let attempt = 0; ; attempt++) {
      try {
        return await request(`https://api.tenrai.org/v1/anime/${path}`);
      } catch (error) {
        if (error.status !== 429 || attempt >= 3) {
          throw error;
        }
        await new Promise(resolve => setTimeout(resolve, 2000 * (attempt + 1)));
      }
    }
  });
  tenraiQueue = result.catch(() => {});
  return result;
}

async function tvmazeEpisodes(item) {
  const episodes = await request(`https://api.tvmaze.com/shows/${item.apiId}/episodes`);
  return episodes.filter(e => e.airstamp).map(e => ({
    id: String(e.id),
    label: episodeLabel(e.season, e.number),
    premiere: isPremiere(e.season, e.number),
    date: new Date(e.airstamp),
    hasTime: true,
  }));
}

// Tenrai only lists released episodes, so upcoming ones are projected weekly
// from the last one until the planned episode count.
async function malEpisodes(item) {
  const anime = (await tenrai(item.apiId)).data;
  const time = anime.broadcast?.timezone === 'Asia/Tokyo' ? anime.broadcast.time : null;
  const airDate = day => new Date(`${day}T${time ?? '00:00'}:00+09:00`);

  // Only the last page matters: it holds the most recent episodes
  let res = await tenrai(`${item.apiId}/episodes?page=1`);
  const lastPage = res.pagination.last_visible_page;
  if (lastPage > 1) {
    res = await tenrai(`${item.apiId}/episodes?page=${lastPage}`);
  }
  const released = res.data;

  const episodes = released.filter(e => e.aired).map(e => ({
    id: String(e.mal_id),
    label: `Ep ${e.mal_id}`,
    date: airDate(e.aired.slice(0, 10)),
    hasTime: time !== null,
  }));

  if (anime.status !== 'Finished Airing') {
    let number = released.length > 0 ? released[released.length - 1].mal_id : 0;
    let date = episodes.length > 0
      ? episodes[episodes.length - 1].date
      : anime.aired?.from && new Date(airDate(anime.aired.from.slice(0, 10)) - 7 * DAY);
    const planned = anime.episodes ?? number + 8;
    while (date && number < planned) {
      number++;
      date = new Date(date.getTime() + 7 * DAY);
      // Not listed yet although its slot passed (e.g. a break): next slot
      while (date < Date.now()) {
        date = new Date(date.getTime() + 7 * DAY);
      }
      episodes.push({id: String(number), label: `Ep ${number}`, date, hasTime: time !== null});
    }
  }
  return episodes;
}

// Backlog movies released recently or not yet; fetched fresh since
// upcoming release dates often move.
async function movieEvents(item, since) {
  const cached = item.apiCache.releaseDate;
  if (item.apiName !== 'tmdb' || (cached && new Date(cached) < since)) {
    return [];
  }
  try {
    const movie = await new TmdbApi().getItemById({api_id: item.apiId});
    if (!movie.releaseDate) {
      return [];
    }
    const [year, month, day] = movie.releaseDate.split('-').map(Number);
    return [{
      id: String(item.apiId),
      label: 'Movie',
      date: new Date(year, month - 1, day),
      hasTime: false,
      item,
      watched: false,
    }];
  } catch (error) {
    console.log(`Calendar: skipping ${item.apiCache.title}`, error);
    return [];
  }
}

// Shows not being watched only appear for an announced new season
// (next_episode is cached by the daily updater, so no extra calls).
function premiereEvents(item) {
  const next = item.apiCache.nextEpisode;
  if (item.apiName !== 'tvmaze' || !next?.airstamp || next.number !== 1 || item.status === 'dropped') {
    return [];
  }
  return [{
    id: `premiere-${item.apiId}`,
    label: episodeLabel(next.season, next.number),
    premiere: isPremiere(next.season, next.number),
    date: new Date(next.airstamp),
    hasTime: true,
    item,
    watched: false,
  }];
}

function rangeStart() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate() - pastDays);
}

// Watched state only matters for released episodes in view, so it is
// fetched per show once one of its released episodes is in range
async function loadWatched(item) {
  if (watchedLoaded.has(item)) {
    return;
  }
  watchedLoaded.add(item);
  const qParams = {api_name: item.apiName, item_api_id: item.apiId};
  const watched = await moshanApi.getEpisodes(qParams).catch(() => ({episodes: []}));
  const ids = new Set(watched.episodes.map(e => String(e.episodeApiId)));
  for (const event of events.filter(e => e.item === item)) {
    event.watched = ids.has(event.id);
  }
}

function releasedInRange(item) {
  const start = rangeStart();
  const now = new Date();
  return events.some(e => e.item === item && e.date >= start && e.date <= now);
}

// Announced anime sequels of shows in your list (found by the daily updater),
// unless the sequel is already in the list itself
function sequelEvents(item, listed) {
  const sequel = item.apiCache.sequel;
  if (item.apiName !== 'mal' || !sequel?.start || item.status === 'dropped' || listed.has(`mal/${sequel.malId}`)) {
    return [];
  }
  const [year, month, day] = sequel.start.slice(0, 10).split('-').map(Number);
  return [{
    id: `sequel-${sequel.malId}`,
    label: '',
    premiere: 'New season',
    date: new Date(year, month - 1, day),
    hasTime: false,
    item: {apiName: 'mal', apiId: String(sequel.malId), apiCache: {title: sequel.title}},
    watched: false,
  }];
}

async function itemEvents(item) {
  const getEpisodes = {tvmaze: tvmazeEpisodes, mal: malEpisodes}[item.apiName];
  if (getEpisodes === undefined) {
    return;
  }
  try {
    const episodes = await getEpisodes(item);
    addEvents(episodes.map(e => ({...e, item, watched: false})));
    if (releasedInRange(item)) {
      await loadWatched(item);
      render();
    }
  } catch (error) {
    console.log(`Calendar: skipping ${item.apiCache.title}`, error);
  }
}

async function showEarlier() {
  pastDays += 7;
  render();
  const items = new Set(events.filter(e => e.item.apiName !== 'tmdb').map(e => e.item));
  await Promise.all([...items].filter(releasedInRange).map(loadWatched));
  render();
}

function dayHeading(date, today) {
  const diff = Math.round((date - today) / DAY);
  const name = {[-1]: 'Yesterday', 0: 'Today', 1: 'Tomorrow'}[diff];
  const formatted = date.toLocaleDateString(undefined, {weekday: 'short', day: 'numeric', month: 'short'});
  return name ? `${name} · ${formatted}` : formatted;
}

function eventRow(event, now) {
  const row = document.createElement('a');
  row.className = 'calendar-row';
  row.href = `review.html?api_name=${event.item.apiName}&api_id=${event.item.apiId}`;
  if (event.watched) {
    row.classList.add('watched');
  } else if (event.date <= now) {
    row.classList.add('unseen');
    row.title = 'Released, not watched';
  } else {
    row.classList.add('upcoming');
    row.title = 'Not released yet';
  }

  const parts = {
    time: event.hasTime ? event.date.toLocaleTimeString(undefined, {hour: '2-digit', minute: '2-digit', hourCycle: 'h23'}) : '',
    title: event.item.apiCache.title,
    label: event.label,
  };
  for (const [name, text] of Object.entries(parts)) {
    const span = document.createElement('span');
    span.className = name;
    span.textContent = text;
    row.appendChild(span);
  }
  if (event.premiere) {
    const star = document.createElement('span');
    star.className = 'premiere';
    const text = typeof event.premiere === 'string' ? event.premiere : 'Season premiere';
    star.textContent = `★ ${text}${event.label ? ' · ' : ''}`;
    row.lastChild.prepend(star);
  }
  return row;
}

function render() {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const start = rangeStart();
  const end = new Date(today.getTime() + (futureDays + 1) * DAY);

  const sections = [];
  const earlier = document.createElement('button');
  earlier.className = 'secondary outline';
  earlier.textContent = 'Show earlier';
  earlier.hidden = !events.some(e => e.date < start);
  earlier.addEventListener('click', showEarlier);
  sections.push(earlier);

  let current = null;
  for (const event of events.filter(e => e.date >= start && e.date < end)) {
    const day = new Date(event.date.getFullYear(), event.date.getMonth(), event.date.getDate());
    if (current === null || current.day.getTime() !== day.getTime()) {
      const section = document.createElement('section');
      section.className = 'calendar-day';
      if (day.getTime() === today.getTime()) {
        section.classList.add('today');
      }
      const heading = document.createElement('h4');
      heading.textContent = dayHeading(day, today);
      section.appendChild(heading);
      current = {day, section};
      sections.push(section);
    }
    current.section.appendChild(eventRow(event, now));
  }

  if (sections.length === 1 && !loading) {
    const p = document.createElement('p');
    p.textContent = 'No episodes in this period.';
    sections.push(p);
  }

  const more = document.createElement('button');
  more.className = 'secondary outline';
  more.textContent = 'Show more';
  more.hidden = !events.some(e => e.date >= end);
  more.addEventListener('click', () => {
    futureDays += 7;
    render();
  });
  sections.push(more);

  calendar.replaceChildren(...sections);
}

// Rows appear as each show loads instead of after all of them
function addEvents(newEvents) {
  if (newEvents.length === 0) {
    return;
  }
  events.push(...newEvents);
  events.sort((a, b) => a.date - b.date);
  render();
}

async function load() {
  const since = new Date(Date.now() - 30 * DAY);
  const items = await allItems();
  const watching = items.filter(i => ['watching', 'following'].includes(i.status));

  addEvents(items.filter(i => !watching.includes(i)).flatMap(premiereEvents));
  const listed = new Set(items.map(i => `${i.apiName}/${i.apiId}`));
  addEvents(items.flatMap(i => sequelEvents(i, listed)));
  await Promise.all([
    ...watching.map(itemEvents),
    ...items.filter(i => i.status === 'backlog').map(item => movieEvents(item, since).then(addEvents)),
  ]);
  loading = false;
  calendar.removeAttribute('aria-busy');
  render();
}

if (isLoggedIn()) {
  load();
} else {
  calendar.removeAttribute('aria-busy');
}

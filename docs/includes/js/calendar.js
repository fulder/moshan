import {createNavbar} from './common/navbar.js';
import {MoshanApi} from './api/moshan.js';
import {isLoggedIn} from './common/auth.js';
import {request} from './common/http.js';
import {TmdbApi} from './api/tmdb.js';

createNavbar();

const DAY = 24 * 60 * 60 * 1000;
const PAST_DAYS = 7;
const moshanApi = new MoshanApi();
const calendar = document.getElementById('calendar');
let futureDays = 7;
let events = [];

function pad(n) {
  return String(n).padStart(2, '0');
}

async function allItems(sort, filter) {
  const items = [];
  let cursor = '';
  do {
    const res = await moshanApi.getItems(sort, cursor, filter);
    items.push(...res.items);
    cursor = res.endCursor;
  } while (cursor);
  return items;
}

async function tvmazeEpisodes(item) {
  const episodes = await request(`https://api.tvmaze.com/shows/${item.apiId}/episodes`);
  return episodes.filter(e => e.airstamp).map(e => ({
    id: String(e.id),
    label: `S${pad(e.season)}E${pad(e.number)}`,
    date: new Date(e.airstamp),
    hasTime: true,
  }));
}

// Tenrai only lists released episodes, so upcoming ones are projected weekly
// from the last one until the planned episode count.
async function malEpisodes(item) {
  const base = `https://api.tenrai.org/v1/anime/${item.apiId}`;
  const anime = (await request(base)).data;
  const time = anime.broadcast?.timezone === 'Asia/Tokyo' ? anime.broadcast.time : null;
  const airDate = day => new Date(`${day}T${time ?? '00:00'}:00+09:00`);

  const released = [];
  let page = 1;
  let lastPage = 1;
  do {
    const res = await request(`${base}/episodes?page=${page}`);
    released.push(...res.data);
    lastPage = res.pagination.last_visible_page;
    page++;
  } while (page <= lastPage);

  const episodes = released.filter(e => e.aired).map(e => ({
    id: String(e.mal_id),
    label: `Ep ${e.mal_id}`,
    date: airDate(e.aired.slice(0, 10)),
    hasTime: time !== null,
  }));

  if (anime.status !== 'Finished Airing') {
    let number = released.length;
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

async function itemEvents(item) {
  const getEpisodes = {tvmaze: tvmazeEpisodes, mal: malEpisodes}[item.apiName];
  if (getEpisodes === undefined) {
    return [];
  }
  try {
    const qParams = {api_name: item.apiName, item_api_id: item.apiId};
    const [episodes, watched] = await Promise.all([
      getEpisodes(item),
      moshanApi.getEpisodes(qParams).catch(() => ({episodes: []})),
    ]);
    const watchedIds = new Set(watched.episodes.map(e => String(e.episodeApiId)));
    return episodes.map(e => ({...e, item, watched: watchedIds.has(e.id)}));
  } catch (error) {
    console.log(`Calendar: skipping ${item.apiCache.title}`, error);
    return [];
  }
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

  const parts = [
    event.item.apiCache.title,
    event.label,
    event.hasTime ? event.date.toLocaleTimeString(undefined, {hour: '2-digit', minute: '2-digit', hourCycle: 'h23'}) : '',
  ];
  for (const text of parts) {
    const span = document.createElement('span');
    span.textContent = text;
    row.appendChild(span);
  }
  return row;
}

function render() {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const start = new Date(today.getTime() - PAST_DAYS * DAY);
  const end = new Date(today.getTime() + (futureDays + 1) * DAY);

  const sections = [];
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

  if (sections.length === 0) {
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

async function load() {
  const since = new Date(Date.now() - 30 * DAY);
  const [watching, backlog] = await Promise.all([
    allItems('latestWatchDate', 'inProgress'),
    allItems('rating', 'onlyBacklog'),
  ]);
  events = (await Promise.all([
    ...watching.map(itemEvents),
    ...backlog.map(item => movieEvents(item, since)),
  ])).flat();
  events.sort((a, b) => a.date - b.date);
  calendar.removeAttribute('aria-busy');
  render();
}

if (isLoggedIn()) {
  load();
} else {
  calendar.removeAttribute('aria-busy');
}

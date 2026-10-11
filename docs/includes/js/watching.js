import {createNavbar} from './common/navbar.js';
import {MoshanApi} from './api/moshan.js';
import {isLoggedIn} from './common/auth.js';
import {hideDoneToggle, itemCard, loadAll} from './common/posters.js';

createNavbar();

const moshanApi = new MoshanApi();
const list = document.getElementById('watching');
hideDoneToggle(list);

// Nothing aired yet: no released episodes, or a movie still to come.
// The daily updater raises epCount once the first episode is out.
function notAired(item) {
  if (item.apiName === 'tmdb') {
    return !item.apiCache.releaseDate || new Date(item.apiCache.releaseDate) > new Date();
  }
  return !item.apiCache.epCount;
}

// Items without a watch date sort by when they were added
function lastActivity(item) {
  const watched = item.latestWatchDate && item.latestWatchDate !== '0' ? item.latestWatchDate : null;
  return new Date(watched ?? `${item.createdAt.replace(' ', 'T')}Z`);
}

function releaseDate(item) {
  const date = item.apiCache.releaseDate;
  return date ? new Date(date) : new Date(8640000000000000);
}

// Currently watching: status watching/following and aired, last activity first.
// Not finished: under 100% with any status but backlog, closest to done first.
// Upcoming: status watching/following but not aired yet, soonest first.
const VIEWS = {
  current: {
    sort: '', filter: 'inProgress', keep: item => !notAired(item),
    order: (a, b) => lastActivity(b) - lastActivity(a),
  },
  unfinished: {sort: 'epProgress', filter: '', keep: item => item.status !== 'backlog'},
  upcoming: {
    sort: '', filter: 'inProgress', keep: notAired, hideProgress: true,
    order: (a, b) => releaseDate(a) - releaseDate(b),
  },
};

let loading = 0;

async function show(viewName) {
  const view = VIEWS[viewName];
  try {
    localStorage.setItem('moshan_watching_view', viewName);
  } catch {
    // ignore
  }
  for (const button of document.querySelectorAll('#views button')) {
    button.classList.toggle('secondary', button.dataset.view !== viewName);
    button.setAttribute('aria-pressed', button.dataset.view === viewName);
  }
  document.getElementById('hideDoneLabel').hidden = viewName !== 'current';

  const run = ++loading;
  let cursor = '';
  const items = [];
  list.replaceChildren();
  await loadAll(list, async () => {
    const response = await moshanApi.getItems(view.sort, cursor, view.filter);
    if (run !== loading) {
      return false; // another view was picked meanwhile
    }
    items.push(...response.items.filter(view.keep));
    cursor = response.endCursor;
    const more = cursor !== undefined && cursor !== null;
    // Client-sorted views render once all pages are in
    if (!more || !view.order) {
      list.append(...(view.order ? items.sort(view.order) : items).map(item => itemCard(item, !view.hideProgress)));
      items.length = 0;
    }
    return more;
  });
}

function savedView() {
  const fromUrl = new URLSearchParams(window.location.search).get('view');
  if (fromUrl in VIEWS) {
    return fromUrl;
  }
  try {
    const stored = localStorage.getItem('moshan_watching_view');
    return stored in VIEWS ? stored : 'current';
  } catch {
    return 'current';
  }
}

for (const button of document.querySelectorAll('#views button')) {
  button.addEventListener('click', () => show(button.dataset.view));
}

if (isLoggedIn()) {
  show(savedView());
}

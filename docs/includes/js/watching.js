import {createNavbar} from './common/navbar.js';
import {MoshanApi} from './api/moshan.js';
import {isLoggedIn} from './common/auth.js';
import {hideDoneToggle, itemCard, loadAll} from './common/posters.js';

createNavbar();

const moshanApi = new MoshanApi();
const list = document.getElementById('watching');
hideDoneToggle(list);

// Currently watching: status watching/following, last watched first.
// Not finished: under 100% with any status but backlog, closest to done first.
const VIEWS = {
  current: {sort: 'latestWatchDate', filter: 'inProgress', keep: () => true},
  unfinished: {sort: 'epProgress', filter: '', keep: item => item.status !== 'backlog'},
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
  list.replaceChildren();
  await loadAll(list, async () => {
    const response = await moshanApi.getItems(view.sort, cursor, view.filter);
    if (run !== loading) {
      return false; // another view was picked meanwhile
    }
    list.append(...response.items.filter(view.keep).map(item => itemCard(item, true)));
    cursor = response.endCursor;
    return cursor !== undefined && cursor !== null;
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

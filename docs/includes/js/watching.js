import {createNavbar} from './common/navbar.js';
import {MoshanApi} from './api/moshan.js';
import {isLoggedIn} from './common/auth.js';
import {itemCard, infiniteScroll} from './common/posters.js';

createNavbar();

const moshanApi = new MoshanApi();
const list = document.getElementById('watching');
let cursor = '';

async function loadMore() {
  list.setAttribute('aria-busy', 'true');
  const response = await moshanApi.getItems('latestWatchDate', cursor, 'inProgress');
  list.removeAttribute('aria-busy');

  list.append(...response.items.map(item => itemCard(item, true)));
  cursor = response.endCursor;
  return cursor !== undefined && cursor !== null;
}

if (isLoggedIn() && await loadMore()) {
  infiniteScroll(loadMore);
}

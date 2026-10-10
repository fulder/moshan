import {createNavbar} from './common/navbar.js';
import {MoshanApi} from './api/moshan.js';
import {isLoggedIn} from './common/auth.js';
import {hideDoneToggle, itemCard, loadAll} from './common/posters.js';

createNavbar();

const moshanApi = new MoshanApi();
const list = document.getElementById('watching');
hideDoneToggle(list);
let cursor = '';

async function loadMore() {
  const response = await moshanApi.getItems('latestWatchDate', cursor, 'inProgress');

  list.append(...response.items.map(item => itemCard(item, true)));
  cursor = response.endCursor;
  return cursor !== undefined && cursor !== null;
}

if (isLoggedIn()) {
  loadAll(list, loadMore);
}

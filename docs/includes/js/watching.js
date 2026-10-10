import {createNavbar} from './common/navbar.js';
import {MoshanApi} from './api/moshan.js';
import {isLoggedIn} from './common/auth.js';
import {itemCard, loadMoreButton} from './common/posters.js';

createNavbar();

const moshanApi = new MoshanApi();
const list = document.getElementById('watching');
let cursor = '';

async function loadMore() {
  const response = await moshanApi.getItems('latestWatchDate', cursor, 'inProgress');

  list.append(...response.items.map(item => itemCard(item, true)));
  cursor = response.endCursor;
  return cursor !== undefined && cursor !== null;
}

if (isLoggedIn()) {
  loadMoreButton(list, loadMore);
}

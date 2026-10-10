import {createNavbar} from './common/navbar.js';
import {MoshanApi} from './api/moshan.js';
import {isLoggedIn} from './common/auth.js';
import {loadAll} from './common/posters.js';

createNavbar();

const moshanApi = new MoshanApi();
const tableBody = document.getElementById('backlog-table-body');
const RELEASED = ['Released', 'Airing', 'Ended', 'Running', 'Finished Airing'];
let cursor = '';

async function loadMore() {
  const response = await moshanApi.getItems('rating', cursor, 'onlyBacklog');
  response.items.forEach(createRow);

  cursor = response.endCursor;
  return cursor !== undefined && cursor !== null;
}

function createRow(item) {
  const apiCache = item.apiCache;

  let releaseDate = apiCache.releaseDate;
  if (releaseDate) {
    releaseDate = releaseDate.split('T')[0];
  }

  const href = `review.html?api_name=${item.apiName}&api_id=${item.apiId}`;
  const row = document.createElement('tr');
  row.dataset.href = href;
  if (!RELEASED.includes(apiCache.status) || new Date(apiCache.releaseDate) >= new Date()) {
    row.className = 'muted';
  }
  row.addEventListener('click', () => window.location.href = href);

  const values = [item.createdAt, item.rating, item.apiName, apiCache.title, apiCache.status, releaseDate];
  for (const value of values) {
    const td = document.createElement('td');
    td.textContent = value ?? '';
    row.appendChild(td);
  }

  tableBody.appendChild(row);
}

if (isLoggedIn()) {
  loadAll(document.querySelector('table'), loadMore);
}

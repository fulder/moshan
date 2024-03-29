import {createNavbar} from './common/navbar.js';
import {MoshanApi} from './api/moshan.js';
import {isLoggedIn} from './common/auth.js';

createNavbar();

const moshanApi = new MoshanApi();

let currentCursor = null;
let loadingMore = false;

if (isLoggedIn()) {
    createHistory();
}

async function createHistory(cursor='') {
  const response = await moshanApi.getItems('latestWatchDate', cursor);
  currentCursor = response.data.endCursor;

  createItems(response.data.items);
}

async function createItems(items) {
  let resultHTML = '';

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const apiCache = item.apiCache;

    let image = '/includes/img/image_not_available.png';
    if (apiCache.imageUrl !== null && apiCache.imageUrl !== undefined) {
      image = apiCache.imageUrl.replace('original_untouched', 'medium_portrait');
      if (item.apiName === 'tmdb') {
          image = `https://image.tmdb.org/t/p/w500/${image}`;
      }
    }

    const itemHTML = `
        <div class="col-4 col-md-2 poster">
          <a href="review.html?api_name=${item.apiName}&api_id=${item.apiId}">
            <img class="img-fluid" src="${image}" />
            <p class="text-truncate small">${apiCache.title}</p>
          </a>
      </div>
    `;

    resultHTML += itemHTML;
  }


  document.getElementById('history').innerHTML += resultHTML;
}

async function loadMore() {
  if (loadingMore || currentCursor === null) {
    // Don't trigger load more than once and only if there are more items
    return;
  }
  loadingMore = true;

  await createHistory(currentCursor);

  loadingMore = false;
}

document.addEventListener('scroll', function() {
  if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight) {
      loadMore();
  }
});

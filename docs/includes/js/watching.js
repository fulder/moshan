import {createNavbar} from './common/navbar.js';
import {MoshanApi} from './api/moshan.js';
import {isLoggedIn} from './common/auth.js';

createNavbar();

const moshanApi = new MoshanApi();

let currentCursor = null;
let loadingMore = false;

if (isLoggedIn()) {
    createWatchingList();
}

async function createWatchingList(cursor='') {
  const response = await moshanApi.getItems('latestWatchDate', cursor, 'inProgress');
  currentCursor = response.data.endCursor;

  createItems(response.data.items);
}

async function createItems(items) {
  let resultHTML = '';

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const apiCache = item.apiCache;

    let image = '/includes/img/image_not_available.png';
    if (apiCache.imageUrl !== null) {
      image = apiCache.imageUrl.replace('original_untouched', 'medium_portrait');
      if (item.apiName === 'tmdb') {
          image = `https://image.tmdb.org/t/p/w500/${image}`;
      }
    }

    const itemHTML = `
        <div class="col-4 col-md-2 poster">
          <a href="review.html?api_name=${item.apiName}&api_id=${item.apiId}">
            <img class="img-fluid" src="${image}" />
            <div class="progress">
              <div class="progress-bar" role="progressbar" style="width: ${item.epProgress}%;" aria-valuenow="25" aria-valuemin="0" aria-valuemax="100">${item.epProgress}%</div>
            </div>
            <p class="text-truncate small">${apiCache.title}</p>
          </a>
      </div>
    `;

    resultHTML += itemHTML;
  }


  document.getElementById('watching').innerHTML += resultHTML;
}

async function loadMore() {
  if (loadingMore || currentCursor === null) {
    // Don't trigger load more than once and only if there are more items
    return;
  }
  loadingMore = true;

  await createWatchingList(currentCursor);

  loadingMore = false;
}

document.addEventListener('scroll', function() {
  if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight) {
      loadMore();
  }
});

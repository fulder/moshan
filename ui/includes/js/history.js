/* global WatchHistoryApi, accessToken */
// const urlParams = new URLSearchParams(window.location.search);
// const qParams = new QueryParams(urlParams);
const watchHistoryApi = new WatchHistoryApi();

let currentCursor = null;
let loadingMore = false;

if (accessToken === null) {
  document.getElementById('logInAlert').className = 'alert alert-danger';
} else {
  document.getElementById('logInAlert').className = 'd-none';
}

createHistory();

async function createHistory(cursor='') {
  const response = await watchHistoryApi.getWatchHistory('latest_watch_date', cursor);
  currentCursor = response.data.end_cursor;

  createItems(response.data.items);
}

async function createItems(items) {
  let resultHTML = '';

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const apiCache = item.api_cache;

    let image = '/includes/img/image_not_available.png';
    if (apiCache.image_url !== null) {
      image = apiCache.image_url.replace('original_untouched', 'medium_portrait');
      if (item.api_name === 'tmdb') {
          image = `https://image.tmdb.org/t/p/w500/${image}`;
      }
    }

    const itemHTML = `
        <div class="col-4 col-md-2 poster">
          <a href="/item?api_name=${item.api_name}&api_id=${item.api_id}">
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
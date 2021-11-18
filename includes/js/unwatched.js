/* global WatchHistoryApi, accessToken */
// const urlParams = new URLSearchParams(window.location.search);
// const qParams = new QueryParams(urlParams);

const watchHistoryApi = new WatchHistoryApi();

if (accessToken === null) {
  document.getElementById('logInAlert').className = 'alert alert-danger';
} else {
  document.getElementById('logInAlert').className = 'd-none';
}

createUnwatchedItems();

// function QueryParams(urlParams) {
//
// }

async function createUnwatchedItems(cursor='') {
  const response = await watchHistoryApi.getWatchHistory('ep_progress', cursor);

  createItems(response.data.items);
}

async function createItems(items) {
  let resultHTML = '';


  console.debug(`Length: ${items.length}`);

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const apiCache = item.api_cache;

    console.debug(apiCache.image_url);
    const image = apiCache.image_url.replace('original_untouched', 'medium_portrait');

    const itemHTML = `
        <div class="col-4 col-md-2 poster">
          <a href="/item?api_name=${item.api_name}&api_id=${item.api_id}">
            <img class="img-fluid" src="${image}" />
            <div class="progress">
              <div class="progress-bar" role="progressbar" style="width: ${item.ep_progress}%;" aria-valuenow="25" aria-valuemin="0" aria-valuemax="100">${item.ep_progress}%</div>
            </div>
            <p class="text-truncate small">${apiCache.title}</p>
          </a>
      </div>
    `;

    resultHTML += itemHTML;
  }


  document.getElementById('unwatched').innerHTML += resultHTML;
}

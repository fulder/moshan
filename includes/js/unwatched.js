/* global WatchHistoryApi, accessToken, collectionNames */
// const urlParams = new URLSearchParams(window.location.search);
// const qParams = new QueryParams(urlParams);

const watchHistoryApi = new WatchHistoryApi();

// TODO: move to profile settings
const apiNamesMapping = {
  'movie': 'tmdb',
  'show': 'tvmaze',
  'anime': 'mal',
};

if (accessToken === null) {
  document.getElementById('logInAlert').className = 'alert alert-danger';
} else {
  document.getElementById('logInAlert').className = 'd-none';
}

createUnwatchedItems();

// function QueryParams(urlParams) {
//
// }

async function createUnwatchedItems() {
  const watchHistoryRequests = [];
  for (let i = 0; i < collectionNames.length; i++) {
    const collectionName = collectionNames[i];
    document.getElementById(`unwatched-${collectionName}`).innerHTML = '<div class="spinner-border" role="status"><span class="sr-only">Loading...</span></div>';

    const req = watchHistoryApi.getWatchHistoryByCollection(collectionName, 'ep_progress');
    watchHistoryRequests.push(req);
  }

  const responses = await Promise.all(watchHistoryRequests);

  for (let i = 0; i < collectionNames.length; i++) {
      const collectionName = collectionNames[i];
      createItems(responses[i].data, collectionName);
  }
}

async function createItems(wathcHistoryItems, collectionName) {
  let resultHTML = '';
  let res = true;
  let itemCreated = false;

  const api = getApiByName(apiNamesMapping[collectionName]);

  console.debug(`Length: ${wathcHistoryItems.length}`);

  for (let i = 0; i < wathcHistoryItems.length; i++) {
    const moshanItem = api.getMoshanItem(wathcHistoryItems[i]);
    console.debug(moshanItem);
    const itemHTML = `
        <div id="poster-show-${moshanItem.id}" class="col-4 col-md-2 poster">
          <a href="/item?collection=${collectionName}&api_name=${apiName}&api_id=${moshanItem.id}">
            <img class="img-fluid" src="${moshanItem.poster}" />
            <p class="text-truncate small">${moshanItem.title}</p>
          </a>
      </div>
    `;

    resultHTML += itemHTML;

    itemCreated = itemHTML !== '';
    res = res && itemCreated;
  }

  if (res) {
    document.getElementById('itemsLoadingAlert').className = 'd-none';
  } else {
    document.getElementById('itemsLoadingAlert').className = 'alert alert-warning';
  }

  document.getElementById(`unwatched-${collectionName}`).innerHTML = resultHTML;
}

/* global WatchHistoryApi, accessToken, collectionNames */
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

createCollections();

async function createCollections() {
  for (let i = 0; i < collectionNames.length; i++) {
    const collectionName = collectionNames[i];
    document.getElementById(`${collectionName}WatchHistory`).innerHTML = '<div class="spinner-border" role="status"><span class="sr-only">Loading...</span></div>';

    const res = await watchHistoryApi.getWatchHistoryByCollection(collectionName);
    await createItems(res.data, collectionName);
  }
}

async function createItems(wathcHistoryItems, collectionName) {
  const moshanApi = getMoshanApiByCollectionName(collectionName);

  let requests = [];
  for (let i = 0; i < wathcHistoryItems.items.length; i++) {
    const watchHistoryItem = wathcHistoryItems.items[i];

    const req = moshanApi.getItemById({'id': watchHistoryItem.item_id});
    requests.push(req);
  }

  const responses = await Promise.all(requests);
  console.debug('Moshan responses');
  console.debug(responses);

  const apiName = apiNamesMapping[collectionName];
  const api = getApiByName(apiName);

  let apiRequests = [];
  for (let i = 0; i < responses.length; i++) {
    const res = responses[i].data;

    const req = api.getItemById({'api_id': res[apiName]});
    apiRequests.push(req);
  }

  let resultHTML = '';
  let res = true;
  let itemCreated = false;

  const apiMoshanItems = await Promise.all(apiRequests);

  console.debug('Api responses:');
  console.debug(apiMoshanItems);

  for (let i = 0; i < apiMoshanItems.length; i++) {
    const moshanItem = apiMoshanItems[i];
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

  document.getElementById(`${collectionName}WatchHistory`).innerHTML = resultHTML;
}

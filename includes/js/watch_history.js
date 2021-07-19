/* global WatchHistoryApi, accessToken, collectionNames */
const urlParams = new URLSearchParams(window.location.search);
const qParams = new QueryParams(urlParams);

const watchHistoryApi = new WatchHistoryApi();

let totalPages = 0;

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

function QueryParams(urlParams) {
  for (let i = 0; i < collectionNames.length; i++) {
    const pageName = `${collectionNames[i]}_page`;
    const limitName = `${collectionNames[i]}_limit`;

    this[pageName] = urlParams.get(pageName);

    if (this[pageName] === null) {
      this[pageName] = 1;
    } else {
      this[pageName]= parseInt(this[pageName]);
    }

    this[limitName] = urlParams.get(limitName);
    if (this[limitName] === null) {
      this[limitName] = 12;
    } else {
      this[limitName]= parseInt(this[limitName]);
      document.getElementById(`${collectionNames[i]}-limit`).value = this[limitName];
    }
  }
}

async function createCollections() {
  const watchHistoryRequests = [];
  for (let i = 0; i < collectionNames.length; i++) {
    const collectionName = collectionNames[i];
    document.getElementById(`${collectionName}WatchHistory`).innerHTML = '<div class="spinner-border" role="status"><span class="sr-only">Loading...</span></div>';

    const req = watchHistoryApi.getWatchHistoryByCollection(collectionName, start=qParams[`${collectionName}_page`], limit=qParams[`${collectionName}_limit`]);
    watchHistoryRequests.push(req);
  }

  const responses = await Promise.all(watchHistoryRequests);

  for (let i = 0; i < collectionNames.length; i++) {
      const collectionName = collectionNames[i];
      createPagniation(responses[i].data, collectionName);
      createItems(responses[i].data, collectionName);
  }
}

function createPagniation(wathcHistoryItems, collectionName) {
  let html = `
    <li class="page-item">
      <a class="page-link" href="javascript:void(0)" onclick="loadPreviousItems('${collectionName}', this)">
        <span aria-hidden="true">&laquo;</span>
        <span class="sr-only">Previous</span>
      </a>
    </li>`;


  totalPages = wathcHistoryItems.total_pages;
  const currentLimit = qParams[`${collectionName}_limit`];

  for (let i = 1; i <= totalPages; i++) {
    let className = 'page-item';
    if (i === qParams[`${collectionName}_page`]) {
      className = 'page-item active';
    }

    html += `
      <li class="${className}">
        <a class="page-link" href="javascript:void(0)" onclick="loadItems(${i}, ${currentLimit}, '${collectionName}', this)">${i}</a>
      </li>
    `;
  }

  html += `
    <li class="page-item">
      <a class="page-link" href="javascript:void(0)" onclick="loadNextItems('${collectionName}', this)">
        <span aria-hidden="true">&raquo;</span>
        <span class="sr-only">Next</span>
      </a>
    </li>`;

  document.getElementById(`${collectionName}-pages`).innerHTML = html;
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
    const apiId = res[`${apiName}_id`];

    const req = api.getItemById({'api_id': apiId});
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

/* exported loadPreviousItems */
function loadPreviousItems (collectionName, button) {
  if (qParams[`${collectionName}_page`] > 1) {
    loadItems(qParams[`${collectionName}_page`] - 1, qParams[`${collectionName}_limit`], collectionName, button);
  }
}

/* exported loadNextItems */
function loadNextItems (collectionName, button) {
  if (qParams[`${collectionName}_page`] < totalPages) {
    loadItems(qParams[`${collectionName}_page`] + 1, qParams[`${collectionName}_limit`], collectionName, button);
  }
}

/* exported loadItems */
async function loadItems(page, limit, collectionName, button=undefined) {
  const pageParamName = `${collectionName}_page`;
  const limitParamName = `${collectionName}_limit`;
  const divName = `${collectionName}-pages`;

  const pageChanged = qParams[pageParamName] !== page;
  const limitChanged = qParams[limitParamName] !== limit;

  if (!pageChanged && !limitChanged) {
    return;
  }

  if (pageChanged) {
    document.getElementById(divName).getElementsByTagName('LI')[qParams[pageParamName]].classList.remove('active');
    qParams[pageParamName] = page;
  }
  if (limitChanged) {
    page = Math.round(page / (limit / qParams[limitParamName] ));
    if (page === 0) {
      page = 1;
    }
    qParams[pageParamName] = page;
  }

  const req = await watchHistoryApi.getWatchHistoryByCollection(collectionName, start=page, limit=limit);
  createItems(req.data, collectionName);

  if (limitChanged) {
    createPagniation(req.data, collectionName);
  }

  document.getElementById(divName).getElementsByTagName('LI')[qParams[pageParamName]].classList.add('active');

  if (pageChanged) {
    urlParams.set(pageParamName, qParams[pageParamName]);
    history.pushState({}, null, `?${urlParams.toString()}`);
  }

  if (limitChanged) {
    urlParams.set(limitParamName, qParams[limitParamName]);
    history.pushState({}, null, `?${urlParams.toString()}`);
  }

  if (button !== undefined) {
    button.blur();
  }
}

/* exported changeLimit */
async function changeLimit(collectionName) {
  const limit = document.getElementById(`${collectionName}-limit`).value;
  loadItems(qParams[`${collectionName}_page`], limit, collectionName);
}

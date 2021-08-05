/* global WatchHistoryApi, accessToken, collectionNames */
const urlParams = new URLSearchParams(window.location.search);
const qParams = new QueryParams(urlParams);

const watchHistoryApi = new WatchHistoryApi();

let totalPages = {};
let cache = {};

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
    const qParamName = `${collectionNames[i]}_page`;

    this[qParamName] = urlParams.get(qParamName);

    if (this[qParamName] === null) {
      this[qParamName] = 1;
    } else {
      this[qParamName]= parseInt(this[qParamName]);
    }
  }
}

async function createCollections() {
  const watchHistoryRequests = [];
  for (let i = 0; i < collectionNames.length; i++) {
    const collectionName = collectionNames[i];
    document.getElementById(`${collectionName}WatchHistory`).innerHTML = '<div class="spinner-border" role="status"><span class="sr-only">Loading...</span></div>';

    const req = getCachedWatchHistoryByCollection(collectionName, start=qParams[`${collectionName}_page`]);
    watchHistoryRequests.push(req);
  }

  const responses = await Promise.all(watchHistoryRequests);

  for (let i = 0; i < collectionNames.length; i++) {
      const res = responses[i].data;
      const collectionName = collectionNames[i];
      totalPages[collectionName] = res.total_pages;

      createPagination(collectionName);
      createItems(responses[i].data, collectionName);
  }
}

function createPagination(collectionName, start=null) {
  const maxPages = 2;

  if (start === null) {
      start = qParams[`${collectionName}_page`];
  }

  let html = `
    <li class="page-item">
      <a class="page-link" href="javascript:void(0)" onclick="loadItems(1, '${collectionName}', this)">
        <span aria-hidden="true">&laquo;</span>
        <span class="sr-only">Next</span>
      </a>
    </li>`;

  html += `
    <li class="page-item">
      <a class="page-link" href="javascript:void(0)" onclick="loadPreviousItems('${collectionName}', this)">
        <span aria-hidden="true">&lt;</span>
        <span class="sr-only">Previous</span>
      </a>
    </li>`;


  if ( totalPages[collectionName] > maxPages && start != 1 ) {
    html += `
      <li class="page-item">
        <a class="page-link" href="javascript:void(0)" onclick="createPagination('${collectionName}', ${start-1})">..</a>
      </li>
    `;
  }

  const end = totalPages[collectionName] - start > maxPages ? start + maxPages: totalPages[collectionName];

  if (totalPages[collectionName] > maxPages && end - start < maxPages) {
    // move back start some if it's close to end and there are more than maxPages
    start = end - maxPages;
  }

  for (let i = start; i <= end; i++) {
    let className = 'page-item';
    if (i === qParams[`${collectionName}_page`]) {
      className = 'page-item active';
    }

    html += `
      <li id="${collectionName}_page_${i}" class="${className}">
        <a class="page-link" href="javascript:void(0)" onclick="loadItems(${i}, '${collectionName}', this)">${i}</a>
      </li>
    `;
  }

  if ( end != totalPages[collectionName] ) {
    html += `
      <li class="page-item">
        <a class="page-link" href="javascript:void(0)" onclick="createPagination('${collectionName}', ${start+1})">..</a>
      </li>
    `;
  }

  html += `
    <li class="page-item">
      <a class="page-link" href="javascript:void(0)" onclick="loadNextItems('${collectionName}', this)">
        <span aria-hidden="true">&gt;</span>
        <span class="sr-only">Next</span>
      </a>
    </li>`;

  html += `
    <li class="page-item">
      <a class="page-link" href="javascript:void(0)" onclick="loadItems(${totalPages[collectionName]}, '${collectionName}', this)">
        <span aria-hidden="true">&raquo;</span>
        <span class="sr-only">Next</span>
      </a>
    </li>`;

  document.getElementById(`${collectionName}-pages`).innerHTML = html;
}

async function createItems(wathcHistoryItems, collectionName) {
  let requests = [];
  for (let i = 0; i < wathcHistoryItems.items.length; i++) {
    const watchHistoryItem = wathcHistoryItems.items[i];

    const req = getCachedMoshanItemById(collectionName, watchHistoryItem.item_id);
    requests.push(req);
  }

  const responses = await Promise.all(requests);
  console.debug('Moshan responses');
  console.debug(responses);

  const apiName = apiNamesMapping[collectionName];
  let apiRequests = [];
  for (let i = 0; i < responses.length; i++) {
    const res = responses[i].data;
    const apiId = res[`${apiName}_id`];

    const req = getCachedApiItem(collectionName, apiId);
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
    loadItems(qParams[`${collectionName}_page`] - 1, collectionName, button);
  }
}

/* exported loadNextItems */
function loadNextItems (collectionName, button) {
  if (qParams[`${collectionName}_page`] < totalPages[collectionName]) {
    loadItems(qParams[`${collectionName}_page`] + 1, collectionName, button);
  }
}

/* exported loadItems */
async function loadItems(page, collectionName, button) {
  const qParamsName = `${collectionName}_page`;

  if (qParams[qParamsName] === page) {
    return;
  }

  const activeEl = document.getElementById(`${collectionName}_page_${qParams[qParamsName]}`);
  if (activeEl !== null) {
    activeEl.classList.remove('active');
  }

  qParams[qParamsName] = page;

  const req = await getCachedWatchHistoryByCollection(collectionName, start=page);
  createItems(req.data, collectionName);

  urlParams.set(qParamsName, qParams[qParamsName]);
  history.pushState({}, null, `?${urlParams.toString()}`);

  button.blur();

  const newActiveElement = document.getElementById(`${collectionName}_page_${qParams[qParamsName]}`);
  if (newActiveElement === null) {
    createPagination(collectionName);
  }  else {
      newActiveElement.classList.add('active');
  }
}

async function getCachedWatchHistoryByCollection(collectionName, start) {
  const index = `${collectionName}_page_${start}`;
  if (!(index in cache)) {
    cache[index] = await watchHistoryApi.getWatchHistoryByCollection(collectionName, start=start);
  }

  return cache[index];
}

async function getCachedMoshanItemById(collectionName, itemId) {
  const index = `${collectionName}_${itemId}`;

  if (!(index in cache)) {
    const moshanApi = getMoshanApiByCollectionName(collectionName);
    cache[index] = await moshanApi.getItemById({'id': itemId});
  }

  return cache[index];
}

async function getCachedApiItem(collectionName, id) {
  const index = `${collectionName}_api_${id}`;

  if (!(index in cache)) {
    const apiName = apiNamesMapping[collectionName];
    const api = getApiByName(apiName);
    cache[index] = await api.getItemById({'api_id': id});
  }

  return cache[index];
}

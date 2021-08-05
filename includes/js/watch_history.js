/* global WatchHistoryApi, accessToken, collectionNames */
const urlParams = new URLSearchParams(window.location.search);
const qParams = new QueryParams(urlParams);

const watchHistoryApi = new WatchHistoryApi();

let totalPages = {};

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

    const req = watchHistoryApi.getWatchHistoryByCollection(collectionName, start=qParams[`${collectionName}_page`]);
    watchHistoryRequests.push(req);
  }

  const responses = await Promise.all(watchHistoryRequests);

  for (let i = 0; i < collectionNames.length; i++) {
      const res = responses[i].data;
      const collectionName = collectionNames[i];
      totalPages[collectionName] = res.total_pages;

      createPagniation(collectionName);
      createItems(responses[i].data, collectionName);
  }
}

/* exported loadMorePages */
function loadMorePages(collectionName, start, button) {
  createPagination(collectionName, start);
  button.blur();
}

function createPagniation(collectionName, start=1) {
  let html = `
    <li class="page-item">
      <a class="page-link" href="javascript:void(0)" onclick="loadItems(0, '${collectionName}', this)">
        <span aria-hidden="true">&laquo;&laquo;</span>
        <span class="sr-only">Next</span>
      </a>
    </li>`;

  html += `
    <li class="page-item">
      <a class="page-link" href="javascript:void(0)" onclick="loadPreviousItems('${collectionName}', this)">
        <span aria-hidden="true">&laquo;</span>
        <span class="sr-only">Previous</span>
      </a>
    </li>`;


  if ( totalPages[collectionName] > 5 && start != 1 ) {
    html += `
      <li class="page-item">
        <a class="page-link" href="javascript:void(0)" onclick="loadMorePages(${watchHistoryItems}, '${collectionName}', ${start-1}, this)">..</a>
      </li>
    `;
  }

  const end = totalPages[collectionName] - start > 5 ? 5: totalPages[collectionName];

  for (; start <= end; start++) {
    let className = 'page-item';
    if (start === qParams[`${collectionName}_page`]) {
      className = 'page-item active';
    }

    html += `
      <li class="${className}">
        <a class="page-link" href="javascript:void(0)" onclick="loadItems(${start}, '${collectionName}', this)">${start}</a>
      </li>
    `;
  }

  if ( totalPages[collectionName] > start ) {
    html += `
      <li class="page-item">
        <a class="page-link" href="javascript:void(0)" onclick="loadMorePages(${watchHistoryItems}, '${collectionName}', ${start+1})">..</a>
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

  html += `
    <li class="page-item">
      <a class="page-link" href="javascript:void(0)" onclick="loadItems(${totalPages[collectionName]}, '${collectionName}', this)">
        <span aria-hidden="true">&raquo;&raquo;</span>
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
  const divName = `${collectionName}-pages`;

  if (qParams[qParamsName] === page) {
    return;
  }

  document.getElementById(divName).getElementsByTagName('LI')[qParams[qParamsName]].classList.remove('active');

  qParams[qParamsName] = page;

  const req = await watchHistoryApi.getWatchHistoryByCollection(collectionName, start=page);
  createItems(req.data, collectionName);

  document.getElementById(divName).getElementsByTagName('LI')[qParams[qParamsName]].classList.add('active');

  urlParams.set(qParamsName, qParams[qParamsName]);
  history.pushState({}, null, `?${urlParams.toString()}`);

  button.blur();
}

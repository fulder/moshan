/* global MoshanApi, accessToken */
// const urlParams = new URLSearchParams(window.location.search);
// const qParams = new QueryParams(urlParams);

const moshanApi = new MoshanApi();

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
  const response = await moshanApi.getItems('epProgress', cursor);

  createItems(response.data.items);
}

async function createItems(items) {
  let resultHTML = '';


  console.debug(`Length: ${items.length}`);

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const apiCache = item.apiCache;

    let image = '/includes/img/image_not_available.png';
    if ('imageUrl' in apiCache && apiCache.imageUrl !== null) {
      image = apiCache.imageUrl.replace('original_untouched', 'medium_portrait');
    }

    const itemHTML = `
        <div class="col-4 col-md-2 poster">
          <a href="/item?api_name=${item.apiName}&api_id=${item.apiId}">
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


  document.getElementById('unwatched').innerHTML += resultHTML;
}

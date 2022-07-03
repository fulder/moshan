import {createNavbar} from './common/navbar.js';
import {MoshanApi} from './api/moshan.js';
import {isLoggedIn} from './common/auth.js';

createNavbar();

const moshanApi = new MoshanApi();

if (isLoggedIn()) {
    createUnwatchedItems();
}

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


  document.getElementById('unwatched').innerHTML += resultHTML;
}

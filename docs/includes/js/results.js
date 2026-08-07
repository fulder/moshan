import {createNavbar} from './common/navbar.js';
import {getApiByName} from './api/common.js';
import {isLoggedIn} from './common/auth.js';

createNavbar();

const urlParams = new URLSearchParams(window.location.search);
const qParams = new QueryParams(urlParams);

// Will be moved to profile settings in the future
const searches = [
  {apiName: 'mal', resultsElementId: 'animeResults'},
  {apiName: 'tvmaze', resultsElementId: 'showResults'},
  {apiName: 'tmdb', resultsElementId: 'movieResults'},
];

if (isLoggedIn()) {
  for (const {resultsElementId} of searches) {
    document.getElementById(resultsElementId).innerHTML = '<div class="spinner-border" role="status"><span class="sr-only">Loading...</span></div>';
  }

  getResults();
}

function QueryParams(urlParams) {
  this.search = urlParams.get('search');
}

async function getResults() {
  // Each source is searched and rendered independently so one API failing
  // (e.g. a non-2xx response) doesn't stop the others from showing results.
  await Promise.all(searches.map(({apiName, resultsElementId}) =>
    searchAndRender(apiName, resultsElementId)
  ));
}

async function searchAndRender(apiName, resultsElementId) {
  try {
    const moshanItems = await getApiByName(apiName).search(qParams);
    createResults(moshanItems, apiName, resultsElementId);
  } catch (err) {
    console.error(`Search failed for ${apiName}`, err);
    document.getElementById(resultsElementId).innerHTML = '<p class="text-muted small">Search is unavailable right now.</p>';
  }
}

function createResults(moshanItems, apiName, resultsElementId) {
  console.debug(moshanItems);

  let resultHTML = '';
  for (let i=0; i<moshanItems.items.length; i++) {
    const moshanItem = moshanItems.items[i];
    resultHTML += `
      <div class="col-4 col-md-2 poster">
        <a href="/review.html?collection=${moshanItems.collection_name}&api_name=${apiName}&api_id=${moshanItem.id}">
          <img class="img-fluid" src=${moshanItem.imageUrl} />
          <p class="text-truncate small">${moshanItem.title}</p>
        </a>
      </div>
    `;
  }

  document.getElementById(resultsElementId).innerHTML = resultHTML;
}

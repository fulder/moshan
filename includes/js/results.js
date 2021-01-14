/* global accessToken */
const urlParams = new URLSearchParams(window.location.search);
const qParams = new QueryParams(urlParams);

// Will be moved to profile settings in the future
const animeApiName = 'mal';
const showApiName = 'tvmaze';

const animeApi = getApiByName(animeApiName);
const showApi = getApiByName(showApiName);

if (accessToken === null) {
  document.getElementById('logInAlert').className = 'alert alert-danger';
} else {
  document.getElementById('logInAlert').className = 'd-none';
  document.getElementById('animeResults').innerHTML = '<div class="spinner-border" role="status"><span class="sr-only">Loading...</span></div>';
  document.getElementById('showResults').innerHTML = '<div class="spinner-border" role="status"><span class="sr-only">Loading...</span></div>';
}

getResults();

function QueryParams(urlParams) {
  this.search = urlParams.get('search');
}

async function getResults() {
  const animeMoshanItems = await animeApi.search(qParams);
  const showMoshanItems = await showApi.search(qParams);

  createResults(animeMoshanItems, animeApiName);
  createResults(showMoshanItems, showApiName);
}

function createResults(moshanItems, apiName) {
  let resultHTML = '';
  for (let i=0; i<moshanItems.length; i++) {
    resultHTML += createResultItem(animeMoshanItems[i], apiName);
  }
  console.debug(resultHTML);

  document.getElementById(`${moshanItems[0].collection_name}Results`).innerHTML = resultHTML;
}

function createResultItem(moshanItem, apiName) {
  console.debug(moshanItem);

  let poster = '/includes/img/image_not_available.png';
  if (moshanItem.poster !== undefined) {
    poster = moshanItem.poster;
  }

  return `
    <div class="col-4 col-md-2 poster">
      <a href="/item/index.html?collection=${moshanItem.collection_name}&api_name=${apiName}&api_id=${moshanItem.id}">
        <img class="img-fluid" src=${poster} />
        <p class="text-truncate small">${moshanItem.title}</p>
      </a>
    </div>
  `;
}

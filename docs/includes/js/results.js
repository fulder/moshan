/* global accessToken */
const urlParams = new URLSearchParams(window.location.search);
const qParams = new QueryParams(urlParams);

// Will be moved to profile settings in the future
const animeApiName = 'mal';
const showApiName = 'tvmaze';
const movieApiName = 'tmdb';

const animeApi = getApiByName(animeApiName);
const showApi = getApiByName(showApiName);
const movieApi = getApiByName(movieApiName);

if (accessToken === null) {
  document.getElementById('logInAlert').className = 'alert alert-danger';
} else {
  document.getElementById('logInAlert').className = 'd-none';
  document.getElementById('animeResults').innerHTML = '<div class="spinner-border" role="status"><span class="sr-only">Loading...</span></div>';
  document.getElementById('showResults').innerHTML = '<div class="spinner-border" role="status"><span class="sr-only">Loading...</span></div>';
  document.getElementById('movieResults').innerHTML = '<div class="spinner-border" role="status"><span class="sr-only">Loading...</span></div>';
}

getResults();

function QueryParams(urlParams) {
  this.search = urlParams.get('search');
}

async function getResults() {
  const animeMoshanItems = await animeApi.search(qParams);
  const showMoshanItems = await showApi.search(qParams);
  const movieMoshanItems = await movieApi.search(qParams);

  createResults(animeMoshanItems, animeApiName);
  createResults(showMoshanItems, showApiName);
  createResults(movieMoshanItems, movieApiName);
}

function createResults(moshanItems, apiName) {
  console.debug(moshanItems);

  let resultHTML = '';
  for (let i=0; i<moshanItems.items.length; i++) {
    const moshanItem = moshanItems.items[i];
    resultHTML += `
      <div class="col-4 col-md-2 poster">
        <a href="/item/index.html?collection=${moshanItems.collection_name}&api_name=${apiName}&api_id=${moshanItem.id}">
          <img class="img-fluid" src=${moshanItem.poster} />
          <p class="text-truncate small">${moshanItem.title}</p>
        </a>
      </div>
    `;
  }

  document.getElementById(`${moshanItems.collection_name}Results`).innerHTML = resultHTML;
}

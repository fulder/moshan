/* global accessToken */
const urlParams = new URLSearchParams(window.location.search);
const qParams = new QueryParams(urlParams);

const animeApi = getApiByName(qParams.anime_api);
const showApi = getApiByName(qParams.show_api);

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
  this.anime_api = urlParams.get('anime_api');
  this.show_api = urlParams.get('show_api');
}

async function getResults() {
  const animeReq = animeApi.search(qParams);
  const showReq = showApi.search(qParams);

  const [animeRes, showRes] = await Promise.all([animeReq, showReq]);

  createAnimeResults(animeRes);
  createShowResults(showRes);
}

function createAnimeResults (animes) {
  let resultHTML = '';
  console.debug(animes);
  for (let i=0; i<animes.data.length; i++) {
    resultHTML += createResultAnimeItem(animes.data[i].node);
  }

  document.getElementById('animeResults').innerHTML = resultHTML;
}

function createResultAnimeItem (anime) {
  console.debug(anime);
  const title = anime.title;
  const externalId = anime.id;

  let poster = '/includes/img/image_not_available.png';
  if (anime.main_picture !== undefined) {
    poster = anime.main_picture.medium;
  }

  return `
    <div class="col-4 col-md-2 poster">
      <a href="/item/index.html?collection=anime&api_name=${qParams.anime_api}&api_id=${externalId}">
        <img class="img-fluid" src=${poster} />
        <p class="text-truncate small">${title}</p>
      </a>
    </div>
  `;
}

function createShowResults (shows) {
  let resultHTML = '';
  console.debug(shows);
  for (let i=0; i<shows.length; i++) {
    resultHTML += createResultShowItem(shows[i].show);
  }

  document.getElementById('showResults').innerHTML = resultHTML;
}

function createResultShowItem (show) {
  console.debug(show);
  const title = show.name;

  let poster = '/includes/img/image_not_available.png';
  if (show.image !== null) {
    poster = show.image.medium;
  }

  const externalId = show.id;

  return `
    <div class="col-4 col-md-2 poster">
      <a href="/item/index.html?collection=show&api_name=${qParams.show_api}&api_id=${externalId}">
        <img class="img-fluid" src=${poster} />
        <p class="text-truncate small">${title}</p>
      </a>
    </div>
  `;
}

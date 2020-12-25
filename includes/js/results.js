/* global AnimeApi, TvMazeApi, accessToken */

const animeApi = new AnimeApi();
const tvMazeApi = new TvMazeApi();

const urlParams = new URLSearchParams(window.location.search);
const searchString = urlParams.get('search');

if (accessToken === null) {
  document.getElementById('logInAlert').className = 'alert alert-danger';
} else {
  document.getElementById('logInAlert').className = 'd-none';
  document.getElementById('animeResults').innerHTML = '<div class="spinner-border" role="status"><span class="sr-only">Loading...</span></div>';
  document.getElementById('showResults').innerHTML = '<div class="spinner-border" role="status"><span class="sr-only">Loading...</span></div>';
}

animeRequest = animeApi.search(searchString);

animeApi.search(searchString).then(function (response) {
  createAnimeResults(response.data);
}).catch(function (error) {
  console.log(error);
});

tvMazeApi.search(searchString).then(function (response) {
  createShowResults(response.data);
}).catch(function (error) {
  console.log(error);
});

function createAnimeResults (animes) {
  let resultHTML = '';
  console.debug(animes);
  for (let i=0; i<animes.items.length; i++) {
    resultHTML += createResultAnimeItem(animes.items[i]);
  }

  document.getElementById('animeResults').innerHTML = resultHTML;
}

function createResultAnimeItem (anime) {
  console.debug(anime);
  const title = anime.title;
  const externalId = anime.id;

  let poster = '/includes/img/image_not_available.png';
  if (anime.main_picture !== null) {
    poster = anime.main_picture.medium;
  }

  return `
    <div class="col-4 col-md-2 poster">
      <a href="/anime/index.html?mal_id=${externalId}">
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
      <a href="/show/index.html?tvmaze_id=${externalId}">
        <img class="img-fluid" src=${poster} />
        <p class="text-truncate small">${title}</p>
      </a>
    </div>
  `;
}

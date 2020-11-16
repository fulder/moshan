/* global AnimeApi, accessToken */

const animeApi = new AnimeApi();

const urlParams = new URLSearchParams(window.location.search);
const searchString = urlParams.get('search');

if (accessToken === null) {
  document.getElementById('logInAlert').className = 'alert alert-danger';
} else {
  document.getElementById('logInAlert').className = 'd-none';
  document.getElementById('animeResults').innerHTML = '<div class="spinner-border" role="status"><span class="sr-only">Loading...</span></div>';
}

animeApi.search(searchString).then(function (response) {
  createAnimeResults(response.data);
}).catch(function (error) {
  console.log(error);
});

function createAnimeResults (animes) {
  let resultHTML = '';
  console.log(animes);
  for (const anime in animes.items) {
    resultHTML += createResultAnimeItem(anime);
  }

  document.getElementById('animeResults').innerHTML = resultHTML;
}

function createResultAnimeItem (anime) {
  const title = anime.title;
  const poster = anime.main_picture.medium;
  const externalId = anime.id;

  return `
    <div class="col-4 col-md-2 poster">
      <a href="/anime/index.html?mal_id=${externalId}">
        <img class="img-fluid" src=${poster} />
        <p class="text-truncate small">${title}</p>
      </a>
    </div>
  `;
}

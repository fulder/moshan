/* global WatchHistoryApi, accessToken */

const watchHistoryApi = new WatchHistoryApi();

if (accessToken === null) {
  document.getElementById('logInAlert').className = 'alert alert-danger';
} else {
  document.getElementById('logInAlert').className = 'd-none';
  document.getElementById('animeWatchHistory').innerHTML = '<div class="spinner-border" role="status"><span class="sr-only">Loading...</span></div>';
}

watchHistoryApi.getWatchHistoryByCollection('anime').then(function (response) {
  createAnimeItems(response.data);
}).catch(function (error) {
  console.log(error);
});

function createAnimeItems (response) {
  let resultHTML = '';

  let res = true;
  let itemCreated = false;
  for (const [animeId, anime] of Object.entries(response.items)) {
    const itemHTML = createHistoryAnimeItem(animeId, anime);
    resultHTML += itemHTML;

    itemCreated = itemHTML !== '';

    res = res && itemCreated;
  }

  if (res) {
    document.getElementById('itemsLoadingAlert').className = 'd-none';
  } else {
    document.getElementById('itemsLoadingAlert').className = 'alert alert-warning';
  }

  document.getElementById('animeWatchHistory').innerHTML = resultHTML;
}

function createHistoryAnimeItem (animeId, anime) {
  if (!('title' in anime) || !('main_picture' in anime)) {
    return '';
  }

  const title = anime.title;
  const poster = anime.main_picture.medium;

  const resultHTML = `
    <div id="poster-anime-${animeId}" class="col-4 col-md-2 poster">
    <a href="/anime?id=${animeId}">
    <img class="img-fluid" src="${poster}">
    <p class="text-truncate small">${title}</p></img></div>
    </a>
  `;

  return resultHTML;
}

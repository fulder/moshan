/* global WatchHistoryApi, AnimeApi, accessToken */

const watchHistoryApi = new WatchHistoryApi();
const animeApi = new AnimeApi();

if (accessToken === null) {
  document.getElementById('logInAlert').className = 'alert alert-danger';
} else {
  document.getElementById('logInAlert').className = 'd-none';
  document.getElementById('animeWatchHistory').innerHTML = '<div class="spinner-border" role="status"><span class="sr-only">Loading...</span></div>';
}


watchHistoryApi.getWatchHistoryByCollection('anime').then(function (response) {
  getAnimeItems(response.data);
}).catch(function (error) {
  console.log(error);
});

function getAnimeItems (response) {
  console.debug('WatchHistory anime response:');
  console.debug(response);

  let animeApiRequests = [];
  for (const watchHistoryAnime of response.items) {
    animeRequest = animeApi.getAnimeById(watchHistoryAnime.item_id);
    animeApiRequests.push(animeRequest);
  }

  let resultHTML = '';
  let res = true;
  let itemCreated = false;

  axios.all(animeRequest).then(axios.spread((...animeResponses) => {
    for (const anime of animeResponses) {
      createHistoryAnimeItem(anime);
    }
    resultHTML += itemHTML;

    itemCreated = itemHTML !== '';
    res = res && itemCreated;
  })).catch(errors => {
    console.log(errors);
  });


  if (res) {
    document.getElementById('itemsLoadingAlert').className = 'd-none';
  } else {
    document.getElementById('itemsLoadingAlert').className = 'alert alert-warning';
  }

  document.getElementById('animeWatchHistory').innerHTML = resultHTML;
}

function createHistoryAnimeItem (anime) {
  if (!('title' in anime) || !('main_picture' in anime)) {
    return '';
  }

  const animeId = anime.id;
  const title = anime.title;
  const poster = anime.main_picture.medium;

  const resultHTML = `
      <div id="poster-anime-${animeId}" class="col-4 col-md-2 poster">
        <a href="/anime?id=${animeId}">
          <img class="img-fluid" src="${poster}" />
          <p class="text-truncate small">${title}</p>
        </a>
    </div>
  `;

  return resultHTML;
}

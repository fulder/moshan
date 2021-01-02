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
  for (let i = 0; i < response.items.length; i++) {
    const watchHistoryAnime = response.items[i];
    animeRequest = animeApi.getAnimeById(watchHistoryAnime.item_id);
    animeApiRequests.push(animeRequest);
  }

  let resultHTML = '';
  let res = true;
  let itemCreated = false;

  axios.all(animeApiRequests).then(axios.spread((...animeResponses) => {
    console.debug('Anime responses:');
    console.debug(animeResponses);

    for (let i = 0; i < animeResponses.length; i++) {
      const itemHTML = createHistoryAnimeItem(animeResponses[i]);

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
  })).catch(errors => {
    console.log(errors);
  });
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

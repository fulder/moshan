/* global WatchHistoryApi, AnimeApi, ShowsApi, TvMazeApi, accessToken */
const watchHistoryApi = new WatchHistoryApi();
const animeApi = new AnimeApi();
const api = new TvMazeApi();
const showApi = new ShowsApi();


if (accessToken === null) {
  document.getElementById('logInAlert').className = 'alert alert-danger';
} else {
  document.getElementById('logInAlert').className = 'd-none';
  document.getElementById('animeWatchHistory').innerHTML = '<div class="spinner-border" role="status"><span class="sr-only">Loading...</span></div>';
  document.getElementById('showsWatchHistory').innerHTML = '<div class="spinner-border" role="status"><span class="sr-only">Loading...</span></div>';
}

getCollections();

async function getCollections() {
  const animeRes = await watchHistoryApi.getWatchHistoryByCollection('anime');
  const showRes = await watchHistoryApi.getWatchHistoryByCollection('show');

  await getAnimeItems(animeRes.data);
  await getShowItems(showRes.data);
}

async function getAnimeItems (response) {
  console.debug('WatchHistory anime response:');
  console.debug(response);

  let animeApiRequests = [];
  for (let i = 0; i < response.items.length; i++) {
    const watchHistoryAnime = response.items[i];
    animeRequest = animeApi.getItemById({'id': watchHistoryAnime.item_id});
    animeApiRequests.push(animeRequest);
  }

  let resultHTML = '';
  let res = true;
  let itemCreated = false;

  const animeResponses = await Promise.all(animeApiRequests);

  console.debug('Anime responses:');
  console.debug(animeResponses);

  for (let i = 0; i < animeResponses.length; i++) {
    const itemHTML = createHistoryAnimeItem(animeResponses[i].data);

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

function createHistoryAnimeItem (anime) {
  if (!('title' in anime) || !('main_picture' in anime)) {
    return '';
  }

  const animeId = anime.id;
  const title = anime.title;
  const poster = anime.main_picture.medium;

  const resultHTML = `
      <div id="poster-anime-${animeId}" class="col-4 col-md-2 poster">
        <a href="/item?collection=anime&api_name=mal&id=${animeId}">
          <img class="img-fluid" src="${poster}" />
          <p class="text-truncate small">${title}</p>
        </a>
    </div>
  `;

  return resultHTML;
}

async function getShowItems (response) {
  console.debug('WatchHistory show response:');
  console.debug(response);

  let showsApiRequests = [];
  for (let i = 0; i < response.items.length; i++) {
    const watchHistoryItem = response.items[i];
    const showRequest = showApi.getItemById({'id': watchHistoryItem.item_id});
    showsApiRequests.push(showRequest);
  }

  const showResponses = await Promise.all(showsApiRequests);
  console.debug('Moshan show responses');
  console.debug(showResponses);

  let apiRequests = [];
  for (let i = 0; i < showResponses.length; i++) {
    const showApiResponse = showResponses[i].data;
    const showRequest = api.getItemById({'api_id': showApiResponse.tvmaze_id});
    apiRequests.push(showRequest);
  }

  let resultHTML = '';
  let res = true;
  let itemCreated = false;

  const apiMoshanItems = await Promise.all(apiRequests);

  console.debug('Show api responses:');
  console.debug(apiResponses);

  for (let i = 0; i < apiMoshanItems.length; i++) {
    const itemHTML = createHistoryShowItem(apiMoshanItems[i]);

    resultHTML += itemHTML;

    itemCreated = itemHTML !== '';
    res = res && itemCreated;
  }

  if (res) {
    document.getElementById('itemsLoadingAlert').className = 'd-none';
  } else {
    document.getElementById('itemsLoadingAlert').className = 'alert alert-warning';
  }

  document.getElementById('showsWatchHistory').innerHTML = resultHTML;
}

function createHistoryShowItem (moshanItem) {
  if (moshanItem.title === undefined || moshanItem.poster === undefined) {
    return '';
  }

  const resultHTML = `
      <div id="poster-show-${moshanItem.id}" class="col-4 col-md-2 poster">
        <a href="/item?collection=show&api_name=tvmaze&api_id=${moshanItem.id}">
          <img class="img-fluid" src="${moshanItem.poster}" />
          <p class="text-truncate small">${moshanItem.title}</p>
        </a>
    </div>
  `;

  return resultHTML;
}

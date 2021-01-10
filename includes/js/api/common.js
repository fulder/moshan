let checkTokenPromise = null;

/* exported axiosTokenInterceptor */
async function axiosTokenInterceptor (config) {
  if (checkTokenPromise === null) {
    checkTokenPromise = checkToken();
  }

  await checkTokenPromise;
  checkTokenPromise = null;
  config.headers.Authorization = accessToken;
  return config;
}

/* exported MoshanItem */
function MoshanItem(poster, title, start_date, status, synopsis, has_episodes) {
  this.poster = poster;
  this.title = title;
  this.start_date = start_date;
  this.status = status;
  this.synopsis = synopsis;
  this.has_episodes = has_episodes;
}

/* exported MoshanEpisodes */
function MoshanEpisodes(episodes, total_pages) {
  this.episodes = episodes;
  this.total_pages = total_pages;
}

/* exported MoshanEpisode */
function MoshanEpisode(id, number, title, air_date, previous_id, next_id) {
  this.id = id;
  this.number = number;
  this.title = title;
  this.air_date = air_date;
  this.aired = Date.parse(this.air_date) <= (new Date()).getTime();
  this.status = this.aired ? 'Aired' : 'Not Aired';
  this.previous_id = previous_id;
  this.next_id = next_id;
}

/* exported ApiQueryParams */
function ApiQueryParams(urlParams) {
  this.collection = urlParams.get('collection');
  this.api_name = urlParams.get('api_name');
  this.id = urlParams.get('id');
  this.api_id = urlParams.get('api_id');
  this.episode_id = urlParams.get('episode_id');
}

/* exported getMoshanApiByCollectionName */
function getMoshanApiByCollectionName(collection) {
  switch(collection) {
    case 'show':
      return new ShowsApi();
    case 'anime':
      return new AnimeApi();
  }
}

/* exported getApiByName */
function getApiByName(name) {
  switch(name) {
    case 'mal':
      return new MalApi();
    case 'tvmaze':
      return new TvMazeApi();
  }
}

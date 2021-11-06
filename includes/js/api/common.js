let checkTokenPromise = null;

/* exported collectionNames */
const collectionNames = ['movie', 'show', 'anime'];

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

/* exported MoshanItems */
function MoshanItems(collection_name) {
  this.collection_name = collection_name;
  this.items = [];
}

/* exported MoshanItem */
function MoshanItem(id, poster, title, start_date, status, synopsis, has_episodes, collection_name) {
  this.id = id;
  this.poster = poster;
  this.title = title;
  this.start_date = start_date;
  this.status = status;
  this.synopsis = synopsis;
  this.has_episodes = has_episodes;
  this.collection_name = collection_name;
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

/* exported getApiByName */
function getApiByName(name) {
  switch(name) {
    case 'mal':
      return new MalApi();
    case 'tvmaze':
      return new TvMazeApi();
    case 'tmdb':
      return new TmdbApi();
  }
}

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
function MoshanItem(poster, title, start_date, status, synopsis) {
  this.poster = poster;
  this.title = title;
  this.start_date = start_date;
  this.status = status;
  this.synopsis = synopsis;
}

/* exported MoshanEpisode */
function MoshanEpisode(id, number, title, air_date) {
  this.id = id;
  this.number = number;
  this.title = title;
  this.air_date = air_date;
  this.aired = Date.parse(this.air_date) <= (new Date()).getTime();;
}

/* exported getApiFromName */
function getApiFromName(apiName) {
  switch(apiName) {
    case 'mal':
      return new MalApi();
    case 'tvmaze':
      return new TvMazeApi();
    case 'anime':
      return new Anime();
    case 'show':
      return new Show();
  }
}

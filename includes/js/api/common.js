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
function MoshanItem(poster, title, start_date, status, synopsis, mal_link, anidb_link) {
  this.poster = poster;
  this.title = title;
  this.start_date = start_date;
  this.status = status;
  this.synopsis = synopsis;

  // TODO: make links more dynamic
  this.mal_link = mal_link;
  this.anidb_link = anidb_link;
}

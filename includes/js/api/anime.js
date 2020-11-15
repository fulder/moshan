class AnimeApi {
  constructor () {
    this.apiAxios = axios.create({
      baseURL: 'https://api.anime.moshan.tv/v1',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    this.apiAxios.interceptors.request.use(axiosTokenInterceptor, function (error) {
      console.log(error);
      return Promise.reject(error);
    });
  }

  searchAnime (searchString) {
    return .get(`/anime?search=${searchString}`);
  }

  getAnimeByApiId (apiName, id) {
    return this.apiAxios.get(`/anime?${apiName}_id=${id}`);
  }

  getAnimeById (id) {
    return this.apiAxios.get(`/anime/${id}`);
  }

  getAnimeEpisodes (id, start = 1, limit = 100) {
    return this.apiAxios.get(`/anime/${id}/episodes?limit=${limit}&start=${start}`);
  }

  getAnimeEpisode (id, episodeId) {
    return this.apiAxios.get(`/anime/${id}/episode/${episodeId}`);
  }
}

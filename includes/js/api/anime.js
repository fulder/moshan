/* global axios, axiosTokenInterceptor */
/* exported AnimeApi */
class AnimeApi {
  constructor () {
    this.apiAxios = axios.create({
      baseURL: 'https://api.anime.moshan.tv/v1',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.apiAxios.interceptors.request.use(axiosTokenInterceptor, function (error) {
      console.log(error);
      return Promise.reject(error);
    });
  }

  getItemByApiId (apiName, id) {
    return this.apiAxios.get(`/anime?${apiName}_id=${id}`);
  }

  getItemById (id) {
    return this.apiAxios.get(`/anime/${id}`);
  }

  getEpisodes (id, start = 1, limit = 100) {
    return this.apiAxios.get(`/anime/${id}/episodes?limit=${limit}&start=${start}`);
  }

  getEpisode (id, episodeId) {
    return this.apiAxios.get(`/anime/${id}/episode/${episodeId}`);
  }

  addItem(apiName, apiId) {
    const data = {
      api_name: apiName,
      api_id: apiId,
    };
    return this.apiAxios.post('/anime', data);
  }

  getMoshanEpisode(episode) {
    const nextId = 'id_links' in episode && 'next' in episode['id_links'] ? episode['id_links']['next'] : null;
    const previousId = 'id_links' in episode && 'previous' in episode['id_links'] ? episode['id_links']['previous'] : null;

    return new MoshanEpisode(
      episode.id,
      episode.episode_number,
      episode.title,
      episode.air_date,
      previousId,
      nextId
    );
  }
}

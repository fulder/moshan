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

  getItemByApiId (qParams) {
    return this.apiAxios.get(`/anime?${qParams.api_name}_id=${qParams.api_id}`);
  }

  getItemById (qParams) {
    return this.apiAxios.get(`/anime/${qParams.id}`);
  }

  getEpisodes (qParams) {
    return this.apiAxios.get(`/anime/${qParams.id}/episodes?limit=100&start=${qParams.episode_page}`);
  }

  getEpisode (qParams) {
    return this.apiAxios.get(`/anime/${qParams.id}/episode/${qParams.episode_id}`);
  }

  addItem(qParams) {
    const data = {
      api_name: qParams.api_name,
      api_id: qParams.api_id,
    };
    return this.apiAxios.post('/anime', data);
  }

  getMoshanEpisodes(episodes) {
    return new MoshanEpisodes(
        episodes.items,
        episodes.total_pages
    );
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

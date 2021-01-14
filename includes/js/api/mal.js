/* global axios, MoshanItem */
/* exported MalApi */
class MalApi {
  constructor () {
    this.apiAxios = axios.create({
      baseURL: 'https://api.anime.moshan.tv/v1/mal_proxy',
      headers: {
        'Content-Type': 'application/json',
        'X-Mal-Client-Id': '6f7663be0ec1555fe4dcb612763954c2',
      },
    });

    this.apiAxios.interceptors.request.use(axiosTokenInterceptor, function (error) {
      console.log(error);
      return Promise.reject(error);
    });
  }

  async search(qParams) {
    const res = await this.apiAxios.get(`/anime?q=${qParams.search}`);

    const moshanItems = new MoshanItems('anime');
    for (let i=0; i<res.data.length; i++) {
      const moshanItem = this.getMoshanItem(res.data[i].node);
      moshanItems.items.push(moshanItem);
    }
    return moshanItems;

  }

  getItemById(qParams) {
    return this.apiAxios.get(`/anime/${qParams.api_id}?fields=start_date,num_episodes,synopsis`);
  }

  getMoshanItem(anime) {
    console.debug(anime);

    let status = 'Airing';
    if ('end_date' in anime && anime.end_date !== null) {
      status = 'Finished';
    }

    const hasEpisodes = 'num_episodes' in anime && anime.num_episodes != 1;

    return new MoshanItem(
      anime.id,
      anime.main_picture.medium,
      anime.title,
      anime.start_date,
      status,
      anime.synopsis,
      hasEpisodes,
      'anime'
    );
  }
}

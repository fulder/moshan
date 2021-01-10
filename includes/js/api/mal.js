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

  search(searchString) {
    return this.apiAxios.get(`/anime?q=${searchString}`);
  }

  getAnimeById(id) {
    return this.apiAxios.get(`/anime/${id}?fields=start_date,num_episodes,synopsis`);
  }

  getMoshanItem(anime) {
    console.debug(anime);
    
    let status = 'Airing';
    if ('end_date' in anime && anime.end_date !== null) {
      status = 'Finished';
    }

    return MoshanItem(
      anime.main_picture.large,
      anime.title,
      anime.start_date,
      status,
      anime.synopsis,
      anime.id,
      null
    );
  }
}

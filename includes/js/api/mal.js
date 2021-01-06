/* global axios */
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
    return this.apiAxios.get(`/anime/${id}?fields=start_date`);
  }
}

/* global axios */
/* exported MalApi */
class MalApi {
  constructor () {
    this.apiAxios = axios.create({
      baseURL: 'https://api.myanimelist.net/v2',
      headers: {
        'Content-Type': 'application/json',
        'X-Mal-Client-Id': '6f7663be0ec1555fe4dcb612763954c2',
      },
    });
  }

  search(searchString) {
    return this.apiAxios.get(`/anime?q=${searchString}`);
  }

  getAnimeById(id) {
    return this.apiAxios.get(`/anime/${id}`);
  }
}

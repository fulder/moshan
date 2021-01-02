/* global axios */
/* exported TvMazeApi */
class TvMazeApi {
  constructor () {
    this.apiAxios = axios.create({
      baseURL: 'https://api.tvmaze.com',
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  search (searchString) {
    return this.apiAxios.get(`/search/shows?q=${searchString}`);
  }

  getShowById(id) {
    return this.apiAxios.get(`/shows/${id}`);
  }

  getShowEpisodes(id) {
    return this.apiAxios.get(`/shows/${id}/episodes`);
  }
}

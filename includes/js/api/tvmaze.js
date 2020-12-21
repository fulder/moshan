/* global axios */
/* exported TvMazeApi */
class TvMazeApi {
  constructor () {
    this.apiAxios = axios.create({
      baseURL: 'http://api.tvmaze.com',
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  search (searchString) {
    return this.apiAxios.get(`/search/shows?q=${searchString}`);
  }
}

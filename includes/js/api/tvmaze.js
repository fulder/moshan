/* global axios, axiosTokenInterceptor */
/* exported TvMazeApi */
class TvMazeApi {
  constructor () {
    this.apiAxios = axios.create({
      baseURL: 'http://api.tvmaze.com',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.apiAxios.interceptors.request.use(axiosTokenInterceptor, function (error) {
      console.log(error);
      return Promise.reject(error);
    });
  }

  search (searchString) {
    return this.apiAxios.get(`/search/shows?q=${searchString}`);
  }
}

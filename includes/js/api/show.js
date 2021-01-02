/* global axios, axiosTokenInterceptor */
/* exported ShowsApi */
class ShowsApi {
  constructor () {
    this.apiAxios = axios.create({
      baseURL: 'https://api.shows.moshan.tv/v1',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.apiAxios.interceptors.request.use(axiosTokenInterceptor, function (error) {
      console.log(error);
      return Promise.reject(error);
    });
  }

  getShowById (id) {
    return this.apiAxios.get(`/show/${id}`);
  }
}

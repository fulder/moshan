/* global axios, axiosTokenInterceptor */
/* exported MovieApi */
class MovieApi {
  constructor () {
    this.apiAxios = axios.create({
      baseURL: 'https://api.movie.moshan.tv/',
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
    return this.apiAxios.get(`/movies?${qParams.api_name}_id=${qParams.api_id}`);
  }

  getItemById (qParams) {
    return this.apiAxios.get(`/movies/${qParams.id}`);
  }

  addItem(qParams) {
    const data = {
      api_name: qParams.api_name,
      api_id: qParams.api_id,
    };
    return this.apiAxios.post('/movies', data);
  }
}

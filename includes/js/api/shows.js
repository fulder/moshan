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

  getItemById(id) {
    return this.apiAxios.get(`/shows/${id}`);
  }

  getItemByApiId (apiName, id) {
    return this.apiAxios.get(`/shows?${apiName}_id=${id}`);
  }

  addItem(apiName, apiId) {
    const data = {
      api_name: apiName,
      api_id: apiId,
    };
    return this.apiAxios.post('/show', data);
  }
}

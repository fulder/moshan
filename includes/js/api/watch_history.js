/* global axios, axiosTokenInterceptor */
/* exported WatchHistoryApi */
class WatchHistoryApi {
  constructor () {
    this.apiAxios = axios.create({
      baseURL: 'https://api.watch-history.moshan.tv/v1',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.apiAxios.interceptors.request.use(axiosTokenInterceptor,
      function (error) {
        console.log(error);
        return Promise.reject(error);
      });
  }

  getWatchHistoryByCollection (collectionName) {
    return this.apiAxios.get(`/watch-history/collection/${collectionName}`);
  }

  removeWatchHistoryItem (qParams) {
    return this.apiAxios.delete(`/watch-history/collection/${qParams.collection}/${qParams.id}`);
  }

  addWatchHistoryItem (qParams) {
    const data = {
      id: qParams.id,
    };
    return this.apiAxios.post(`/watch-history/collection/${qParams.collection}`, data);
  }

  getWatchHistoryItem (qParams) {
    return this.apiAxios.get(`/watch-history/collection/${qParams.collection}/${qParams.id}`);
  }

  addWatchHistoryEpisode (qParams) {
    const data = {
      episode_id: qParams.episode_id,
    };
    return this.apiAxios.post(`/watch-history/collection/${qParams.collection}/${qParams.id}/episode`, data);
  }

  removeWatchHistoryEpisode (qParams) {
    return this.apiAxios.delete(`/watch-history/collection/${qParams.collection}/${qParams.id}/episode/${qParams.episode_id}`);
  }

  getWatchHistoryEpisode (qParams) {
    return this.apiAxios.get(`/watch-history/collection/${qParams.collection}/${qParams.id}/episode/${qParams.episode_id}`);
  }

  updateWatchHistoryEpisode (qParams, watchDates = []) {
    const data = {};
    data.dates_watched = watchDates;
    return this.apiAxios.patch(`/watch-history/collection/${qParams.collection}/${qParams.id}/episode/${qParams.episode_id}`, data);
  }
}

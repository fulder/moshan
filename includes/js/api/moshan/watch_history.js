/* global axios, axiosTokenInterceptor */
/* exported WatchHistoryApi */
class WatchHistoryApi {
  constructor () {
    this.apiAxios = axios.create({
      baseURL: 'https://api.watch-history.moshan.tv',
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
      api_id: qParams.api_id,
      api_name: qParams.api_name,
    };
    return this.apiAxios.post(`/watch-history/collection/${qParams.collection}`, data);
  }

  getWatchHistoryItem (qParams) {
    return this.apiAxios.get(`/watch-history/collection/${qParams.collection}/${qParams.id}`);
  }

  getWatchHistoryItemByApiId (qParams) {
    return this.apiAxios.get(`/watch-history/collection/${qParams.collection}?api_name=${qParams.api_name}&api_id=${qParams.api_id}`);
  }

  updateWatchHistoryItem (qParams, overview, review, status = '', rating = '', watchDates = []) {
    const data = {
      overview: overview,
      review: review,
      dates_watched: watchDates,
    };
    if (status !== '') {
      data.status = status;
    }
    if (rating !== '') {
      data.rating = rating;
    }
    return this.apiAxios.patch(`/watch-history/collection/${qParams.collection}/${qParams.id}`, data);
  }

  addWatchHistoryEpisode (qParams) {
    const data = {
      api_id: qParams.api_id,
      api_name: qParams.api_name,
    };
    return this.apiAxios.post(`/watch-history/collection/${qParams.collection}/${qParams.id}/episode`, data);
  }

  removeWatchHistoryEpisode (qParams) {
    return this.apiAxios.delete(`/watch-history/collection/${qParams.collection}/${qParams.id}/episode/${qParams.episode_id}`);
  }

  getWatchHistoryEpisode (qParams) {
    return this.apiAxios.get(`/watch-history/collection/${qParams.collection}/${qParams.id}/episode/${qParams.episode_id}`);
  }

  getWatchHistoryEpisodeByApiId (qParams) {
    return this.apiAxios.get(`/watch-history/collection/${qParams.collection}/${qParams.id}/episode?api_name=${qParams.api_name}&api_id=${qParams.api_id}`);
  }

  updateWatchHistoryEpisode (qParams, watchDates = []) {
    const data = {};
    data.dates_watched = watchDates;
    return this.apiAxios.patch(`/watch-history/collection/${qParams.collection}/${qParams.id}/episode/${qParams.episode_id}`, data);
  }
}

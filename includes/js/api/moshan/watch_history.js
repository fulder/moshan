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

  getWatchHistoryByCollection (collectionName, start=1, limit=12) {
    return this.apiAxios.get(`/watch-history/collection/${collectionName}?limit=${limit}&start=${start}&sort=latest_watch_date`);
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
    const data = {};
    if (watchDates.length !== 0 ) {
      data.dates_watched = watchDates;
    }
    if (overview !== '') {
      data.overview = overview;
    }
    if (review !== '') {
      data.review = review;
    }
    if (status !== '') {
      data.status = status;
    }
    if (rating !== '') {
      data.rating = rating;
    }
    return this.apiAxios.put(`/watch-history/collection/${qParams.collection}/${qParams.id}`, data);
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
    return this.apiAxios.put(`/watch-history/collection/${qParams.collection}/${qParams.id}/episode/${qParams.episode_id}`, data);
  }
}

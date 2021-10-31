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

  getWatchHistory (statusFilter = '') {
    let url = '/watch-history?sort=latest_watch_date';
    if (statusFilter !== '') {
      url += `&status=${statusFilter}`;
    }

    return this.apiAxios.get(url);
  }

  getWatchHistoryByCollection (collectionName, sort, showApi) {
    return this.apiAxios.get(`/watch-history/collection/${collectionName}?sort=${sort}&show_api=${showApi}`);
  }

  removeWatchHistoryItem (qParams) {
    if (qParams.collection == 'show') {
          return this.apiAxios.delete(`/watch-histories/item/${qParams.api_name}/${qParams.api_id}`);
    }
    return this.apiAxios.delete(`/watch-history/collection/${qParams.collection}/${qParams.id}`);
  }

  addWatchHistoryItem (qParams) {
    const data = {
      api_id: qParams.api_id,
      api_name: qParams.api_name,
    };
    if (qParams.collection == 'show') {
          return this.apiAxios.post('/watch-histories/item', data);
    }
    return this.apiAxios.post(`/watch-history/collection/${qParams.collection}`, data);
  }

  getWatchHistoryItem (qParams) {
    return this.apiAxios.get(`/watch-history/collection/${qParams.collection}/${qParams.id}`);
  }

  getWatchHistoryItemByApiId (qParams) {
    if (qParams.collection == 'show') {
          return this.apiAxios.get(`/watch-histories/item/${qParams.api_name}/${qParams.item_api_id}/episodes/${qParams.episode_api_id}`);
    }
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
    if (qParams.collection == 'show') {
          return this.apiAxios.put(`/watch-histories/item/${qParams.api_name}/${qParams.api_id}`);
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
    return this.apiAxios.delete(`/watch-history/collection/${qParams.collection}/${qParams.id}/episode/${qParams.episode_id}?api_name=${qParams.api_name}`);
  }

  getWatchHistoryEpisode (qParams) {
    return this.apiAxios.get(`/watch-history/collection/${qParams.collection}/${qParams.id}/episode/${qParams.episode_id}`);
  }

  getWatchHistoryEpisodeByApiId (qParams) {
    if (qParams.collection == 'show') {
          return this.apiAxios.get(`/watch-histories/episodes/${qParams.api_name}/${qParams.api_id}`);
    }
    return this.apiAxios.get(`/watch-history/collection/${qParams.collection}/${qParams.id}/episode?api_name=${qParams.api_name}&api_id=${qParams.api_id}`);
  }

  updateWatchHistoryEpisode (qParams, watchDates = []) {
    const data = {};
    data.dates_watched = watchDates;
    return this.apiAxios.put(`/watch-history/collection/${qParams.collection}/${qParams.id}/episode/${qParams.episode_id}`, data);
  }
}

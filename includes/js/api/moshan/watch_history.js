/* global axios, axiosTokenInterceptor */
/* exported WatchHistoryApi */
class WatchHistoryApi {
  constructor () {
    this.apiAxios = axios.create({
      baseURL: 'https://api.moshan.fulder.dev',
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

  // getWatchHistory (statusFilter = '') {
  //   let url = '/watch-history?sort=latest_watch_date';
  //   if (statusFilter !== '') {
  //     url += `&status=${statusFilter}`;
  //   }
  //
  //   return this.apiAxios.get(url);
  // }
  //
  // getWatchHistoryByCollection (collectionName, sort, showApi) {
  //   return this.apiAxios.get(`/watch-history/collection/${collectionName}?sort=${sort}&show_api=${showApi}`);
  // }

  removeWatchHistoryItem (qParams) {
    return this.apiAxios.delete(`/watch-histories/items/${qParams.api_name}/${qParams.api_id}`);
  }

  addWatchHistoryItem (qParams) {
    let data = {
      item_api_id: qParams.api_id,
      api_name: qParams.api_name,
    };
    return this.apiAxios.post('/watch-histories/items', data);
  }

  getWatchHistoryItemByApiId (qParams) {
    return this.apiAxios.get(`/watch-histories/items/${qParams.api_name}/${qParams.api_id}`);
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
    return this.apiAxios.put(`/watch-histories/items/${qParams.api_name}/${qParams.api_id}`, data);
  }

  addWatchHistoryEpisode (qParams) {
    const data = {
      episode_api_id: qParams.episode_api_id,
    };
    return this.apiAxios.post(`/watch-histories/items/${qParams.api_name}/${qParams.item_api_id}/episodes`, data);
  }

  removeWatchHistoryEpisode (qParams) {
    return this.apiAxios.delete(`/watch-histories/items/${qParams.api_name}/${qParams.item_api_id}/episodes/${qParams.episode_api_id}`);
  }

  getWatchHistoryEpisodeByApiId (qParams) {
    return this.apiAxios.get(`/watch-histories/items/${qParams.api_name}/${qParams.item_api_id}/episodes/${qParams.episode_api_id}`);
  }

  updateWatchHistoryEpisode (qParams, watchDates = []) {
    const data = {};
    data.dates_watched = watchDates;
    return this.apiAxios.put(`/watch-histories/items/${qParams.api_name}/${qParams.item_api_id}/episodes/${qParams.episode_api_id}`, data);
  }
}

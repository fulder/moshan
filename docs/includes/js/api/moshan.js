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

  getWatchHistory (sort = '', cursor = '') {
    let url = '/items';
    if (sort !== '' || cursor !== '') {
      url += '?';
    }

    if (sort !== '') {
      url += `sort=${sort}`;
    }
    if (cursor !== '') {
      url += `&cursor=${cursor}`;
    }

    return this.apiAxios.get(url);
  }

  // getWatchHistoryByCollection (collectionName, sort, showApi) {
  //   return this.apiAxios.get(`/watch-history/collection/${collectionName}?sort=${sort}&show_api=${showApi}`);
  // }

  removeWatchHistoryItem (qParams) {
    return this.apiAxios.delete(`/items/${qParams.api_name}/${qParams.api_id}`);
  }

  addWatchHistoryItem (qParams) {
    let data = {
      itemApiId: qParams.api_id,
      apiName: qParams.api_name,
    };
    return this.apiAxios.post('/items', data);
  }

  getWatchHistoryItemByApiId (qParams) {
    return this.apiAxios.get(`/items/${qParams.api_name}/${qParams.api_id}`);
  }

  updateWatchHistoryItem (qParams, overview, review, status = '', rating = '', watchDates = []) {
    const data = {};
    if (watchDates.length !== 0 ) {
      data.datesWatched = watchDates;
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
    return this.apiAxios.put(`/items/${qParams.api_name}/${qParams.api_id}`, data);
  }

  addWatchHistoryEpisode (qParams) {
    const data = {
      episodeApiId: qParams.episode_api_id,
    };
    return this.apiAxios.post(`/items/${qParams.api_name}/${qParams.item_api_id}/episodes`, data);
  }

  removeWatchHistoryEpisode (qParams) {
    return this.apiAxios.delete(`/items/${qParams.api_name}/${qParams.item_api_id}/episodes/${qParams.episode_api_id}`);
  }

  getWatchHistoryEpisodeByApiId (qParams) {
    return this.apiAxios.get(`/items/${qParams.api_name}/${qParams.item_api_id}/episodes/${qParams.episode_api_id}`);
  }

  getWatchHistoryEpisodes (qParams) {
    return this.apiAxios.get(`/items/${qParams.api_name}/${qParams.item_api_id}/episodes`);
  }

  updateWatchHistoryEpisode (qParams, watchDates = []) {
    const data = {};
    data.datesWatched = watchDates;
    return this.apiAxios.put(`/items/${qParams.api_name}/${qParams.item_api_id}/episodes/${qParams.episode_api_id}`, data);
  }
}

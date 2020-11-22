/* global axios, axiosTokenInterceptor */
/* exported WatchHistoryApi */
class WatchHistoryApi {
  constructor () {
    this.apiAxios = axios.create({
      baseURL: 'https://api.watch-history.moshan.tv/v1',
      headers: {
        'Content-Type': 'application/json'
      }
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

  removeWatchHistoryItem (collectionName, id) {
    return this.apiAxios.delete(`/watch-history/collection/${collectionName}/${id}`);
  }

  addWatchHistoryItem (collectionName, id) {
    const data = {
      item_add_id: id
    };
    return this.apiAxios.post(`/watch-history/collection/${collectionName}`, data);
  }

  getWatchHistoryItem (collectionName, id) {
    return this.apiAxios.get(`/watch-history/collection/${collectionName}/${id}`);
  }

  addWatchHistoryEpisode (collectionName, itemId, episodeId, episodeNumber) {
    const data = {
      episode_id: episodeId,
      episode_number: episodeNumber
    };
    return this.apiAxios.post(`/watch-history/collection/${collectionName}/${itemId}/episode`, data);
  }

  removeWatchHistoryEpisode (collectionName, itemId, episodeId) {
    return this.apiAxios.delete(`/watch-history/collection/${collectionName}/${itemId}/episode/${episodeId}`);
  }

  getWatchHistoryEpisode (collectionName, itemId, episodeId) {
    const options = {
      validateStatus: function (status) {
        if (status >= 200 && status < 300) {
          return true;
        } else if (status === 404) {
          return true;
        }
        return false;
      }
    };

    return this.apiAxios.get(`/watch-history/collection/${collectionName}/${itemId}/episode/${episodeId}`, options);
  }

  updateWatchHistoryEpisode (collectionName, itemId, episodeId, watchDates = []) {
    const data = {};
    if (watchDates.length > 0) {
      data.dates_watched = watchDates;
    }
    return this.apiAxios.patch(`/watch-history/collection/${collectionName}/${itemId}/episode/${episodeId}`, data);
  }
}

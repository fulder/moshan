import {axiosTokenInterceptor, MoshanItem, MoshanEpisode, Review} from './common.js';

export class MoshanApi {
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

  getItems (sort = '', cursor = '') {
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

  removeItem (qParams) {
    return this.apiAxios.delete(`/items/${qParams.api_name}/${qParams.api_id}`);
  }

  addItem (qParams) {
    let data = {
      itemApiId: qParams.api_id,
      apiName: qParams.api_name,
    };
    return this.apiAxios.post('/items', data);
  }

  async getItem (qParams) {
    const ret = await this.apiAxios.get(`/items/${qParams.api_name}/${qParams.api_id}`);

    const review = new Review(
        ret.data.overview,
        ret.data.review,
        ret.data.rating,
        ret.data.datesWatched,
        ret.data.createdAt,
        ret.data.updatedAt,
        ret.data.status
    );

    let poster = ret.data.apiCache.imageUrl;
    if (!ret.data.apiCache.imageUrl.includes('http')) {
      poster = `https://image.tmdb.org/t/p/w500/${ret.data.apiCache.imageUrl}`;
    }

    console.log(ret.data);

    return new MoshanItem(
      ret.data.apiId,
      poster,
      ret.data.apiCache.title,
      ret.data.apiCache.releaseDate,
      ret.data.apiCache.status,
      '',
      'epCount' in ret.data.apiCache,
      'moshan',
      review
    );
  }

  updateItem (qParams, overview, review, status = '', rating = '', watchDates = []) {
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

  addEpisode (qParams) {
    const data = {
      episodeApiId: qParams.episode_api_id,
    };
    return this.apiAxios.post(`/items/${qParams.api_name}/${qParams.item_api_id}/episodes`, data);
  }

  removeEpisode (qParams) {
    return this.apiAxios.delete(`/items/${qParams.api_name}/${qParams.item_api_id}/episodes/${qParams.episode_api_id}`);
  }

  async getEpisode (qParams) {
    const ret = await this.apiAxios.get(`/items/${qParams.api_name}/${qParams.api_id}/episodes/${qParams.episode_api_id}`);

    const review = new Review(
        ret.data.overview,
        ret.data.review,
        ret.data.rating,
        ret.data.datesWatched,
        ret.data.createdAt,
        ret.data.updatedAt,
        ret.data.status
    );

    const ep = new MoshanEpisode(
      ret.data.apiId,
      "moshan",
      ret.data.episodeApiId,
    );
    ep.review = review;
    return ep;
  }

  getEpisodes (qParams) {
    return this.apiAxios.get(`/items/${qParams.api_name}/${qParams.item_api_id}/episodes`);
  }

  updateEpisode (qParams, overview, review, status = '', rating = '', watchDates = []) {
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
    console.debug(this)
    return this.apiAxios.put(`/items/${qParams.api_name}/${qParams.item_api_id}/episodes/${qParams.episode_api_id}`, data);
  }
}

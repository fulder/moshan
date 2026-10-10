import {authHeaders, MoshanItem, MoshanEpisode, Review} from './common.js';
import {request} from '../common/http.js';

const BASE_URL = 'https://api.moshan.fulder.dev';

function toReview(data) {
  return new Review(
    data.overview,
    data.review,
    data.rating,
    data.datesWatched,
    data.createdAt,
    data.updatedAt,
    data.status
  );
}

function reviewData(overview, review, status, rating, watchDates) {
  const data = {};
  if (watchDates.length !== 0) {
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
  return data;
}

export class MoshanApi {
  async request (method, path, data) {
    return request(`${BASE_URL}${path}`, {
      method,
      headers: await authHeaders(),
      body: data === undefined ? undefined : JSON.stringify(data),
    });
  }

  getItems (sort = '', cursor = '', filter = '') {
    const params = new URLSearchParams();
    if (sort !== '') {
      params.set('sort', sort);
    }
    if (cursor !== '') {
      params.set('cursor', cursor);
    }
    if (filter !== '') {
      params.set('filter', filter);
    }
    const query = params.toString();
    return this.request('GET', query ? `/items?${query}` : '/items');
  }

  removeItem (qParams) {
    return this.request('DELETE', `/items/${qParams.api_name}/${qParams.api_id}`);
  }

  addItem (qParams) {
    return this.request('POST', '/items', {
      itemApiId: qParams.api_id,
      apiName: qParams.api_name,
    });
  }

  async getItem (qParams) {
    const data = await this.request('GET', `/items/${qParams.api_name}/${qParams.api_id}`);

    let poster = data.apiCache.imageUrl;
    if (poster && !poster.includes('http')) {
      poster = `https://image.tmdb.org/t/p/w500/${poster}`;
    }

    return new MoshanItem(
      data.apiId,
      poster,
      data.apiCache.title,
      data.apiCache.releaseDate,
      data.apiCache.status,
      '',
      'epCount' in data.apiCache && data.apiCache.epCount != 0,
      'moshan',
      toReview(data)
    );
  }

  updateItem (qParams, overview, review, status = '', rating = '', watchDates = []) {
    return this.request('PUT', `/items/${qParams.api_name}/${qParams.api_id}`,
      reviewData(overview, review, status, rating, watchDates));
  }

  addEpisode (qParams) {
    return this.request('POST', `/items/${qParams.api_name}/${qParams.item_api_id}/episodes`, {
      episodeApiId: qParams.episode_api_id,
    });
  }

  removeEpisode (qParams) {
    return this.request('DELETE', `/items/${qParams.api_name}/${qParams.item_api_id}/episodes/${qParams.episode_api_id}`);
  }

  async getEpisode (qParams) {
    const data = await this.request('GET', `/items/${qParams.api_name}/${qParams.api_id}/episodes/${qParams.episode_api_id}`);

    const ep = new MoshanEpisode(data.apiId, 'moshan', data.episodeApiId);
    ep.review = toReview(data);
    return ep;
  }

  getEpisodes (qParams) {
    return this.request('GET', `/items/${qParams.api_name}/${qParams.item_api_id}/episodes`);
  }

  updateEpisode (qParams, overview, review, status = '', rating = '', watchDates = []) {
    return this.request('PUT', `/items/${qParams.api_name}/${qParams.item_api_id}/episodes/${qParams.episode_api_id}`,
      reviewData(overview, review, status, rating, watchDates));
  }
}

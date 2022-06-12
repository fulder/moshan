import {MalApi} from './mal.js'
import {TmdbApi} from './tmdb.js'
import {TvMazeApi} from './tvmaze.js'
import {checkToken, accessToken} from '../common/token.js'

let checkTokenPromise = null;

/* exported collectionNames */
const collectionNames = ['movie', 'show', 'anime'];

/* exported axiosTokenInterceptor */
export async function axiosTokenInterceptor (config) {
  if (checkTokenPromise === null) {
    checkTokenPromise = checkToken();
  }

  await checkTokenPromise;
  checkTokenPromise = null;
  config.headers.Authorization = accessToken;
  return config;
}

export function MoshanItems(collection_name) {
  this.collection_name = collection_name;
  this.items = [];
}

export function MoshanItem(id, poster, title, releaseDate, status, synopsis, hasEpisodes, apiName, review={}) {
  this.id = id;
  this.imageUrl = poster;
  this.title = title;
  this.releaseDate = releaseDate;
  this.status = status;
  //this.synopsis = synopsis;
  this.hasEpisodes = hasEpisodes;
  this.apiName = apiName;
  this.review = review;
}

export function Review(overview, review, rating, datesWatched, createdAt, updatedAt, status) {
    this.overview = overview;
    this.review = review;
    this.rating = rating;
    this.datesWatched = datesWatched;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.status = status;
}

export function MoshanEpisodes(episodes, total_pages) {
  this.episodes = episodes;
  this.total_pages = total_pages;
}

export function MoshanEpisode(id, number, title, air_date, previous_id, next_id, extra_ep=false) {
  this.id = id;
  this.number = number;
  this.title = title;
  this.air_date = air_date;
  this.aired = Date.parse(this.air_date) <= (new Date()).getTime();
  this.status = this.aired ? 'Aired' : 'Not Aired';
  this.previous_id = previous_id;
  this.next_id = next_id;
  this.extra_ep = extra_ep;
}

export function getApiByName(name) {
  switch(name) {
    case 'mal':
      return new MalApi();
    case 'tvmaze':
      return new TvMazeApi();
    case 'tmdb':
      return new TmdbApi();
  }
}

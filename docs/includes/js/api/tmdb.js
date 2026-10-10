import {MoshanItems, MoshanItem} from './common.js';
import {request} from '../common/http.js';

const BASE_URL = 'https://api.themoviedb.org/3';
const HEADERS = {
  'Authorization': 'Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJjM2Q1MGM4ZWJiYWQ3MTdhYTA4OWFlNjQ2ZWZkMDAwMiIsInN1YiI6IjYwMDBhZDY3NDIwMjI4MDAzZWU5MWExZSIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.QpoM4q7TZMkkMmN58-XcmNAygfOZOFNsvPFe-L88cVo',
};

export class TmdbApi {
  async search (qParams) {
    const res = await request(`${BASE_URL}/search/movie?query=${encodeURIComponent(qParams.search)}`, {headers: HEADERS});

    const moshanItems = new MoshanItems('movie');
    for (let i=0; i<res.results.length; i++) {
      const moshanItem = this.getMoshanItem(res.results[i]);
      moshanItems.items.push(moshanItem);
    }
    return moshanItems;
  }

  async getItemById(qParams) {
    const res = await request(`${BASE_URL}/movie/${qParams.api_id}?append_to_response=images`, {headers: HEADERS});
    return this.getMoshanItem(res);
  }

  getMoshanItem(movie) {
    let poster = '/includes/img/image_not_available.png';
    if (movie.poster_path !== null) {
      poster = `https://image.tmdb.org/t/p/w500/${movie.poster_path}`;
    }

    return new MoshanItem(
      movie.id,
      poster,
      movie.title,
      movie.release_date,
      movie.status,
      movie.overview,
      false,
      'tmdb'
    );
  }
}

import {MoshanItems, MoshanItem} from './common.js';

export class TmdbApi {
  constructor () {
    this.apiAxios = axios.create({
      baseURL: 'https://api.themoviedb.org/3',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJjM2Q1MGM4ZWJiYWQ3MTdhYTA4OWFlNjQ2ZWZkMDAwMiIsInN1YiI6IjYwMDBhZDY3NDIwMjI4MDAzZWU5MWExZSIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.QpoM4q7TZMkkMmN58-XcmNAygfOZOFNsvPFe-L88cVo',
      },
    });
  }

  async search (qParams) {
    const res = await this.apiAxios.get(`/search/movie?query=${qParams.search}`);

    const moshanItems = new MoshanItems('movie');
    for (let i=0; i<res.data.results.length; i++) {
      const moshanItem = this.getMoshanItem(res.data.results[i]);
      moshanItems.items.push(moshanItem);
    }
    return moshanItems;
  }

  async getItemById(qParams) {
    const res = await this.apiAxios.get(`/movie/${qParams.api_id}?append_to_response=images`);
    return this.getMoshanItem(res.data);
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

/* global axios */
/* exported TvMazeApi */
class TvMazeApi {
  constructor () {
    this.apiAxios = axios.create({
      baseURL: 'https://api.tvmaze.com',
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  search (searchString) {
    return this.apiAxios.get(`/search/shows?q=${searchString}`);
  }

  getItemById(id) {
    return this.apiAxios.get(`/shows/${id}`);
  }

  getEpisodes(id) {
    return this.apiAxios.get(`/shows/${id}/episodes`);
  }

  getMoshanItem(show) {
    console.debug(show);

    return new MoshanItem(
      show.image.original,
      show.name,
      show.premiered,
      show.status,
      show.summary,
      true
    );
  }

  getMoshanEpisodes(episodes) {
    return new MoshanEpisodes(
        episodes.reversed(),
        1
    );
  }

  getMoshanEpisode(episode) {
    const seasonNbr = (episode.season < 10 ? '0' : '') + episode.season;
    const episodeNbr = (episode.number < 10 ? '0' : '') + episode.number;

    const episodeId = `S${seasonNbr}E${episodeNbr}`;

    return new MoshanEpisode(
      episodeId,
      episode.number,
      episode.name,
      episode.airdate
    );
  }
}

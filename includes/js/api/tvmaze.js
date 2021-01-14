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

  async search (qParams) {
    res = await this.apiAxios.get(`/search/shows?q=${qParams.search}`);

    const moshanItems = [];
    for (let i=0; i<res.length; i++) {
      moshanItems.push(this.getMoshanItem(res[i]));
    }
    return moshanItems;
  }

  getItemById(qParams) {
    return this.apiAxios.get(`/shows/${qParams.api_id}`);
  }

  getEpisodes(qParams) {
    return this.apiAxios.get(`/shows/${qParams.api_id}/episodes`);
  }

  getEpisode(qParams) {
    return this.apiAxios.get(`/episodes/${qParams.episode_id}`);
  }

  getMoshanItem(show) {
    console.debug(show);

    return new MoshanItem(
      show.id,
      show.image.medium,
      show.name,
      show.premiered,
      show.status,
      show.summary,
      true,
      'show'
    );
  }

  getMoshanEpisodes(episodes) {
    return new MoshanEpisodes(
        episodes.reverse(),
        1
    );
  }

  getMoshanEpisode(episode) {
    const seasonNbr = (episode.season < 10 ? '0' : '') + episode.season;
    const episodeNbr = (episode.number < 10 ? '0' : '') + episode.number;

    const episodeId = `S${seasonNbr}E${episodeNbr}`;

    return new MoshanEpisode(
      episode.id,
      episodeId,
      episode.name,
      episode.airdate
    );
  }
}

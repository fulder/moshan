/* global axios, MoshanItem */
/* exported MalApi */
class MalApi {
  constructor () {
    this.apiAxios = axios.create({
      baseURL: 'https://api.jikan.moe/v3/',
    });
  }

  async search(qParams) {
    const res = await this.apiAxios.get(`/search/anime?q=${qParams.search}`);

    const moshanItems = new MoshanItems('anime');
    for (let i=0; i<res.data.results.length; i++) {
      const moshanItem = this.getMoshanItem(res.data.results[i]);
      moshanItems.items.push(moshanItem);
    }
    return moshanItems;
  }

  async getItemById(qParams) {
    const res = await this.apiAxios.get(`/anime/${qParams.api_id}`);
    return this.getMoshanItem(res.data);
  }

  getMoshanItem(anime) {
    console.debug(anime);
    let status = 'Airing';
    if ('to' in anime.aired && anime.aired.to !== null) {
      status = 'Finished';
    }

    const hasEpisodes = anime.type == 'TV';

    let poster = '/includes/img/image_not_available.png';
    if (anime.image_url !== undefined) {
      poster = anime.image_url;
    }

    return new MoshanItem(
      anime.mal_id,
      poster,
      anime.title,
      anime.aired.from,
      status,
      anime.synopsis,
      hasEpisodes,
      'anime'
    );
  }

  async getEpisodes(qParams) {
    let page = 1;
    let res = await this.apiAxios.get(`/anime/${qParams.api_id}/episodes`);
    let eps = res.data.episodes;

    while (page < res.data.episodes_last_page) {
      page++;
      res = await this.apiAxios.get(`/anime/${qParams.api_id}/episodes/${page}`);
      eps = eps.concat(res.data.episodes);
    }
    return this.getMoshanEpisodes(eps);
  }

  async getEpisode(qParams) {
    episodes = await this.getEpisodes(qParams);
    for (let i=0; i < episodes.length; i++) {
      const ep = episodes[i];
      if (ep.episode_id == qParams.episode_api_id) {
        return this.getMoshanEpisode(ep);
      }
    }
  }

  getMoshanEpisodes(episodes) {
    return new MoshanEpisodes(
        episodes.reverse(),
        1
    );
  }

  getMoshanEpisode(episode) {
    return new MoshanEpisode(
      episode.episode_id,
      episode.episode_id,
      episode.title,
      episode.aired,
      episode.episode_id - 1,
      episode.episode_id + 1
    );
  }
}

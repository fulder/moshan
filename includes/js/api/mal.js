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
    if ('end_date' in anime && anime.end_date !== null) {
      status = 'Finished';
    }

    const hasEpisodes = 'num_episodes' in anime && anime.num_episodes != 1;

    let poster = '/includes/img/image_not_available.png';
    if (anime.main_picture !== undefined && anime.main_picture.medium !== undefined) {
      poster = anime.main_picture.medium;
    }

    return new MoshanItem(
      anime.id,
      poster,
      anime.title,
      anime.start_date,
      status,
      anime.synopsis,
      hasEpisodes,
      'anime'
    );
  }

  async getEpisodes(qParams) {
    const page = 1;
    let res = await this.apiAxios.get(`/anime/${qParams.api_id}/episodes`);
    let eps = res.data.episodes;

    while (page < res.data.episodes_last_page) {
      page++;
      res = await this.apiAxios.get(`/anime/${qParams.api_id}/episodes/${page}`);
      eps.concat(res.data.episodes);
    }
    return eps;
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

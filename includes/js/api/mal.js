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
    if ('aired' in anime && 'to' in anime.aired && anime.aired.to !== null) {
      status = 'Finished';
    } else if ('airing' in anime && !anime.airing) {
      status = 'Finished';
    }

    const hasEpisodes = anime.type == 'TV';

    let poster = '/includes/img/image_not_available.png';
    if (anime.image_url !== undefined) {
      poster = anime.image_url;
    }

    let date = 'N/A';
    if ('aired' in anime && anime.aired.from !== null) {
      date = new Date(anime.aired.from).toISOString().split('T')[0];
    } else if ('start_date' in anime && anime.start_date !== null){
      date = new Date(anime.start_date).toISOString().split('T')[0];
    }

    return new MoshanItem(
      anime.mal_id,
      poster,
      anime.title,
      date,
      status,
      anime.synopsis,
      hasEpisodes,
      'anime'
    );
  }

  async getEpisodes(qParams) {
    const resFirst = await this.apiAxios.get(`/anime/${qParams.api_id}/episodes/1`);
    const realPage = resFirst.data.episodes_last_page - qParams.episode_page + 1;

    let res = await this.apiAxios.get(`/anime/${qParams.api_id}/episodes/${realPage}`);
    if (realPage == resFirst.data.episodes_last_page) {

      res.data.episodes.push(
        {
        episode_id: res.data.episodes[res.data.episodes.length - 1] + 1,
        title: 'N/A',
        aired: null,
        }
      );
    }

    return this.getMoshanEpisodes(res.data);
  }

  async getEpisode(qParams) {
    qParams.api_id = qParams.item_api_id;
    const page = parseInt(qParams.episode_api_id/100) + 1;
    const episodes = await this.apiAxios.get(`/anime/${qParams.api_id}/episodes/${page}`);

    for (let i=0; i < episodes.data.episodes.length; i++) {
      const ep = episodes.data.episodes[i];
      if (ep.episode_id == qParams.episode_api_id) {
        return this.getMoshanEpisode(ep);
      }
    }
  }

  getMoshanEpisodes(data) {
    return new MoshanEpisodes(
        data.episodes.reverse(),
        data.episodes_last_page
    );
  }

  getMoshanEpisode(episode) {
    let date = 'N/A';
    if (episode.aired !== null) {
      console.debug(episode.aired);
      date = new Date(episode.aired).toISOString().split('T')[0];
    }

    return new MoshanEpisode(
      episode.episode_id,
      episode.episode_id,
      episode.title,
      date,
      episode.episode_id - 1,
      episode.episode_id + 1
    );
  }
}

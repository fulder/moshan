/* global axios, MoshanItem */
/* exported MalApi */
class MalApi {
  constructor () {
    this.apiAxios = axios.create({
      baseURL: 'https://api.jikan.moe/v4/',
    });
  }

  async search(qParams) {
    const res = await this.apiAxios.get(`/search/anime?q=${qParams.search}`);

    const moshanItems = new MoshanItems('anime');
    for (let i=0; i<res.data.data.length; i++) {
      const moshanItem = this.getMoshanItem(res.data.data[i]);
      moshanItems.items.push(moshanItem);
    }
    return moshanItems;
  }

  async getItemById(qParams) {
    const res = await this.apiAxios.get(`/anime/${qParams.api_id}`);
    return this.getMoshanItem(res.data.data);
  }

  getMoshanItem(anime) {
    let status = 'Airing';
    if ('aired' in anime && 'to' in anime.aired && anime.aired.to !== null && new Date(anime.aired.to) < new Date()) {
      status = 'Finished';
    } else if ('status' in anime && anime.status == 'Finished Airing') {
      status = 'Finished';
    }

    const hasEpisodes = anime.type != 'Movie';

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
      'mal'
    );
  }

  async getEpisodes(qParams) {
    const resFirst = await this.apiAxios.get(`/anime/${qParams.api_id}/episodes?page=1`);
    const realPage = resFirst.data.pagination.last_visible_page - qParams.episode_page + 1;

    let res = await this.apiAxios.get(`/anime/${qParams.api_id}/episodes?page=${realPage}`);
    return this.getMoshanEpisodes(res.data.data);
  }

  async getEpisode(qParams) {
    const episode = await this.apiAxios.get(`/anime/${qParams.item_api_id}/episodes/${qParams.episode_api_id}`);
    return this.getMoshanEpisode(episode.data.data);
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
      date = new Date(episode.aired).toISOString().split('T')[0];
    }

    return new MoshanEpisode(
      episode.mal_id,
      episode.mal_id,
      episode.title,
      date,
      episode.mal_id - 1,
      episode.mal_id + 1,
      'extra_ep' in episode
    );
  }
}

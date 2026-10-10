import {MoshanItems, MoshanItem, MoshanEpisodes, MoshanEpisode} from './common.js';
import {request} from '../common/http.js';

const BASE_URL = 'https://api.tenrai.org/v1';

export class MalApi {
  async search(qParams) {
    const res = await request(`${BASE_URL}/anime?q=${encodeURIComponent(qParams.search)}`);

    const moshanItems = new MoshanItems('anime');
    for (let i=0; i<res.data.length; i++) {
      const moshanItem = this.getMoshanItem(res.data[i]);
      moshanItems.items.push(moshanItem);
    }
    return moshanItems;
  }

  async getItemById(qParams) {
    const res = await request(`${BASE_URL}/anime/${qParams.api_id}`);
    return this.getMoshanItem(res.data);
  }

  getMoshanItem(anime) {
    let status = 'Airing';
    if (anime.aired?.to !== undefined && new Date(anime.aired.to) < new Date()) {
      status = 'Finished';
    } else if ('status' in anime && anime.status == 'Finished Airing') {
      status = 'Finished';
    }

    const hasEpisodes = anime.type != 'Movie';

    let poster = '/includes/img/image_not_available.png';
    if (anime.images?.jpg?.image_url !== undefined) {
      poster = anime.images.jpg.image_url;
    }

    let date = 'N/A';
    if (anime.aired?.from !== null) {
      date = new Date(anime.aired.from).toISOString().split('T')[0];
    } else if (anime.start_date !== undefined){
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
    const resFirst = await request(`${BASE_URL}/anime/${qParams.api_id}/episodes?page=1`);
    const realPage = resFirst.pagination.last_visible_page - qParams.episode_page + 1;

    const res = await request(`${BASE_URL}/anime/${qParams.api_id}/episodes?page=${realPage}`);
    return this.getMoshanEpisodes(res.data, resFirst.pagination.last_visible_page);
  }

  async getEpisode(qParams) {
    const url = `${BASE_URL}/anime/${qParams.item_api_id}/episodes`;
    const nextNumber = parseInt(qParams.episode_api_id) + 1;
    const [episode, hasNext] = await Promise.all([
      request(`${url}/${qParams.episode_api_id}`),
      request(`${url}/${nextNumber}`).then(() => true, () => false),
    ]);
    const moshanEpisode = this.getMoshanEpisode(episode.data);
    if (!hasNext) {
      moshanEpisode.nextId = null;
    }
    return moshanEpisode;
  }

  getMoshanEpisodes(episodes, last_page) {
    return new MoshanEpisodes(
        episodes.reverse(),
        last_page
    );
  }

  getMoshanEpisode(episode) {
    let date = 'N/A';
    if (episode.aired !== null) {
      date = new Date(episode.aired).toISOString().split('T')[0];
    }

    const moshanEpisode = new MoshanEpisode(
      episode.mal_id,
      'mal',
      episode.mal_id,
      episode.title,
      date,
      episode.images?.jpg?.image_url ?? '/includes/img/image_not_available.png',
      episode.mal_id > 1 ? episode.mal_id - 1 : null,
      episode.mal_id + 1,
      {},
      'extra_ep' in episode
    );
    moshanEpisode.synopsis = episode.synopsis;
    return moshanEpisode;
  }
}

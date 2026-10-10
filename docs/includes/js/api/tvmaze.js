import {MoshanItems, MoshanItem, MoshanEpisodes, MoshanEpisode} from './common.js';
import {request} from '../common/http.js';

const BASE_URL = 'https://api.tvmaze.com';

export class TvMazeApi {
  async search (qParams) {
    const res = await request(`${BASE_URL}/search/shows?q=${encodeURIComponent(qParams.search)}`);

    const moshanItems = new MoshanItems('show');
    for (let i=0; i<res.length; i++) {
      moshanItems.items.push(this.getMoshanItem(res[i].show));
    }
    return moshanItems;
  }

  async getItemById(qParams) {
    const res = await request(`${BASE_URL}/shows/${qParams.api_id}`);
    return this.getMoshanItem(res);
  }

  async getEpisodes(qParams) {
    const ret = await request(`${BASE_URL}/shows/${qParams.api_id}/episodes?specials=1`);
    return this.getMoshanEpisodes(ret);
  }

  async getEpisode(qParams) {
    const [ret, episodes] = await Promise.all([
      request(`${BASE_URL}/episodes/${qParams.episode_api_id}`),
      request(`${BASE_URL}/shows/${qParams.item_api_id}/episodes?specials=1`),
    ]);
    const episode = this.getMoshanEpisode(ret);
    const index = episodes.findIndex(e => e.id === ret.id);
    episode.previousId = episodes[index - 1]?.id ?? null;
    episode.nextId = index >= 0 ? episodes[index + 1]?.id ?? null : null;
    return episode;
  }

  getMoshanItem(show) {
    let poster = '/includes/img/image_not_available.png';
    if (show.image !== null && show.image !== undefined && show.image.medium !== undefined) {
      poster = show.image.medium;
    }

    let id = show.id;
    if (show.tvmaze_id !== undefined) {
      id = show.tvmaze_id;
    }

    return new MoshanItem(
      id,
      poster,
      show.name,
      show.premiered,
      show.status,
      show.summary,
      true,
      'tvmaze'
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

    const episodeId = episode.number === null ? `S${seasonNbr} Special` : `S${seasonNbr}E${episodeNbr}`;

    let poster = '/includes/img/image_not_available.png';
    if (episode.image !== null && episode.image !== undefined && episode.image.medium !== undefined) {
      poster = episode.image.medium;
    }

    return new MoshanEpisode(
      episode.id,
      'tvmaze',
      episodeId,
      episode.name,
      episode.airdate,
      poster
    );
  }
}

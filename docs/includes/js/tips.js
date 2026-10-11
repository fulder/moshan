import {createNavbar} from './common/navbar.js';
import {MoshanApi} from './api/moshan.js';
import {isLoggedIn} from './common/auth.js';
import {request} from './common/http.js';
import {tmdbRequest} from './api/tmdb.js';
import {tenrai} from './common/tenrai.js';
import {posterCard} from './common/posters.js';

createNavbar();

const moshanApi = new MoshanApi();
const SEEDS = 15; // top rated items per collection asked for recommendations
const SHOWN = 18;
const TMDB_IMAGE = 'https://image.tmdb.org/t/p/w342';

async function allItems() {
  const items = [];
  let cursor = '';
  do {
    const res = await moshanApi.getItems('', cursor);
    items.push(...res.items);
    cursor = res.endCursor;
  } while (cursor);
  return items;
}

// Each source returns {self, recs: [{key, title, image, href, strength 0..1}]}
// for one seed; self is the seed's own key when it differs from its apiId.
const SOURCES = {
  tmdb: async item => {
    const res = await tmdbRequest(`/movie/${item.apiId}/recommendations`);
    return {recs: res.results.map((m, i, all) => ({
      key: String(m.id),
      title: m.title,
      image: m.poster_path && `${TMDB_IMAGE}${m.poster_path}`,
      href: `review.html?api_name=tmdb&api_id=${m.id}`,
      strength: 1 - i / all.length,
    }))};
  },
  mal: async item => {
    const res = await tenrai(`${item.apiId}/recommendations`);
    const recs = res.data.slice(0, 20);
    const maxVotes = Math.max(1, ...recs.map(r => r.votes));
    return {recs: recs.map(r => ({
      key: String(r.entry.mal_id),
      title: r.entry.title,
      image: r.entry.images?.jpg?.image_url,
      href: `review.html?api_name=mal&api_id=${r.entry.mal_id}`,
      strength: r.votes / maxVotes,
    }))};
  },
  // TVMaze has no recommendations: go via TMDB TV, matched on TheTVDB id
  tvmaze: async item => {
    const show = await request(`https://api.tvmaze.com/shows/${item.apiId}`);
    const {thetvdb, imdb} = show.externals;
    const found = thetvdb
      ? await tmdbRequest(`/find/${thetvdb}?external_source=tvdb_id`)
      : imdb && await tmdbRequest(`/find/${imdb}?external_source=imdb_id`);
    const tmdbShow = found?.tv_results?.[0];
    if (!tmdbShow) {
      return {recs: []};
    }
    const res = await tmdbRequest(`/tv/${tmdbShow.id}/recommendations`);
    return {
      self: String(tmdbShow.id),
      recs: res.results.map((s, i, all) => ({
        key: String(s.id),
        title: s.name,
        image: s.poster_path && `${TMDB_IMAGE}${s.poster_path}`,
        tmdbTv: s.id,
        strength: 1 - i / all.length,
      })),
    };
  },
};

// TMDB TV picks link to the TVMaze show when it can be found, else to search
async function openTmdbShow(rec) {
  try {
    const ids = await tmdbRequest(`/tv/${rec.tmdbTv}/external_ids`);
    const param = ids.tvdb_id ? `thetvdb=${ids.tvdb_id}` : `imdb=${ids.imdb_id}`;
    const show = await request(`https://api.tvmaze.com/lookup/shows?${param}`);
    rememberReason(rec, 'tvmaze', show.id);
    window.location.href = `review.html?api_name=tvmaze&api_id=${show.id}`;
  } catch {
    window.location.href = `results.html?search=${encodeURIComponent(rec.title)}`;
  }
}

// The review page shows which of your titles led to the tip
function rememberReason(rec, apiName, apiId) {
  try {
    sessionStorage.setItem('moshan_tip', JSON.stringify({apiName, apiId: String(apiId), because: rec.because}));
  } catch {
    // reason just isn't shown
  }
}

function tipCard(rec) {
  const card = posterCard({href: rec.href ?? '#', image: rec.image, title: rec.title});
  card.title = `Because you liked ${rec.because.map(b => b.title).join(', ')}`;
  if (rec.href) {
    card.addEventListener('click', () => rememberReason(rec, rec.apiName, rec.key));
  } else if (rec.tmdbTv) {
    card.addEventListener('click', event => {
      event.preventDefault();
      card.setAttribute('aria-busy', 'true');
      openTmdbShow(rec);
    });
  }
  return card;
}

// Ratings 7..10 weigh 1..4; picks score the sum over all seeds that suggest them
async function collectionTips(apiName, items) {
  const list = document.getElementById(`tips-${apiName}`);
  // Show tips are keyed by TMDB id, so listed shows match on title and seed ids
  const listed = new Set(apiName === 'tvmaze' ? [] : items.filter(i => i.apiName === apiName).map(i => i.apiId));
  const listedTitles = new Set(items.filter(i => i.apiName === apiName).map(i => i.apiCache.title?.toLowerCase()));
  const seeds = items
    .filter(i => i.apiName === apiName && i.rating >= 7)
    .sort((a, b) => b.rating - a.rating)
    .slice(0, SEEDS);

  const recs = new Map();
  await Promise.all(seeds.map(async seed => {
    let result;
    try {
      result = await SOURCES[apiName](seed);
    } catch (error) {
      console.log(`Tips: skipping ${seed.apiCache.title}`, error);
      return;
    }
    if (result.self) {
      listed.add(result.self);
    }
    for (const r of result.recs) {
      const rec = recs.get(r.key) ?? {...r, apiName, score: 0, because: []};
      rec.score += (seed.rating - 6) * r.strength;
      rec.because.push({
        title: seed.apiCache.title,
        rating: seed.rating,
        href: `review.html?api_name=${seed.apiName}&api_id=${seed.apiId}`,
      });
      recs.set(r.key, rec);
    }
  }));

  const tips = [...recs.values()]
    .filter(r => r.title && !listed.has(r.key) && !listedTitles.has(r.title.toLowerCase()))
    .sort((a, b) => b.score - a.score)
    .slice(0, SHOWN);

  list.removeAttribute('aria-busy');
  if (seeds.length === 0 || tips.length === 0) {
    const p = document.createElement('p');
    p.textContent = seeds.length === 0 ? 'Rate some titles 7 or higher to get tips.' : 'No tips found.';
    list.replaceChildren(p);
    return;
  }
  list.replaceChildren(...tips.map(tipCard));
}

async function load() {
  const items = await allItems();
  await Promise.all(Object.keys(SOURCES).map(apiName => collectionTips(apiName, items)));
}

if (isLoggedIn()) {
  load();
}

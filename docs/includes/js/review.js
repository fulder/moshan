import {getApiByName} from './api/common.js';
import {MoshanApi} from './api/moshan.js';
import {createNavbar} from './common/navbar.js';
import {isLoggedIn} from './common/auth.js';

createNavbar();

const urlParams = new URLSearchParams(window.location.search);
const qParams = new QueryParams(urlParams);

const $ = id => document.getElementById(id);

$('saveButton').addEventListener('click', saveButtonClicked);
$('addButton').addEventListener('click', addButtonClicked);
$('removeButton').addEventListener('click', removeButtonClicked);
$('newCalendarButton').addEventListener('click', () => createOneCalendar());
$('episodePagePrev').addEventListener('click', () => loadEpisodes(qParams.episode_page - 1));
$('episodePageNext').addEventListener('click', () => loadEpisodes(qParams.episode_page + 1));
$('episodePageSelect').addEventListener('change', evt => loadEpisodes(parseInt(evt.target.value)));

const moshanApi = new MoshanApi();
const api = getApiByName(qParams.api_name);

const watchHistoryEpisodeIDs = [];
let totalPages = 0;
let savedPatchData;
const episodeReview = qParams.episode_api_id !== null;

if (isLoggedIn()) {
  createReview();
}

window.onbeforeunload = function () {
  if (savedPatchData !== undefined && JSON.stringify(savedPatchData) !== JSON.stringify(getPatchData())) {
    return 'Are you sure you want to leave?';
  }
};

function QueryParams(urlParams) {
  this.collection = urlParams.get('collection');
  this.api_name = urlParams.get('api_name');
  this.id = urlParams.get('id');
  this.api_id = urlParams.get('api_id');
  this.item_api_id = this.api_id;
  this.episode_page = parseInt(urlParams.get('episode_page') ?? '1');
  this.episode_api_id = urlParams.get('episode_api_id');
  this.extra_ep = urlParams.get('extra_ep');
}

function createReview() {
  if (episodeReview) {
    createEpisode();
  } else {
    createItem();
  }
}

async function getMoshan(getFunc) {
  try {
    return await getFunc(qParams);
  } catch (error) {
    if (error.status !== 404) {
      console.log(error);
    }
    return null;
  }
}

async function createItem() {
  let item = await getMoshan(moshanApi.getItem.bind(moshanApi));

  if (item === null && qParams.extra_ep !== 'true') {
    item = await api.getItemById(qParams);
  }

  createReviewPage(item);

  if (item.hasEpisodes) {
    $('datesFieldset').hidden = true;
    const apiEpisodes = await api.getEpisodes(qParams);

    const moshanEpisodes = await getMoshan(moshanApi.getEpisodes.bind(moshanApi)) ?? {episodes: []};
    for (const episode of moshanEpisodes.episodes) {
      watchHistoryEpisodeIDs.push(parseInt(episode.episodeApiId));
    }

    if (qParams.api_name == 'mal' && (item.status === 'Currently Airing' || apiEpisodes.episodes.length == 0)) {
      let latestMalId = 0;
      if (apiEpisodes.episodes.length != 0) {
        latestMalId = apiEpisodes.episodes[0].mal_id;
      }
      let latestWatchedMalId = 0;
      if (watchHistoryEpisodeIDs.length != 0) {
        latestWatchedMalId = Math.max(...watchHistoryEpisodeIDs);
      }

      const extraEps = latestWatchedMalId - latestMalId + 1;
      for (let i = 0; i < extraEps; i++) {
        apiEpisodes.episodes.unshift({
          mal_id: latestMalId + i + 1,
          title: 'N/A',
          aired: null,
          extra_ep: true,
        });
      }
    }

    createEpisodesList(apiEpisodes);
  }
}

async function createEpisode() {
  let episode = await getMoshan(moshanApi.getEpisode.bind(moshanApi));
  if (episode === null) {
    episode = {review: {}};
  }

  episode.title = 'N/A';
  episode.number = qParams.episode_api_id;
  episode.releaseDate = 'N/A';
  episode.imageUrl = '/includes/img/image_not_available.png';

  if (qParams.extra_ep !== 'true') {
    const apiEpisode = await api.getEpisode(qParams);
    episode.title = apiEpisode.title;
    episode.releaseDate = apiEpisode.releaseDate;
    episode.imageUrl = apiEpisode.imageUrl;
    episode.status = apiEpisode.status;
    episode.previousId = apiEpisode.previousId;
    episode.nextId = apiEpisode.nextId;
    episode.number = apiEpisode.number;
  }

  createReviewPage(episode);
}

function createReviewPage(reviewItem) {
  const review = reviewItem.review;
  const itemAdded = reviewItem.apiName === 'moshan';

  const meta = [];
  if (episodeReview) {
    meta.push(`#${reviewItem.number}`);
  }
  meta.push(`Released ${reviewItem.releaseDate ?? 'N/A'}`);
  if (reviewItem.status !== undefined) {
    meta.push(reviewItem.status);
  }
  $('meta').textContent = meta.join(' · ');

  $('overview').value = review.overview ?? '';
  $('review').value = review.review ?? '';
  $('user-status').value = review.status ?? '';
  $('user-rating').value = review.rating ?? '';
  $('user_added_date').textContent = review.createdAt ?? '–';

  $('poster').src = reviewItem.imageUrl ?? '/includes/img/image_not_available.png';
  $('title').textContent = reviewItem.title || 'N/A';
  document.title = `${reviewItem.title || 'N/A'} - Moshan`;

  let apiUrl;
  if (qParams.api_name === 'tmdb') {
    apiUrl = `https://www.themoviedb.org/movie/${qParams.api_id}`;
  } else if (qParams.api_name === 'tvmaze') {
    apiUrl = episodeReview
      ? `https://www.tvmaze.com/episodes/${qParams.episode_api_id}`
      : `https://www.tvmaze.com/shows/${qParams.api_id}`;
  } else if (qParams.api_name === 'mal' && !episodeReview) {
    apiUrl = `https://myanimelist.net/anime/${qParams.api_id}`;
  }
  if (apiUrl !== undefined) {
    $('link').innerHTML = `<a class="api-link" href="${apiUrl}" target="_blank"><img src="/includes/icons/${qParams.api_name}.png" alt="${qParams.api_name}"></a>`;
  }

  if (reviewItem.synopsis) {
    $('synopsis').innerHTML = reviewItem.synopsis;
    $('synopsisDetails').hidden = false;
  }

  $('addButton').hidden = itemAdded;
  $('removeButton').hidden = !itemAdded;

  const episodeUrl = id => `/review.html?api_name=${qParams.api_name}&api_id=${qParams.api_id}&episode_api_id=${id}`;
  if (episodeReview) {
    $('backLink').href = `/review.html?api_name=${qParams.api_name}&api_id=${qParams.api_id}`;
    $('episodeNav').hidden = false;
    if (reviewItem.previousId) {
      $('previousButton').href = episodeUrl(reviewItem.previousId);
      $('previousButton').hidden = false;
    }
    if (reviewItem.nextId) {
      $('nextButton').href = episodeUrl(reviewItem.nextId);
      $('nextButton').hidden = false;
    }
  }

  if (!reviewItem.hasEpisodes) {
    const datesWatched = review.datesWatched ?? [];
    if (datesWatched.length === 0) {
      createOneCalendar();
    }
    datesWatched.forEach(createOneCalendar);
  }
  updateWatchedCount();

  $('item').hidden = false;
  $('loading').hidden = true;

  savedPatchData = getPatchData();
}

// ISO string -> value for <input type="datetime-local"> in local time
function toLocalInput(iso) {
  const d = new Date(iso);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

function createOneCalendar(calDate = null) {
  const row = document.createElement('div');
  row.setAttribute('role', 'group');
  row.innerHTML = `
    <input type="datetime-local" aria-label="Watch date">
    <button type="button" class="secondary">Now</button>
    <button type="button" class="secondary outline" aria-label="Remove date">✕</button>`;

  const [input, nowButton, removeButton] = row.children;
  if (calDate !== null) {
    input.value = toLocalInput(calDate);
  }
  input.addEventListener('input', updateWatchedCount);
  nowButton.addEventListener('click', () => {
    input.value = toLocalInput(new Date().toISOString());
    updateWatchedCount();
  });
  removeButton.addEventListener('click', () => {
    if ($('watched-dates').children.length === 1) {
      input.value = '';
    } else {
      row.remove();
    }
    updateWatchedCount();
  });

  $('watched-dates').appendChild(row);
}

function dateInputs() {
  return [...$('watched-dates').querySelectorAll('input')];
}

function updateWatchedCount() {
  $('watched_amount').textContent = dateInputs().filter(i => i.value !== '').length;
}

function getPatchData() {
  const rating = $('user-rating').value;

  return {
    watchDates: dateInputs().filter(i => i.value !== '').map(i => new Date(i.value).toISOString()),
    overview: $('overview').value,
    review: $('review').value,
    rating: rating === '' ? '' : parseInt(rating),
    status: $('user-status').value,
  };
}

async function withBusy(button, action) {
  button.setAttribute('aria-busy', 'true');
  try {
    await action();
  } catch (error) {
    console.log(error);
    alert(`Failed: ${error.message}`);
  }
  button.removeAttribute('aria-busy');
}

function addButtonClicked(evt) {
  const addFunc = episodeReview ? moshanApi.addEpisode : moshanApi.addItem;

  withBusy(evt.target, async () => {
    const res = await addFunc.call(moshanApi, qParams);
    qParams.id = res?.id;
    $('addButton').hidden = true;
    $('removeButton').hidden = false;
  });
}

function removeButtonClicked(evt) {
  const removeFunc = episodeReview ? moshanApi.removeEpisode : moshanApi.removeItem;

  withBusy(evt.target, async () => {
    await removeFunc.call(moshanApi, qParams);
    $('addButton').hidden = false;
    $('removeButton').hidden = true;
  });
}

function saveButtonClicked(evt) {
  const data = getPatchData();
  const updateFunc = episodeReview ? moshanApi.updateEpisode : moshanApi.updateItem;

  withBusy(evt.target, async () => {
    await updateFunc.call(moshanApi, qParams, data.overview, data.review, data.status, data.rating, data.watchDates);
    savedPatchData = data;
  });
}

function createEpisodesList(apiEpisodes) {
  $('episodes').hidden = false;

  const rows = apiEpisodes.episodes.map(episode => {
    const moshanEpisode = api.getMoshanEpisode(episode);

    let href = `review.html?api_name=${qParams.api_name}&api_id=${qParams.api_id}&episode_api_id=${moshanEpisode.id}`;
    if (episode.extra_ep) {
      href += '&extra_ep=true';
    }

    const row = document.createElement('tr');
    row.dataset.href = href;
    if (watchHistoryEpisodeIDs.includes(moshanEpisode.id)) {
      row.className = 'watched';
    }
    row.addEventListener('click', () => window.location.href = href);

    for (const value of [moshanEpisode.number, moshanEpisode.title, moshanEpisode.releaseDate]) {
      const td = document.createElement('td');
      td.textContent = value ?? '';
      row.appendChild(td);
    }
    return row;
  });
  $('episodeTableBody').replaceChildren(...rows);

  totalPages = apiEpisodes.total_pages;
  $('episodePages').hidden = totalPages <= 1;
  const select = $('episodePageSelect');
  if (select.options.length !== totalPages) {
    select.replaceChildren(...Array.from({length: totalPages}, (_, i) => new Option(`Page ${i + 1} of ${totalPages}`, i + 1)));
  }
  select.value = qParams.episode_page;
  $('episodePagePrev').disabled = qParams.episode_page <= 1;
  $('episodePageNext').disabled = qParams.episode_page >= totalPages;
}

async function loadEpisodes(page) {
  if (page < 1 || page > totalPages || page === qParams.episode_page) {
    return;
  }
  qParams.episode_page = page;

  $('episodesTable').setAttribute('aria-busy', 'true');
  createEpisodesList(await api.getEpisodes(qParams));
  $('episodesTable').removeAttribute('aria-busy');

  urlParams.set('episode_page', page);
  history.pushState({}, '', `?${urlParams.toString()}`);
}

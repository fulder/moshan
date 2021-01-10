/* global WatchHistoryApi, getMoshanApiByCollectionName, getApiByName */
const urlParams = new URLSearchParams(window.location.search);
const qParams = new QueryParams(urlParams);

document.getElementById('headTitle').innerHTML = `Moshan - ${qParams.collection}`;

const watchHistoryApi = new WatchHistoryApi();
const moshanApi = getMoshanApiByCollectionName(qParams.collection);
const api = getApiByName(qParams.api_name);
// quickfix for anime episodes, use moshan api until
// e.g. MAL api implements episode routes
const episodeApi = qParams.collection == 'anime' ? moshanApi: api;
let totalPages = 0;

if (qParams.id !== null) {
  getItemByMoshanId();
}
else if (qParams.api_id !== null) {
  getItemByApiId();
}

function QueryParams(urlParams) {
  this.collection = urlParams.get('collection');
  this.api_name = urlParams.get('api_name');
  this.id = urlParams.get('id');
  this.api_id = urlParams.get('api_id');
  this.episode_page = urlParams.get('episode_page');

  if (this.episode_page === null) {
    this.episode_page = 1;
  } else {
    this.episode_page = parseInt(this.episode_page);
  }
}

async function getItemByMoshanId() {
  let watchHistoryItem = null;
  try {
    watchHistoryItemRes = await watchHistoryApi.getWatchHistoryItem(qParams);
    console.debug(watchHistoryItemRes);
    watchHistoryItem = watchHistoryItemRes.data;
  } catch(error) {
    if (!('response' in error && error.response.status == 404)) {
      console.log(error);
    }
  }

  const itemRes = await moshanApi.getItemById(qParams);
  const item = itemRes.data;
  console.debug(item);
  const apiId = item[`${qParams.api_name}_id`];

  const apiRes = await api.getItemById({'api_id': apiId});
  const moshanItem = api.getMoshanItem(apiRes.data);

  createItem(moshanItem, item, watchHistoryItem);

  if (moshanItem.has_episodes) {
    const episodesRes = await episodeApi.getEpisodes(qParams);
    const moshanEpisodes = episodeApi.getMoshanEpisodes(episodesRes.data);
    createEpisodesList(moshanEpisodes);
  }
}

async function getItemByApiId() {
  let item = null;
  try {
    const itemRes = await moshanApi.getItemByApiId(qParams);
    item = itemRes.data;
  } catch(error){
    console.debug(error);
    if (!('response' in error && error.response.status == 404)) {
      console.log(error);
    }
  }

  if (item !== null && 'id' in item) {
    // item cached use UUID instead
    qParams.id = item.id;
    return getItemByMoshanId();
  }

  const apiRes = await api.getItemById(qParams);
  const moshanItem = api.getMoshanItem(apiRes.data);

  createItem(moshanItem, null, null);

  // can't lookup anime episodes in anime API if the item doesn't exist
  if (qParams.collection != 'anime' && moshanItem.has_episodes) {
    const episodesRes = await episodeApi.getEpisodes(qParams);
    const moshanEpisodes = episodeApi.getMoshanEpisodes(episodesRes.data);
    createEpisodesList(moshanEpisodes);
  }
}

function createItem (moshanItem, item, watchHistoryItem) {
  const itemAdded = watchHistoryItem !== null;
  console.debug(`Item added: ${itemAdded}`);
  console.debug(moshanItem);

  document.getElementById('poster').src = moshanItem.poster;
  document.getElementById('title').innerHTML = moshanItem.title;
  document.getElementById('start-date').innerHTML = moshanItem.start_date;
  document.getElementById('status').innerHTML = moshanItem.status;
  document.getElementById('synopsis').innerHTML = moshanItem.synopsis;

  // TODO: store links in api and loop through them creating the links dynamically
  /*let links = '';
  links += `
    <div class="col-6 col-md-5">
        <a id="mal-link" href=${apiLink} target="_blank"><img class="img-fluid" src="/includes/icons/${apiName}.png" /></a>
    </div>
  `;
  document.getElementById('links').innerHTML = links;*/

  if (itemAdded) {
    document.getElementById('remove-button').classList.remove('d-none');
  } else {
    document.getElementById('add-button').classList.remove('d-none');
  }

  document.getElementById('item').classList.remove('d-none');
}

/* exported addItem */
async function addItem () {
  try {
    const addItemRes = await moshanApi.addItem(qParams);
    const id = addItemRes.data.id;

    await watchHistoryApi.addWatchHistoryItem({'collection': qParams.collection, 'id': id});
    document.getElementById('add-button').classList.add('d-none');
    document.getElementById('remove-button').classList.remove('d-none');
  } catch (error) {
    console.log(error);
  }
}

/* exported removeItem */
async function removeItem () {
  try {
    await watchHistoryApi.removeWatchHistoryItem(qParams);
    document.getElementById('add-button').classList.remove('d-none');
    document.getElementById('remove-button').classList.add('d-none');
  } catch (error) {
    console.log(error);
  }
}

function createEpisodesList (moshanEpisodes) {
  let tableHTML = '';

  moshanEpisodes.episodes.forEach(function (episode) {
    episode = episodeApi.getMoshanEpisode(episode);

    let rowClass = 'bg-secondary';
    let onClickAction = '';

    if (episode.aired && qParams.id !== null) {
      rowClass = 'episodeRow';
      onClickAction = `window.location='/episode?collection=${qParams.collection}&api_name=${qParams.api_name}&id=${qParams.id}&episode_id=${episode.id}'`;
    } else if (episode.aired && qParams.api_id !== null) {
      rowClass = 'episodeRow';
      onClickAction = `window.location='/episode?collection=${qParams.collection}&api_name=${qParams.api_name}&api_id=${qParams.api_id}&episode_id=${episode.id}'`;
    }

    tableHTML += `
            <tr onclick="${onClickAction}" class=${rowClass}>
                <td class="small">${episode.number}</td>
                <td class="text-truncate small">${episode.title}</td>
                <td class="small">${episode.air_date}</td>
            </tr>
        `;
  });

  document.getElementById('episodeTableBody').innerHTML = tableHTML;
  document.getElementById('episodesTable').classList.remove('d-none');

  if (document.getElementById('episodesPages').innerHTML === '') {
    let paginationHTML = '<li class="page-item"><a href="javascript:void(0)" class="page-link" onclick="loadPreviousEpisodes()">Previous</a></li>';

    totalPages = moshanEpisodes.total_pages;
    for (let i = 1; i <= totalPages; i++) {
      let className = 'page-item';
      if (i === qParams.episode_page) {
        className = 'page-item active';
      }
      paginationHTML += `<li id="episodePage${i}" class="${className}"><a href="javascript:void(0)" class="page-link" onclick="loadEpisodes(${i})">${i}</a></li>`;
    }
    paginationHTML += '<li class="page-item"><a href="javascript:void(0)" class="page-link" onclick="loadNextEpisodes()">Next</a></li>';

    document.getElementById('episodesPages').innerHTML = paginationHTML;
  }
}

/* exported loadPreviousEpisodes */
function loadPreviousEpisodes () {
  if (qParams.episode_page > 1) {
    loadEpisodes(qParams.episode_page - 1);
  }
}

/* exported loadNextEpisodes */
function loadNextEpisodes () {
  if (qParams.episode_page < totalPages) {
    loadEpisodes(qParams.episode_page + 1);
  }
}

async function loadEpisodes (page) {
  if (qParams.episode_page === page) {
    return;
  }
  document.getElementById('episodesPages').getElementsByTagName('LI')[qParams.episode_page].classList.remove('active');

  qParams.episode_page = page;

  const episodesRes = await episodeApi.getEpisodes(qParams);
  const moshanEpisodes = episodeApi.getMoshanEpisodes(episodesRes.data);
  createEpisodesList(moshanEpisodes);

  document.getElementById('episodesPages').getElementsByTagName('LI')[qParams.episode_page].classList.add('active');

  urlParams.set('episode_page', qParams.episode_page);
  history.pushState({}, null, `?${urlParams.toString()}`);
}

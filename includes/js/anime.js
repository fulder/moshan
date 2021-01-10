/* global WatchHistoryApi, getApiFromName */
const urlParams = new URLSearchParams(window.location.search);
const collection = urlParams.get('collection_name');
const apiName = urlParams.get('api_name');
let id = urlParams.get('id');
let apiId = urlParams.get('api_id');
let episodePage = urlParams.get('episode_page');

document.getElementById('headTitle').innerHTML = `Moshan - ${collection}`;

const watchHistoryApi = new WatchHistoryApi();
const moshanApi = getApiFromName(collection);
const api = getApiFromName(apiName);

// quickfix for anime episodes, use moshan api until
// e.g. MAL api implements episode routes
const episodeApi = collection == 'anime' ? moshanApi: api;

if (episodePage === null) {
  episodePage = 1;
} else {
  episodePage = parseInt(episodePage);
}

let totalPages = 0;

if (id !== null) {
  getItemByMoshanId();
}
else if (apiId !== null) {
  getItemByApiId();
}

async function getItemByMoshanId() {
  let watchHistoryItem = null;
  try {
    watchHistoryItemRes = await watchHistoryApi.getWatchHistoryItem(collection, id);
    console.debug(watchHistoryItemRes);

    watchHistoryItem = watchHistoryItemRes.data;
  } catch(error) {
    if (error.response.status != 404) {
      console.log(error);
    }
  }

  const itemRes = await api.getItemById(id);
  const item = itemRes.data;
  console.debug(item);
  const apiId = item[`${apiName}_id`];

  const apiRes = await api.getItemById(apiId);
  const apiItem = apiRes.data;

  createItem(apiItem, item, watchHistoryItem);

  if (api.hasEpisodes(apiItem)) {
    episodeRes = await episodeApi.getEpisodes(id, episodePage),
    createEpisodesList(id, episodeRes.data, watchHistoryItem);
  }
}

async function getItemByApiId() {
  let item = null;
  try {
    const itemRes = await api.getItemByApiId(apiName, apiId);
    item = itemRes.data;
  } catch(error){
    if (error.response.status != 404) {
        console.log(error);
    }
  }

  if (item !== null && 'id' in item) {
    // item cached use UUID instead
    id = item.id;
    return getItemById();
  }

  const apiItemRes = await api.getItemById(apiId);
  createItem(apiItemRes.data, null, null);
}

function createItem (apiItem, item, watchHistoryItem) {
  const itemAdded = watchHistoryItem !== null;
  console.debug(`Item added: ${itemAdded}`);

  const moshanItem = api.getMoshanItem(apiItem);
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
    const addItemRes = await moshanApi.addItem(apiName, apiId);
    const id = addItemRes.data.id;

    await watchHistoryApi.addWatchHistoryItem(collection, id);
    document.getElementById('add-button').classList.add('d-none');
    document.getElementById('remove-button').classList.remove('d-none');
  } catch (error) {
    console.log(error);
  }
}

/* exported removeItem */
async function removeItem () {
  try {
    await watchHistoryApi.removeWatchHistoryItem(collection, id);
    document.getElementById('add-button').classList.remove('d-none');
    document.getElementById('remove-button').classList.add('d-none');
  } catch (error) {
    console.log(error);
  }
}

function createEpisodesList (id, episodes) {
  let tableHTML = '';
  episodes.items.forEach(function (episode) {
    episode = api.getMoshanEpisode(episode);

    let rowClass = 'episodeRow';
    let onClickAction = `window.location='/episode?collection_name=${collection}&id=${id}&episode_id=${episode.id}'`;
    if (!episode.aired) {
      rowClass = 'bg-secondary';
      onClickAction = '';
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

    totalPages = episodes.total_pages;
    for (let i = 1; i <= totalPages; i++) {
      let className = 'page-item';
      if (i === episodePage) {
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
  if (episodePage > 1) {
    loadEpisodes(episodePage - 1);
  }
}

/* exported loadNextEpisodes */
function loadNextEpisodes () {
  if (episodePage < totalPages) {
    loadEpisodes(episodePage + 1);
  }
}

function loadEpisodes (page) {
  if (episodePage === page) {
    return;
  }
  document.getElementById('episodesPages').getElementsByTagName('LI')[episodePage].classList.remove('active');

  episodePage = page;
  episodesApi.getEpisodes(id, episodePage).then(function (response) {
    createEpisodesList(response.data);
  }).catch(function (error) {
    console.log(error);
  });

  document.getElementById('episodesPages').getElementsByTagName('LI')[episodePage].classList.add('active');

  urlParams.set('episode_page', page);
  history.pushState({}, null, `?${urlParams.toString()}`);
}

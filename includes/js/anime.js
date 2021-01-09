/* global AnimeApi, MalApi, WatchHistoryApi */

const animeApi = new AnimeApi();
const malApi = new MalApi();
const watchHistoryApi = new WatchHistoryApi();

const urlParams = new URLSearchParams(window.location.search);
const apiName = urlParams.get('api_name');
let id = urlParams.get('id');
let apiId = urlParams.get('api_id');
let episodePage = urlParams.get('episode_page');

if (episodePage === null) {
  episodePage = 1;
} else {
  episodePage = parseInt(episodePage);
}

let totalPages = 0;

if (id !== null) {
  getAnimeById();
}
else if (apiId !== null && apiName === 'mal') {
  getAnimeByMalId();
}

async function getAnimeById() {
  try {
    const animeItemRes = await animeApi.getAnimeById(id);
    const animeItem = animeItemRes.data;
    console.debug(animeItem);

    const apiId = animeItem[`${apiName}_id`];

    const requests = [
      malApi.getAnimeById(apiId),
      animeApi.getAnimeEpisodes(id, episodePage),
      watchHistoryApi.getWatchHistoryItem('anime', id),
    ];
    const [apiAnimeRes, animeEpisodesRes, watchHistoryItemRes] = await Promise.all(requests);

    createAnime(apiAnimeRes.data, animeItem);
    createEpisodesList(id, animeEpisodesRes.data, watchHistoryItemRes.data);
  } catch(error) {
    console.log(error);
  }
}

async function getAnimeByMalId() {
  let animeItem = null;
  try {
    const animeItemRes = await animeApi.getAnimeByApiId(apiName, apiId);
    animeItem = animeItemRes.data;
  } catch(error){
    if (error.response.status != 404) {
        console.log(error);
    }
  }

  if (animeItem !== null && 'id' in animeItem) {
    // anime cached in mal use anime UUID instead
    id = animeItem.id;
    return getAnimeById();
  }

  try {
    const apiAnimeItemRes = await malApi.getAnimeById(apiId);

    createAnime(apiAnimeItemRes.data, null, null);
  } catch(error) {
    console.log(error);
  }
}

function createAnime (apiAnimeItem, animeItem, watchHistoryItem) {
  const itemAdded = watchHistoryItem !== null;

  let status = 'Airing';
  if ('end_date' in apiAnimeItem && apiAnimeItem.end_date !== null) {
    status = 'Finished';
  }

  document.getElementById('poster').src = apiAnimeItem.main_picture.large;
  document.getElementById('title').innerHTML = apiAnimeItem.title;
  document.getElementById('start-date').innerHTML = apiAnimeItem.start_date;
  document.getElementById('status').innerHTML = status;
  document.getElementById('synopsis').innerHTML = apiAnimeItem.synopsis;
  document.getElementById('mal-link').href = `https://myanimelist.net/anime/${apiAnimeItem.id}`;

  if (animeItem !== null && 'anidb_id' in animeItem) {
    document.getElementById('anidb-link').href = `https://anidb.net/anime/${animeItem.anidb_id}`;
    document.getElementById('anidb-link-div').classList.remove('d-none');
  }

  if (itemAdded) {
    document.getElementById('remove-button').classList.remove('d-none');
  } else {
    document.getElementById('add-button').classList.remove('d-none');
  }

  document.getElementById('anime').classList.remove('d-none');
}

/* exported addItem */
async function addItem (type) {
  try {
    const animeApiResponse = await animeApi.addAnime(apiName, apiId);
    const animeId = animeApiResponse.data.id;

    await watchHistoryApi.addWatchHistoryItem(type, apiName, animeId);
    document.getElementById('addButton').classList.add('d-none');
    document.getElementById('removeButton').classList.remove('d-none');
  } catch (error) {
    console.log(error);
  }
}

/* exported removeItem */
async function removeItem (type) {
  try {
    await watchHistoryApi.removeWatchHistoryItem(type, id);
    document.getElementById('addButton').classList.remove('d-none');
    document.getElementById('removeButton').classList.add('d-none');
  } catch (error) {
    console.log(error);
  }
}

function createEpisodesList (animeId, episodes) {
  let tableHTML = '';
  episodes.items.forEach(function (episode) {
    const episodeId = episode.id;
    const episodeNumber = episode.episode_number;
    const episodeDate = episode.air_date;
    const episodeAired = Date.parse(episodeDate) <= (new Date()).getTime();

    let rowClass = 'episodeRow';
    let onClickAction = `window.location='/episode?collection_name=anime&id=${animeId}&episode_id=${episodeId}'`;
    if (!episodeAired) {
      rowClass = 'bg-secondary';
      onClickAction = '';
    }

    tableHTML += `
            <tr onclick="${onClickAction}" class=${rowClass}>
                <td class="small">${episodeNumber}</td>
                <td class="text-truncate small">${episode.title}</td>
                <td class="small">${episodeDate}</td>
            </tr>
        `;
  });

  document.getElementById('episodeTableBody').innerHTML = tableHTML;

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
  animeApi.getAnimeEpisodes(id, episodePage).then(function (response) {
    createEpisodesList(response.data);
  }).catch(function (error) {
    console.log(error);
  });

  document.getElementById('episodesPages').getElementsByTagName('LI')[episodePage].classList.add('active');

  urlParams.set('episode_page', page);
  history.pushState({}, null, `?${urlParams.toString()}`);
}

/* global axios */
/* global AnimeApi, MalApi, WatchHistoryApi */

const animeApi = new AnimeApi();
const malApi = new MalApi();
const watchHistoryApi = new WatchHistoryApi();

const urlParams = new URLSearchParams(window.location.search);
const id = urlParams.get('id');
const apiName = urlParams.get('api_name');
let apiId = urlParams.get('api_id');
let episodePage = urlParams.get('episode_page');

if (episodePage === null) {
  episodePage = 1;
} else {
  episodePage = parseInt(episodePage);
}

let totalPages = 0;

let requests = [];
if (id !== null) {
  apiId = getAnimeApiId(apiName, id);

  const moshanAnimeRequest = animeApi.getAnimeById(id);
  const watchHistoryRequest = watchHistoryApi.getWatchHistoryItem('anime', id);
  const animeEpisodesRequest = animeApi.getAnimeEpisodes(id, episodePage);

  requests.push(moshanAnimeRequest, watchHistoryRequest, animeEpisodesRequest);
}

let apiAnimeItem;
if (apiName === 'mal') {
  apiAnimeItem = malApi.getAnimeById(apiId);
}
requests.push(apiAnimeItem);

axios.all(requests).then(axios.spread((...responses) => {
  const apiAnimeItem = responses.shift().data;
  const animeId = apiAnimeItem.id;

  let animeItem = null;
  let animeEpisodes = null;
  let watchHistoryItem = null;

  if (responses.length > 1) {
    animeItem = responses[0].data;
    watchHistoryItem = responses[1].data;
    animeEpisodes = responses[2].data;
  }

  createAnime(apiAnimeItem, watchHistoryItem, animeItem);

  if (animeEpisodes !== null) {
    createEpisodesList(animeId, animeEpisodes);
  }
})).catch(errors => {
  console.log(errors);
});

function getAnimeApiId(apiName, animeId) {
  animeApi.getAnimeById(animeId).then(response => {
    return response[`${apiName}_id`];
  }).catch(error => {
      console.log(error);
  });
}

function createAnime (apiAnimeItem, watchHistoryItem, animeItem) {
  const itemAdded = watchHistoryItem !== null;

  let status = 'Airing';
  if ('end_date' in apiAnimeItem && apiAnimeItem.end_date !== null) {
    status = 'Finished';
  }

  const resultHTML = `
        <div class="col-md-3 col-5 item">
            <img class="img-fluid" src="${apiAnimeItem.main_picture.large}" />
        </div>

        <div class="col-md-9 col-7">
            <h5>${apiAnimeItem.title}</h5>
            <b>Released</b>: ${apiAnimeItem.start_date}<br>
            <b>Status</b>: ${status}
             <div class="card mt-2 col-7 col-md-3">
                <div class="card-header">Links</div>
                <div class="card-body p-1">
                    <div class="row">
                        <div class="col-6 col-md-5">
                            <a href="https://myanimelist.net/anime/${apiAnimeItem.id}" target="_blank"><img class="img-fluid" src="/includes/icons/mal.png" /></a>
                        </div>
                        <div id="anidbLink" class="col-6 col-md-5 d-none">
                            <a href="https://anidb.net/anime/${animeItem.anidb_id}" target="_blank"><img class="img-fluid" src="/includes/icons/anidb.png" /></a>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="col-md-3 col-7 mt-1">
            <button id="addButton" class="btn btn-success ${itemAdded ? 'd-none' : ''}" onclick="addItemWrapper('anime', '${apiName}', ${animeItem.mal_id})"><i class="fa fa-plus"></i> Add</button>
            <button id="removeButton" class="btn btn-danger ${!itemAdded ? 'd-none' : ''}" onclick="removeItemWrapper('anime', '${animeItem.id}')"><i class="fa fa-minus"></i> Remove</button>
        </div>

        <div id="synopsisCol" class="mt-2 col-12">
            <div class="card">
                <a data-toggle="collapse" data-target="#collapseSynopsis" aria-expanded="true" aria-controls="collapseSynopsis">
                    <div id="synopsisCardHeader" class="card-header">Synopsis</div>
                </a>
                <div id="collapseSynopsis" class="collapse" aria-labelledby="synopsisHeader" data-parent="#synopsisCol">
                    <div class="card-body">${animeItem.synopsis}</div>
                </div>
            </div>
       </div>
    `;

  document.getElementById('anime').innerHTML = resultHTML;

  if ('anidb_id' in animeItem) {
    document.getElementById('anidbLink').classList.remove('d-none');
  }
}

/* exported addItemWrapper */
async function addItemWrapper (type, apiName, id) {
  try {
    const animeApiResponse = await animeApi.addAnime(apiName, id);
    const animeId = animeApiResponse.data.id;

    await watchHistoryApi.addWatchHistoryItem(type, apiName, animeId);
    document.getElementById('addButton').classList.add('d-none');
    document.getElementById('removeButton').classList.remove('d-none');
  } catch (error) {
    console.log(error);
  }
}

/* exported removeItemWrapper */
async function removeItemWrapper (type, id) {
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

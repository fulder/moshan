/* global axios */
/* global TvMazeApi, ShowsApi, WatchHistoryApi */

const tvMazeApi = new TvMazeApi();
const showsApi = new ShowsApi();
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
  apiId = getShowApiId(apiName, id);

  const watchHistoryRequest = watchHistoryApi.getWatchHistoryItem('show', id);
  requests.push(watchHistoryRequest);
}

let showRequest;
let showEpisodesRequest;
if (apiName === 'tvmaze') {
  showRequest = tvMazeApi.getShowById(apiId);
  showEpisodesRequest = tvMazeApi.getShowEpisodes(apiId);
}
requests.push(showRequest, showEpisodesRequest);

axios.all(requests).then(axios.spread((...responses) => {
  console.debug(responses);

  let watchHistoryItem = null;
  if (responses.length === 3) {
    watchHistoryItem = responses.shift().data;
  }

  const showItem = responses.shift().data;
  const showEpisodes = responses.shift().data;

  createShow(watchHistoryItem, showItem);
  createEpisodesList(showItem.id, showEpisodes);
})).catch(errors => {
  console.log(errors);
});

function getShowApiId(apiName, showId) {
  showsApi.getShowById(showId).then(response => {
    return response[`${apiName}_id`];
  }).catch(error => {
      console.log(error);
  });
}

function createShow (watchHistoryItem, showItem) {
  const itemAdded = watchHistoryItem !== null;

  const resultHTML = `
        <div class="col-md-3 col-5 item">
            <img class="img-fluid" src="${showItem.image.original}" />
        </div>

        <div class="col-md-9 col-7">
            <h5>${showItem.name}</h5>
            <b>Released</b>: ${showItem.premiered}<br>
            <b>Status</b>: ${showItem.status}
             <div class="card mt-2 col-7 col-md-3">
                <div class="card-header">Links</div>
                <div class="card-body p-1">
                    <div class="row">
                        <div class="col-6 col-md-5">
                            <a href="${showItem.url}" target="_blank"><img class="img-fluid" src="/includes/icons/${apiName}.png" /></a>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="col-md-3 col-7 mt-1">
            <button id="addButton" class="btn btn-success ${itemAdded ? 'd-none' : ''}" onclick="addItemWrapper('show', ${showItem.id})"><i class="fa fa-plus"></i> Add</button>
            <button id="removeButton" class="btn btn-danger ${!itemAdded ? 'd-none' : ''}" onclick="removeItemWrapper('show', '${showItem.id}')"><i class="fa fa-minus"></i> Remove</button>
        </div>

        <div id="synopsisCol" class="mt-2 col-12">
            <div class="card">
                <a data-toggle="collapse" data-target="#collapseSynopsis" aria-expanded="true" aria-controls="collapseSynopsis">
                    <div id="synopsisCardHeader" class="card-header">Synopsis</div>
                </a>
                <div id="collapseSynopsis" class="collapse" aria-labelledby="synopsisHeader" data-parent="#synopsisCol">
                    <div class="card-body">${showItem.summary}</div>
                </div>
            </div>
       </div>
    `;

  document.getElementById('show').innerHTML = resultHTML;
}

/* exported addItemWrapper */
function addItemWrapper (type, id) {
  watchHistoryApi.addWatchHistoryItem(type, id).then(function () {
    document.getElementById('addButton').classList.add('d-none');
    document.getElementById('removeButton').classList.remove('d-none');
  }).catch(function (error) {
    console.log(error);
  });
}

/* exported removeItemWrapper */
function removeItemWrapper (type, id) {
  watchHistoryApi.removeWatchHistoryItem(type, id).then(function () {
    document.getElementById('addButton').classList.remove('d-none');
    document.getElementById('removeButton').classList.add('d-none');
  }).catch(function (error) {
    console.log(error);
  });
}

function createEpisodesList (showId, showEpisodes) {
  let tableHTML = '';

  showEpisodes.forEach(function (episode) {
    const seasonNbr = (episode.season < 10 ? '0' : '') + episode.season;
    const episodeNbr = (episode.episode < 10 ? '0' : '') + episode.episode;

    const episodeId = `S${seasonNbr}E${episodeNbr}`;
    const episodeDate = episode.airdate;
    const episodeAired = Date.parse(episodeDate) <= (new Date()).getTime();

    let rowClass = 'episodeRow';
    let onClickAction = `window.location='/episode?collection_name=show&id=${showId}&episode_id=${episodeId}'`;
    if (!episodeAired) {
      rowClass = 'bg-secondary';
      onClickAction = '';
    }

    tableHTML += `
            <tr onclick="${onClickAction}" class=${rowClass}>
                <td class="small">${episodeId}</td>
                <td class="text-truncate small">${episode.name}</td>
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

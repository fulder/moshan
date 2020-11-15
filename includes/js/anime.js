/* global axios */
/* global AnimeApi, WatchHistoryApi */

const animeApi = new AnimeApi();
const watchHistoryApi = new WatchHistoryApi();

const urlParams = new URLSearchParams(window.location.search);
const id = urlParams.get('id');
const malId = urlParams.get('mal_id');
let episodePage = urlParams.get('episode_page');

if (episodePage === null) {
  episodePage = 1;
} else {
  episodePage = parseInt(episodePage);
}

let totalPages = 0;

let requests = [];
if (id !== null) {
  const animeRequest = animeApi.getAnimeById(id);
  const animeEpisodesRequest = animeApi.getAnimeEpisodes(id, episodePage);
  const watchHistoryRequest = watchHistoryApi.getWatchHistoryItem('anime', id);
  requests = [animeRequest, animeEpisodesRequest, watchHistoryRequest];
} else if (malId !== null) {
  const animeRequest = animeApi.getAnimeByApiId('mal', malId);
  requests = [animeRequest];
}

axios.all(requests).then(axios.spread((...responses) => {
  const animeItem = responses[0].data;
  let animeEpisodes = null;
  let watchHistoryItem = null;
  let animeId = null;

  if (responses.length > 1) {
    animeEpisodes = responses[1].data;
    watchHistoryItem = responses[2].data;

    animeId = animeItem.id;
  }

  createAnime(animeItem, watchHistoryItem);

  if (animeEpisodes !== null) {
    createEpisodesList(animeId, animeEpisodes);
  }
})).catch(errors => {
  console.log(errors);
});

function createAnime (animeItem, watchHistoryItem) {
  const itemAdded = watchHistoryItem !== null;

  let status = 'Airing';
  if ('end_date' in animeItem && animeItem.end_date !== null) {
    status = 'Finished';
  }

  const resultHTML = `
        <div class="col-md-3 col-5 item">
            <img class="img-fluid" src="${animeItem.main_picture.large}" />
        </div>

        <div class="col-md-9 col-7">
            <h5>${animeItem.title}</h5>
            <b>Released</b>: ${animeItem.start_date}<br>
            <b>Status</b>: ${status}
             <div class="card mt-2 col-7 col-md-3">
                <div class="card-header">Links</div>
                <div class="card-body p-1">
                    <div class="row">
                        <div class="col-6 col-md-5">
                            <a href="https://myanimelist.net/anime/${animeItem.mal_id}" target="_blank"><img class="img-fluid" src="/includes/icons/mal.png" /></a>
                        </div>
                        <div id="anidbLink" class="col-6 col-md-5 d-none">
                            <a href="https://anidb.net/anime/${animeItem.anidb_id}" target="_blank"><img class="img-fluid" src="/includes/icons/anidb.png" /></a>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="col-md-3 col-7 mt-1">
            <button id="addButton" class="btn btn-success ${itemAdded ? 'd-none' : ''}" onclick="addItemWrapper('anime', ${animeItem.mal_id})"><i class="fa fa-plus"></i> Add</button>
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

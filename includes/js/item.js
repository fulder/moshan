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
let calendarInstance;
let datesWatched;

getItemByApiId();

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

async function getItemByApiId() {
  let watchHistoryItem = null;
  try {
    watchHistoryItemRes = await watchHistoryApi.getWatchHistoryItemByApiId(qParams);
    console.debug(watchHistoryItemRes);
    watchHistoryItem = watchHistoryItemRes.data;
    qParams.id = watchHistoryItem.item_id;
  } catch(error) {
    if (!('response' in error && error.response.status == 404)) {
      console.log(error);
    }
  }

  const moshanItem = await api.getItemById(qParams);

  createItem(moshanItem, watchHistoryItem);

  if (watchHistoryItem !== null && moshanItem.has_episodes) {
    const episodesRes = await episodeApi.getEpisodes(qParams);
    const moshanEpisodes = episodeApi.getMoshanEpisodes(episodesRes.data);
    createEpisodesList(moshanEpisodes);
  }
}

function createItem (moshanItem, watchHistoryItem) {
  const itemAdded = watchHistoryItem !== null;
  console.debug(`Item added: ${itemAdded}`);
  console.debug(moshanItem);


  let watchedAmount = 0;
  let latestWatchDate = '';

  if (itemAdded && 'dates_watched' in watchHistoryItem && watchHistoryItem['dates_watched'].length > 0) {
    datesWatched = watchHistoryItem['dates_watched'];

    latestWatchDate = watchHistoryItem['latest_watch_date'];
    console.debug(`Latest watch date: ${latestWatchDate}`);
    watchedAmount = datesWatched.length;
  }

  document.getElementById('poster').src = moshanItem.poster;
  document.getElementById('title').innerHTML = moshanItem.title;
  document.getElementById('start-date').innerHTML = moshanItem.start_date;
  document.getElementById('status').innerHTML = moshanItem.status;
  document.getElementById('synopsis').innerHTML = moshanItem.synopsis;
  document.getElementById('watched_amount').innerHTML = watchedAmount;

  // TODO: store links in api and loop through them creating the links dynamically
  /*let links = '';
  links += `
    <div class="col-6 col-md-5">
        <a id="mal-link" href=${apiLink} target="_blank"><img class="img-fluid" src="/includes/icons/${apiName}.png" /></a>
    </div>
  `;
  document.getElementById('links').innerHTML = links;*/

  if (itemAdded) {
    document.getElementById('remove_button').classList.remove('d-none');
  } else {
    document.getElementById('add_button').classList.remove('d-none');
  }

  if (!moshanItem.has_episodes) {
    calendarInstance = flatpickr('#calendar', {
      enableTime: true,
      dateFormat: 'Y-m-d H:i',
      time_24hr: true,
      defaultDate: latestWatchDate,
      locale: {
        firstDayOfWeek: 1, // start week on Monday
      },
      weekNumbers: true,
      onClose: onCalendarClose,
    });

    document.getElementById('calendar_group').classList.remove('d-none');
  }

  document.getElementById('item').classList.remove('d-none');
}

/* exported addItem */
async function addItem () {
  try {
    const addItemRes = await watchHistoryApi.addWatchHistoryItem(qParams);
    console.debug(addItemRes);

    qParams.id = addItemRes.data.id;
    document.getElementById('add_button').classList.add('d-none');
    document.getElementById('remove_button').classList.remove('d-none');
  } catch (error) {
    console.log(error);
  }
}

/* exported removeItem */
async function removeItem () {
  try {
    await watchHistoryApi.removeWatchHistoryItem(qParams);
    document.getElementById('add_button').classList.remove('d-none');
    document.getElementById('remove_button').classList.add('d-none');
  } catch (error) {
    console.log(error);
  }
}

/* exported saveItem */
async function saveItem () {
  overview = document.getElementById('overview').value;
  review = document.getElementById('review').value;

  try {
    await watchHistoryApi.updateWatchHistoryItem(qParams, overview, review, datesWatched);
  } catch (error) {
    console.log(error);
  }
}

function createEpisodesList (moshanEpisodes) {
  let tableHTML = '';

  moshanEpisodes.episodes.forEach(function (episode) {
    moshanEpisode = episodeApi.getMoshanEpisode(episode);

    let rowClass = 'bg-secondary';
    let onClickAction = '';

    let episodeApiName = qParams.api_name;
    let episodeApiId = moshanEpisode.id;
    if (qParams.api_name === 'mal') {
      episodeApiName = 'anidb';
      episodeApiId = episode.anidb_id;
    }

    if (moshanEpisode.aired && qParams.api_name !== 'mal') {
      rowClass = 'episodeRow';
      onClickAction = `window.location='/episode?collection=${qParams.collection}&id=${qParams.id}&api_name=${episodeApiName}&api_id=${episodeApiId}'`;
    } else if (moshanEpisode.aired && qParams.api_name === 'mal') {
      rowClass = 'episodeRow';
      onClickAction = `window.location='/episode?collection=${qParams.collection}&id=${qParams.id}&api_name=${episodeApiName}&api_id=${episodeApiId}&episode_id=${moshanEpisode.id}'`;
    }

    tableHTML += `
            <tr onclick="${onClickAction}" class=${rowClass}>
                <td class="small">${moshanEpisode.number}</td>
                <td class="text-truncate small">${moshanEpisode.title}</td>
                <td class="small">${moshanEpisode.air_date}</td>
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

async function onCalendarClose (selectedDates, dateStr) {
  const date = new Date(dateStr).toISOString();

  await setWatchDate(date);
}

/* exported setCurrentWatchDate */
async function setCurrentWatchDate() {
  const dateNow = new Date();

  await setWatchDate(dateNow.toISOString());
  calendarInstance.setDate(dateNow);
}

async function setWatchDate(date) {
  if (datesWatched === undefined || datesWatched.length == 0) {
    datesWatched = [date];
  } else {
    datesWatched[datesWatched.length - 1] = date;
  }

  document.getElementById('watched_amount').innerHTML = datesWatched.length;
  console.debug(datesWatched);
}

/* exported removeWatchDate */
async function removeWatchDate() {
  if (datesWatched === undefined || datesWatched.length == 0) {
    return;
  }

  datesWatched.pop();
  document.getElementById('watched_amount').innerHTML = datesWatched.length;

  if (datesWatched.length == 0) {
      calendarInstance.clear();
  } else {
      calendarInstance.setDate(datesWatched[datesWatched.length - 1]);
  }
}

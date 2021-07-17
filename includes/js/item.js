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
let calendarInstances = [];
let datesWatched;
let savedPatchData;

getItemByApiId();

window.onbeforeunload = function(){
  console.debug(savedPatchData);

  currentPatchData = getPatchData();
  console.debug(currentPatchData);

  if (JSON.stringify(savedPatchData) !== JSON.stringify(currentPatchData)) {
    return 'Are you sure you want to leave?';
  }
};

function PatchItemData(overview, review, rating, status, watchDates = []) {
    this.watchDates = watchDates;
    this.overview = overview;
    this.review = review;
    this.rating = rating;
    this.status = status;
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

  if (itemAdded && 'dates_watched' in watchHistoryItem && watchHistoryItem['dates_watched'].length > 0) {
    datesWatched = watchHistoryItem['dates_watched'];
  }

  if (itemAdded && 'overview' in watchHistoryItem) {
      document.getElementById('overview').value = watchHistoryItem.overview;
  }
  if (itemAdded && 'review' in watchHistoryItem) {
      document.getElementById('review').value = watchHistoryItem.review;
  }
  if (itemAdded && 'status' in watchHistoryItem) {
      document.getElementById('user-status').value = watchHistoryItem.status;
  }
  if (itemAdded && 'rating' in watchHistoryItem) {
      document.getElementById('user-rating').value = watchHistoryItem.rating;
  }
  if (itemAdded && 'created_at' in watchHistoryItem) {
      document.getElementById('user_added_date').innerHTML = watchHistoryItem.created_at;
  }

  document.getElementById('poster').src = moshanItem.poster;
  document.getElementById('title').innerHTML = moshanItem.title;
  document.getElementById('start-date').innerHTML = moshanItem.start_date;
  document.getElementById('status').innerHTML = moshanItem.status;
  document.getElementById('synopsis').innerHTML = moshanItem.synopsis;
  document.getElementById('watched_amount').innerHTML = datesWatched.length;

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
    if (datesWatched.lenght === 0) {
      createOneCalendar(0);
    }

    for (let i=0; i<datesWatched.length; i++) {
      createOneCalendar(i, datesWatched[i]);
    }
  }

  document.getElementById('item').classList.remove('d-none');

  savedPatchData = getPatchData();
}

function createOneCalendar(calendarIndex, defaultDate=null) {
  const calendarId = `calendar_${calendarIndex}`;
  const html = `
  <div id="calendar_group_${calendarIndex}" class="input-group input-group-sm pt-1">
    <div class="input-group-prepend">
      <span class="input-group-text">Date</span>
    </div>
    <input id="${calendarId}" type="text" class="form-control">
    <div class="input-group-append">
      <button class="btn btn-primary" type="button" onclick="setWatchedDate(${calendarIndex})"><i class="fas fa-calendar-day"></i></button>
      <button class="btn btn-danger" type="button" onclick="removeWatchDate(${calendarIndex})"><i class="far fa-calendar-times"></i></button>
    </div>
  </div>`;

  document.getElementById('watched-dates').innerHTML += html;

  console.debug(`#${calendarId}`);
  const calInstance = flatpickr(`#${calendarId}`, {
    enableTime: true,
    dateFormat: 'Y-m-d H:i',
    time_24hr: true,
    defaultDate: defaultDate,
    locale: {
      firstDayOfWeek: 1, // start week on Monday
    },
    weekNumbers: true,
    onClose: onCalendarClose,
  });

  console.debug(calInstance);
  calendarInstances.push(calInstance);
  console.debug(calendarInstances);
}

function getPatchData() {
    let watchedDates = [];
    for (let i = 0; i < calendarInstances.length; i++) {
      const dates = calendarInstances[i].selectedDates;
      if (dates.length !== 0) {
        watchedDates.push(dates[0].toISOString());
      }
    }

    let rating = document.getElementById('user-rating').value;
    if (rating !== '') {
        rating = parseInt(rating);
    }

    return new PatchItemData(
      document.getElementById('overview').value,
      document.getElementById('review').value,
      rating,
      document.getElementById('user-status').value,
      watchedDates
    );
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
  currentPatchData = getPatchData();
  try {
    await watchHistoryApi.updateWatchHistoryItem(
      qParams,
      currentPatchData.overview,
      currentPatchData.review,
      currentPatchData.status,
      currentPatchData.rating,
      currentPatchData.watchDates
    );
  } catch (error) {
    console.log(error);
  }

  savedPatchData = currentPatchData;
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
async function setCurrentWatchDate(calendarIndex) {
  const dateNow = new Date();

  await setWatchDate(calendarIndex, dateNow.toISOString());
  calendarInstances[calendarIndex].setDate(dateNow);
}

async function setWatchDate(calendarIndex, date) {
  if (datesWatched === undefined || datesWatched.length == 0) {
    datesWatched = [date];
  } else {
    datesWatched[calendarIndex] = date;
  }

  document.getElementById('watched_amount').innerHTML = datesWatched.length;
  console.debug(datesWatched);
}

/* exported removeWatchDate */
async function removeWatchDate(calendarIndex) {
  if (datesWatched === undefined || datesWatched.length == 0) {
    return;
  }

  datesWatched.splice(calendarIndex, 1);
  document.getElementById('watched_amount').innerHTML = datesWatched.length;

  if (datesWatched.length == 0) {
      calendarInstances[calendarIndex].clear();
  } else {
      calendarInstances.splice(calendarIndex, 1);
      document.getElementById(`calendar_group_${calendarIndex}`).remove();
  }
}

/* exported addCalendar */
function addCalendar() {
  createOneCalendar(calendarInstances.length);
}

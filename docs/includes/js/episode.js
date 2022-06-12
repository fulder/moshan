import {createNavbar} from './common/navbar.js';
import {getApiByName} from './api/common.js';
import {MoshanApi} from './api/moshan.js';
import {isLoggedIn} from './common/auth.js';

createNavbar();

document.getElementById('addButton').addEventListener('click', addEpisode);
document.getElementById('removeButton').addEventListener('click', removeEpisode);
document.getElementById('setDateButton').addEventListener('click', setCurrentWatchDate);
document.getElementById('removeDateButton').addEventListener('click', removeWatchDate);

const urlParams = new URLSearchParams(window.location.search);
const qParams = new QueryParams(urlParams);

const moshanApi = new MoshanApi();
const api = getApiByName(qParams.api_name);

let datesWatched;
let calendarInstance;

if (isLoggedIn()) {
  getEpisode();
}

function QueryParams(urlParams) {
  this.collection = urlParams.get('collection');
  this.api_name = urlParams.get('api_name');
  this.id = urlParams.get('id');
  this.item_api_id = urlParams.get('item_api_id');
  this.api_id = urlParams.get('api_id');
  this.episode_id = urlParams.get('episode_id');
  this.episode_api_id = urlParams.get('episode_api_id');
  this.extra_ep = urlParams.get('extra_ep');
}

async function getEpisode() {
  let watchHistoryEpisode = null;
  try {
    const watchHistoryRes = await moshanApi.getEpisode(qParams);
    watchHistoryEpisode = watchHistoryRes.data;
    qParams.api_id = watchHistoryEpisode.apiId;
  } catch(error) {
    if (!('response' in error && error.response.status == 404)) {
      console.log(error);
    }
  }

  const moshanEpisode = await api.getEpisode(qParams);
  createEpisodePage(moshanEpisode, watchHistoryEpisode);
}

function createEpisodePage (moshanEpisode, watchHistoryEpisode) {
  console.debug(moshanEpisode);
  console.debug(watchHistoryEpisode);

  if (qParams.extra_ep === 'true') {
    moshanEpisode = {
      title: 'N/A',
      number: qParams.episode_api_id,
      air_date: 'N/A',
      status: 'Not Existing',
      previous_id: qParams.episode_api_id - 1,
    };
  }

  const episodeAdded = watchHistoryEpisode !== null;

  let watchedAmount = 0;
  let latestWatchDate = '';

  if (episodeAdded && 'datesWatched' in watchHistoryEpisode && watchHistoryEpisode.datesWatched.length > 0) {
    datesWatched = watchHistoryEpisode.datesWatched;

    latestWatchDate = watchHistoryEpisode.latestWatchDate;
    console.debug(`Latest watch date: ${latestWatchDate}`);
    watchedAmount = datesWatched.length;
  }

  document.getElementById('title').innerHTML = moshanEpisode.title;
  document.getElementById('number').innerHTML = moshanEpisode.number;
  document.getElementById('air_date').innerHTML = moshanEpisode.air_date;
  document.getElementById('status').innerHTML = moshanEpisode.status;
  document.getElementById('watched_amount').innerHTML = watchedAmount;

  if (moshanEpisode.previous_id !== null) {
    document.getElementById('previous_episode').href = `/episode/?api_name=${qParams.api_name}&item_api_id=${qParams.item_api_id}&episode_api_id=${moshanEpisode.previous_id}`;
    document.getElementById('previous_episode').classList.remove('d-none');
  }
  if (moshanEpisode.next_id !== null) {
    document.getElementById('next_episode').href = `/episode/?api_name=${qParams.api_name}&item_api_id=${qParams.item_api_id}&episode_api_id=${moshanEpisode.next_id}`;
    document.getElementById('next_episode').classList.remove('d-none');
  }

  if (episodeAdded) {
    document.getElementById('removeButton').classList.remove('d-none');
  } else {
    document.getElementById('addButton').classList.remove('d-none');
  }

  document.getElementById('episode').classList.remove('d-none');

  calendarInstance = flatpickr('#flatpickr', {
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

  // Bootstrap enable tooltips
  const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-toggle="tooltip"]'));
  tooltipTriggerList.map(function (tooltipTriggerEl) {
    return new bootstrap.Tooltip(tooltipTriggerEl);
  });
}

async function onCalendarClose (selectedDates, dateStr) {
  const date = new Date(dateStr).toISOString();

  await patchWatchDate(date);
}

async function setCurrentWatchDate() {
  const dateNow = new Date();

  await patchWatchDate(dateNow.toISOString());
  calendarInstance.setDate(dateNow);
}

async function patchWatchDate(date) {
  if (datesWatched === undefined || datesWatched.length == 0) {
    datesWatched = [date];
  } else {
    datesWatched[datesWatched.length - 1] = date;
  }

  document.getElementById('watched_amount').innerHTML = datesWatched.length;
  console.debug(datesWatched);

  await moshanApi.updateEpisode(qParams, datesWatched);
}

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

  await moshanApi.updateEpisode(qParams, datesWatched);
}

async function addEpisode (evt) {
  const addEpisodeRes = await moshanApi.addEpisode(qParams);
  qParams.episode_id = addEpisodeRes.data.id;
  document.getElementById('addButton').classList.add('d-none');
  document.getElementById('removeButton').classList.remove('d-none');

  evt.target.blur();
}

async function removeEpisode (evt) {
  await moshanApi.removeEpisode(qParams);
  document.getElementById('addButton').classList.remove('d-none');
  document.getElementById('removeButton').classList.add('d-none');

  evt.target.blur();
}

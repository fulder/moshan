/* global flatpickr, getMoshanApiByCollectionName, getApiByName */
/* global WatchHistoryApi */
const urlParams = new URLSearchParams(window.location.search);
const collection = urlParams.get('collection');
const apiName = urlParams.get('api_name');
const id = urlParams.get('id');
const apiId = urlParams.get('api_id');
const episodeId = urlParams.get('episode_id');

const watchHistoryApi = new WatchHistoryApi();
// quickfix until e.g. MAL epi implements episodes endpoints
const episodeApi = collection == 'anime' ? getMoshanApiByCollectionName(collection) : getApiByName(apiName);
const episodeItemId = collection == 'anime' ? id : apiId;


let datesWatched;
let calendarInstance;

getEpisodes();

async function getEpisodes() {
  let watchHistoryEpisode = null;
  try {
    const watchHistoryRes = await watchHistoryApi.getWatchHistoryEpisode(collection, id, episodeId);
    watchHistoryEpisode = watchHistoryRes.data;
  } catch(error) {
    if (error.response.status != 404) {
      console.log(error);
    }
  }

  const apiEpisodeRes = await episodeApi.getEpisode(episodeItemId, episodeId);
  const moshanEpisode = episodeApi.getMoshanEpisode(apiEpisodeRes.data);

  createEpisodePage(moshanEpisode, watchHistoryEpisode);
}

function createEpisodePage (moshanEpisode, watchHistoryEpisode) {
  console.debug(moshanEpisode);
  console.debug(watchHistoryEpisode);

  const episodeAdded = watchHistoryEpisode !== null;

  let watchedAmount = 0;
  let latestWatchDate = '';

  if (episodeAdded && 'dates_watched' in watchHistoryEpisode && watchHistoryEpisode['dates_watched'].length > 0) {
    datesWatched = watchHistoryEpisode['dates_watched'];

    latestWatchDate = datesWatched[datesWatched.length-1];
    console.debug(`Latest watch date: ${latestWatchDate}`);
    watchedAmount = datesWatched.length;
  }

  document.getElementById('title').innerHTML = moshanEpisode.title;
  document.getElementById('air_date').innerHTML = moshanEpisode.air_date;
  document.getElementById('status').innerHTML = moshanEpisode.status;
  document.getElementById('watched_amount').innerHTML = watchedAmount;

  if (moshanEpisode.previous_id !== null) {
    document.getElementById('previous_episode').href = `/episode/?collection=${collection}&id=${id}&episode_id=${moshanEpisode.previous_id}`;
    document.getElementById('previous_episode').classList.remove('d-none');
  }
  if (moshanEpisode.next_id !== null) {
    document.getElementById('next_episode').href = `/episode/?collection=${collection}&id=${id}&episode_id=${moshanEpisode.next_id}`;
    document.getElementById('next_episode').classList.remove('d-none');
  }

  if (episodeAdded && moshanEpisode.aired) {
    document.getElementById('remove_button').classList.remove('d-none');
  } else if(!moshanEpisode.aired) {
    document.getElementById('add_button_not_aired').classList.remove('d-none');
  } else {
    document.getElementById('add_button').classList.remove('d-none');
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

/* exported setCurrentWatchDate */
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

  await watchHistoryApi.updateWatchHistoryEpisode(collection, id, episodeId, datesWatched);
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

  await watchHistoryApi.updateWatchHistoryEpisode(collection, id, episodeId, datesWatched);
}

/* exported addEpisode */
async function addEpisode () {
  await watchHistoryApi.addWatchHistoryEpisode(collection, id, episodeId);
  document.getElementById('add_button').classList.add('d-none');
  document.getElementById('remove_button').classList.remove('d-none');
}

/* exported removeEpisode */
async function removeEpisode () {
  await watchHistoryApi.removeWatchHistoryEpisode(collection, id, episodeId);
  document.getElementById('add_button').classList.remove('d-none');
  document.getElementById('remove_button').classList.add('d-none');
}

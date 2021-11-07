/* global WatchHistoryApi, getApiByName */
const urlParams = new URLSearchParams(window.location.search);
const qParams = new QueryParams(urlParams);

document.getElementById('headTitle').innerHTML = `Moshan - ${qParams.collection}`;

const watchHistoryApi = new WatchHistoryApi();
const api = getApiByName(qParams.api_name);

let totalPages = 0;
let calendarInstances = {};
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

  moshanItem = await api.getItemById(qParams);

  createItem(moshanItem, watchHistoryItem);

  if (moshanItem.has_episodes) {
    const moshanEpisodes = await api.getEpisodes(qParams);

    if (qParams.api_name == 'mal' && moshanItem.status === 'Airing') {
      const lastEpId = moshanEpisodes.episodes[0].episode_id;
      moshanEpisodes.episodes.unshift(
        {
        episode_id: lastEpId + 1,
        title: 'N/A',
        aired: null,
        extra_ep: true,
        }
      );
    }

    createEpisodesList(moshanEpisodes);
  }
}

function createItem (moshanItem, watchHistoryItem) {
  const itemAdded = watchHistoryItem !== null;
  console.debug(`Item added: ${itemAdded}`);
  console.debug(moshanItem);

  let datesWatched = [];
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
    if (datesWatched.length === 0) {
      createOneCalendar();
    }

    for (let i=0; i<datesWatched.length; i++) {
      createOneCalendar(datesWatched[i]);
    }
  }

  document.getElementById('item').classList.remove('d-none');

  savedPatchData = getPatchData();
}

function createOneCalendar(calDate=null) {
  const i = Math.floor(Math.random() * Date.now()).toString();
  const calendarId = `calendar_${i}`;

  const calendarDiv = document.createElement('div');
  calendarDiv.id = `calendar_group_${i}`;
  calendarDiv.className = 'input-group input-group-sm pt-1';
  calendarDiv.dataset.calendarNumber = i;
  calendarDiv.innerHTML = `
    <div class="input-group-prepend">
      <span class="input-group-text">Date</span>
    </div>
    <input id="${calendarId}" type="text" class="form-control">
    <div class="input-group-append">
      <button class="btn btn-primary" type="button" onclick="setCurrentWatchDate(${i}, this)"><i class="fas fa-calendar-day"></i></button>
      <button class="btn btn-danger" type="button" onclick="removeWatchDate(${i}, this)"><i class="far fa-calendar-times"></i></button>
    </div>`;

  document.getElementById('watched-dates').appendChild(calendarDiv);

  calendarInstances[i] = flatpickr(`#${calendarId}`, {
    enableTime: true,
    dateFormat: 'Y-m-d H:i',
    time_24hr: true,
    defaultDate: calDate,
    locale: {
      firstDayOfWeek: 1, // start week on Monday
    },
    weekNumbers: true,
  });

  console.debug(calendarInstances);
}

function getPatchData() {
    let watchedDates = [];
    const calendarDivs = document.getElementById('watched-dates').getElementsByTagName('div');

    for( i=0; i< calendarDivs.length; i++ ) {
     const childDiv = calendarDivs[i];
     const calendarNbr = childDiv.dataset.calendarNumber;

     if (calendarNbr === undefined) {
       continue;
     }

     console.debug(calendarNbr);

     const dates = calendarInstances[calendarNbr].selectedDates;
     if (dates.length !== 0) {
       const isoDate = new Date(dates[0]).toISOString();
       watchedDates.push(isoDate);
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
async function addItem (button) {
  try {
    const addItemRes = await watchHistoryApi.addWatchHistoryItem(qParams);
    console.debug(addItemRes);

    qParams.id = addItemRes.data.id;
    document.getElementById('add_button').classList.add('d-none');
    document.getElementById('remove_button').classList.remove('d-none');
  } catch (error) {
    console.log(error);
  }

  button.blur();
}

/* exported removeItem */
async function removeItem (button) {
  try {
    await watchHistoryApi.removeWatchHistoryItem(qParams);
    document.getElementById('add_button').classList.remove('d-none');
    document.getElementById('remove_button').classList.add('d-none');
  } catch (error) {
    console.log(error);
  }

  button.blur();
}

/* exported saveItem */
async function saveItem (button) {
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
  button.blur();
}

function createEpisodesList (moshanEpisodes) {
  let tableHTML = '';

  moshanEpisodes.episodes.forEach(function (episode) {
    moshanEpisode = api.getMoshanEpisode(episode);

    let rowClass = 'bg-secondary';
    let onClickAction = '';

    let episodeApiId = moshanEpisode.id;

    rowClass = 'episodeRow';
    onClickAction = `window.location='/episode?collection=${qParams.collection}&api_name=${qParams.api_name}&item_api_id=${qParams.api_id}&episode_api_id=${episodeApiId}`;
    if (episode.extra_ep) {
      onClickAction += '&extra_ep=true\'';
    } else {
      onClickAction += '\'';
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
    let paginationHTML = '<li class="page-item"><a href="javascript:void(0)" class="page-link" onclick="loadPreviousEpisodes(this)">Previous</a></li>';

    totalPages = moshanEpisodes.total_pages;
    for (let i = 1; i <= totalPages; i++) {
      let className = 'page-item';
      if (i === qParams.episode_page) {
        className = 'page-item active';
      }
      paginationHTML += `<li id="episodePage${i}" class="${className}"><a href="javascript:void(0)" class="page-link" onclick="loadEpisodes(${i}, this)">${i}</a></li>`;
    }
    paginationHTML += '<li class="page-item"><a href="javascript:void(0)" class="page-link" onclick="loadNextEpisodes(this)">Next</a></li>';

    document.getElementById('episodesPages').innerHTML = paginationHTML;
  }
}

/* exported loadPreviousEpisodes */
function loadPreviousEpisodes (button) {
  if (qParams.episode_page > 1) {
    loadEpisodes(qParams.episode_page - 1, button);
  }
}

/* exported loadNextEpisodes */
function loadNextEpisodes (button) {
  if (qParams.episode_page < totalPages) {
    loadEpisodes(qParams.episode_page + 1, button);
  }
}

async function loadEpisodes (page, button) {
  if (qParams.episode_page === page) {
    return;
  }
  document.getElementById('episodesPages').getElementsByTagName('LI')[qParams.episode_page].classList.remove('active');

  qParams.episode_page = page;

  const moshanEpisodes = await api.getEpisodes(qParams);
  createEpisodesList(moshanEpisodes);

  document.getElementById('episodesPages').getElementsByTagName('LI')[qParams.episode_page].classList.add('active');

  urlParams.set('episode_page', qParams.episode_page);
  history.pushState({}, null, `?${urlParams.toString()}`);

  button.blur();
}

/* exported setCurrentWatchDate */
function setCurrentWatchDate(calendarIndex, button) {
  const previousDates = calendarInstances[calendarIndex].selectedDates;

  const dateNow = new Date();
  calendarInstances[calendarIndex].setDate(dateNow);

  if (previousDates.length === 0) {
      const currentAmount = parseInt(document.getElementById('watched_amount').innerHTML);
      document.getElementById('watched_amount').innerHTML = currentAmount + 1;
  }

  button.blur();
}

/* exported removeWatchDate */
function removeWatchDate(calendarIndex, button) {
  const previousDates = calendarInstances[calendarIndex].selectedDates;

  const calendarAmount = Object.keys(calendarInstances).length;
  if (calendarAmount < 1) {
    return;
  }

  if (previousDates.length !== 0) {
    document.getElementById('watched_amount').innerHTML -= 1;
  }

  if (calendarAmount == 1) {
      const firstKey = Object.keys(calendarInstances)[0];
      calendarInstances[firstKey].clear();
  } else {
      delete calendarInstances[calendarIndex];
      document.getElementById(`calendar_group_${calendarIndex}`).remove();
  }

  button.blur();
}

/* exported addCalendar */
function addCalendar(button) {
  createOneCalendar();
  button.blur();
}

import {getApiByName} from './api/common.js';
import {MoshanApi} from './api/moshan.js';
import {createNavbar} from './common/navbar.js';
import {isLoggedIn} from './common/auth.js';

createNavbar();

const urlParams = new URLSearchParams(window.location.search);
const qParams = new QueryParams(urlParams);

document.getElementById('saveButton').addEventListener('click', saveButtonClicked);
document.getElementById('addButton').addEventListener('click', addButtonClicked);
document.getElementById('removeButton').addEventListener('click', removeButtonClicked);
document.getElementById('newCalendarButton').addEventListener('click', addCalendar);

const moshanApi = new MoshanApi();
const api = getApiByName(qParams.api_name);

let watchHistoryEpisodeIDs = [];
let totalPages = 0;
let calendarInstances = {};
let savedPatchData;
let currentPatchData;
const episodeReview = qParams.episode_api_id !== null;

if (isLoggedIn()) {
  createReview();
}

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
  this.item_api_id = this.api_id;
  this.episode_page = urlParams.get('episode_page');
  this.episode_api_id = urlParams.get('episode_api_id');

  if (this.episode_page === null) {
    this.episode_page = 1;
  } else {
    this.episode_page = parseInt(this.episode_page);
  }
}

async function createReview() {
  if (episodeReview) {
    createEpisode();
  } else {
    createItem();
  }
}

async function createItem() {
  let item = null;
  try {
    item = await moshanApi.getItem(qParams);
  } catch(error) {
    if (!('response' in error && error.response.status == 404)) {
      console.log(error);
    }
  }

  if (item === null) {
    item = await api.getItemById(qParams);
  }

  createReviewPage(item);

  if (item.hasEpisodes) {
    document.getElementById('newCalendarButton').classList.add('d-none');
    const apiEpisodes = await api.getEpisodes(qParams);

    const moshanEpisodes = await moshanApi.getEpisodes(qParams);
    for (let i=0; i < moshanEpisodes.data.episodes.length; i++) {
      watchHistoryEpisodeIDs.push(parseInt(moshanEpisodes.data.episodes[i].episodeApiId));
    }

    if (qParams.api_name == 'mal' && (item.status === 'Currently Airing' || apiEpisodes.episodes.length == 0) ) {
      let lastEpId = 0;
      if (apiEpisodes.episodes.length != 0) {
        lastEpId = apiEpisodes.episodes[0].mal_id;
      }

      let extraEps = 12;
      if (watchHistoryEpisodeIDs.length != 0) {
        extraEps = watchHistoryEpisodeIDs[watchHistoryEpisodeIDs.length-1] + 1;
      }

      for (let i=0; i<extraEps; i++) {
        apiEpisodes.episodes.unshift(
          {
          mal_id: lastEpId + i + 1,
          title: 'N/A',
          aired: null,
          extra_ep: true,
          }
        );
      }
    }

    createEpisodesList(apiEpisodes);
  }
}

async function createEpisode() {
  let episode = {};
  episode.review = {};
  try {
    episode = await moshanApi.getEpisode(qParams);
  } catch(error) {
    if (!('response' in error && error.response.status == 404)) {
      console.log(error);
    }
  }

  // TODO: use cache for episodes?
  const apiEpisode = await api.getEpisode(qParams);
  episode.title = apiEpisode.title;
  episode.releaseDate = apiEpisode.releaseDate;
  episode.imageUrl = apiEpisode.imageUrl;
  episode.status = apiEpisode.status;
  episode.previousId = apiEpisode.previousId;
  episode.nextId = apiEpisode.nextId;
  episode.number = apiEpisode.number;

  createReviewPage(episode);
}

function createReviewPage (reviewItem) {
  const review = reviewItem.review;

  const itemAdded = reviewItem.apiName === 'moshan';
  console.debug(`Item added: ${itemAdded}`);
  console.debug(reviewItem);

  if (reviewItem.status !== undefined) {
    document.getElementById('status').innerHTML = `<b>Status</b>: <span id="status">${reviewItem.status}</span>`;
  }

  let datesWatched = [];
  if (review.datesWatched !== undefined && review.datesWatched.length > 0) {
    datesWatched = review.datesWatched;
  }

  if (review.overview !== undefined) {
      document.getElementById('overview').value = review.overview;
  }
  if (review.review !== undefined) {
      document.getElementById('review').value = review.review;
  }
  if (review.status !== undefined) {
      document.getElementById('user-status').value = review.status;
  }
  if (review.rating) {
      document.getElementById('user-rating').value = review.rating;
  }
  if (review.createdAt) {
      document.getElementById('user_added_date').innerHTML = review.createdAt;
  }

  if (reviewItem.title === '') {
    reviewItem.title = 'N/A';
  }

  document.getElementById('poster').src = reviewItem.imageUrl;
  document.getElementById('title').innerHTML = reviewItem.title;
  document.getElementById('start-date').innerHTML = reviewItem.releaseDate;

  if (episodeReview) {
    document.getElementById('number').classList.remove('d-none');
    document.getElementById('number-val').innerHTML = reviewItem.number;
  }

  let apiUrl;
  if (qParams.api_name === 'tmdb') {
    apiUrl = `https://www.themoviedb.org/movie/${qParams.api_id}`;
  } else if (qParams.api_name === 'tvmaze') {
    if (episodeReview) {
        apiUrl = `https://www.tvmaze.com/episodes/${qParams.episode_api_id}`;
    } else {
        apiUrl = `https://www.tvmaze.com/shows/${qParams.api_id}`;
    }
  } else if (qParams.api_name === 'mal') {
    if (episodeReview) {
        // TODO: get episode ID from item?
    } else {
        apiUrl = `https://myanimelist.net/anime/${qParams.api_id}`;
    }
  }

  if (apiUrl !== undefined) {
    document.getElementById('link').innerHTML = `<a href=${apiUrl} target="_blank"><img class="api-link" src="/includes/icons/${qParams.api_name}.png" /></a>`;
  }
  document.getElementById('synopsis').innerHTML = item.synopsis;
  document.getElementById('watched_amount').innerHTML = datesWatched.length;

  if (itemAdded) {
    document.getElementById('removeButton').classList.remove('d-none');
  } else {
    document.getElementById('addButton').classList.remove('d-none');
  }

  if (episodeReview && reviewItem.previousId !== null) {
    document.getElementById('previousButton').href = `/review?api_name=${qParams.api_name}&api_id=${qParams.api_id}&episode_api_id=${reviewItem.previousId}`;
    document.getElementById('previousButton').classList.remove('d-none');
  }
  if (episodeReview && reviewItem.nextId !== null) {
    document.getElementById('nextButton').href = `/review?api_name=${qParams.api_name}&api_id=${qParams.api_id}&episode_api_id=${reviewItem.nextId}`;
    document.getElementById('nextButton').classList.remove('d-none');
  }

  if (!reviewItem.hasEpisodes) {
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
      <button id="setDateButton${calendarId}" class="btn btn-primary" type="button"><i class="fas fa-calendar-day"></i></button>
      <button id="removeDateButton${calendarId}"  class="btn btn-danger" type="button"><i class="far fa-calendar-times"></i></button>
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

  document.getElementById(`setDateButton${calendarId}`).addEventListener('click', function(){setCurrentWatchDate(this, i);});
  document.getElementById(`removeDateButton${calendarId}`).addEventListener('click', function(){removeWatchDate(this, i);});
}

function getPatchData() {
    let watchedDates = [];
    const calendarDivs = document.getElementById('watched-dates').getElementsByTagName('div');

    for(let i=0; i< calendarDivs.length; i++ ) {
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

async function addButtonClicked (evt) {
  let addFunc = moshanApi.addItem.bind(moshanApi);
  if (episodeReview) {
    addFunc = moshanApi.addEpisode.bind(moshanApi);
  }

  try {
    const addItemRes = await addFunc(qParams);
    console.debug(addItemRes);

    qParams.id = addItemRes.data.id;
    document.getElementById('addButton').classList.add('d-none');
    document.getElementById('removeButton').classList.remove('d-none');
  } catch (error) {
    console.log(error);
  }

  evt.target.blur();
}

async function removeButtonClicked (evt) {
  let removeFunc = moshanApi.removeItem.bind(moshanApi);
  if (episodeReview) {
    removeFunc = moshanApi.removeEpisode.bind(moshanApi);
  }

  try {
    await removeFunc(qParams);
    document.getElementById('addButton').classList.remove('d-none');
    document.getElementById('removeButton').classList.add('d-none');
  } catch (error) {
    console.log(error);
  }

  evt.target.blur();
}

async function saveButtonClicked (evt) {
  currentPatchData = getPatchData();

  let updateFunc = moshanApi.updateItem.bind(moshanApi);
  if (episodeReview) {
    updateFunc = moshanApi.updateEpisode.bind(moshanApi);
  }

  console.debug(updateFunc);

  try {
    await updateFunc(
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
  evt.target.blur();
}

function createEpisodesList (apiEpisodes) {
  document.getElementById('episodesTable').classList.remove('d-none');

  apiEpisodes.episodes.forEach(function (episode) {
    const moshanEpisode = api.getMoshanEpisode(episode);

    let rowClass = 'bg-secondary';
    let onClickAction = '';

    let episodeApiId = moshanEpisode.id;

    rowClass = 'episodeRow';
    onClickAction = `review.html?api_name=${qParams.api_name}&api_id=${qParams.api_id}&episode_api_id=${episodeApiId}`;
    if (episode.extra_ep) {
      onClickAction += '&extra_ep=true';
    }

    if (watchHistoryEpisodeIDs.includes(moshanEpisode.id)) {
      rowClass += ' table-success';
    }

    /*
    <tr class="${rowClass}">
        <td class="small">${moshanEpisode.number}</td>
        <td class="text-truncate small">${moshanEpisode.title}</td>
        <td class="small">${moshanEpisode.air_date}</td>
    </tr>
    */
    const tableRow = document.createElement('tr');
    tableRow.className = rowClass;
    tableRow.addEventListener('click', function(){ window.open(onClickAction, '_self'); });

    const epNumberRow = document.createElement('td');
    epNumberRow.className = 'small';
    epNumberRow.innerHTML = moshanEpisode.number;
    tableRow.appendChild(epNumberRow);
    const epTitleRow = document.createElement('td');
    epTitleRow.className = 'text-truncate small';
    epTitleRow.innerHTML = moshanEpisode.title;
    tableRow.appendChild(epTitleRow);
    const epAirDate = document.createElement('td');
    epAirDate.className = 'small';
    epAirDate.innerHTML = moshanEpisode.releaseDate;
    tableRow.appendChild(epAirDate);
    document.getElementById('episodeTableBody').appendChild(tableRow);
  });

  if (document.getElementById('episodesPages').innerHTML === '') {

    /*
    <li class="page-item"><a href="javascript:void(0)" class="page-link" onclick="loadPreviousEpisodes(this)">Previous</a></li>
    ...
    <li id="episodePage10" class="${className}"><a href="javascript:void(0)" class="page-link" onclick="loadEpisodes(10, this)">${i}</a></li>
    <li id="episodePage11" class="${className}"><a href="javascript:void(0)" class="page-link" onclick="loadEpisodes(11, this)">${i}</a></li>
    ...
    <li class="page-item"><a href="javascript:void(0)" class="page-link" onclick="loadNextEpisodes(this)">Next</a></li>
    */
    const previousLi = document.createElement('li');
    previousLi.className='page-item';
    const previousA = document.createElement('a');
    previousA.className = 'page-link';
    previousA.href = 'javascript:void(0)';
    previousA.innerHTML = 'Previous';
    previousA.addEventListener('click', loadPreviousEpisodes);
    previousLi.appendChild(previousA);
    document.getElementById('episodesPages').appendChild(previousLi);

    totalPages = apiEpisodes.total_pages;
    for (let i = 1; i <= totalPages; i++) {
      const li = document.createElement('li');

      li.className = 'page-item';
      if (i === qParams.episode_page) {
        li.className = 'page-item active';
      }

      const a = document.createElement('a');
      a.className = 'page-link';
      a.href = 'javascript:void(0)';
      a.innerHTML = i;
      a.addEventListener('click', function(){loadEpisodes(i, a);});
      li.appendChild(a);
      document.getElementById('episodesPages').appendChild(li);
    }

    const nextLi = document.createElement('li');
    nextLi.className='page-item';
    const nextA = document.createElement('a');
    nextA.className = 'page-link';
    nextA.href = 'javascript:void(0)';
    nextA.innerHTML = 'Next';
    nextA.addEventListener('click', loadNextEpisodes);
    nextLi.appendChild(nextA);
    document.getElementById('episodesPages').appendChild(nextLi);
  }
}

function loadPreviousEpisodes (evt) {
  if (qParams.episode_page > 1) {
    loadEpisodes(qParams.episode_page - 1, evt.target);
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

  const apiEpisodes = await api.getEpisodes(qParams);
  createEpisodesList(apiEpisodes);

  document.getElementById('episodesPages').getElementsByTagName('LI')[qParams.episode_page].classList.add('active');

  urlParams.set('episode_page', qParams.episode_page);
  history.pushState({}, null, `?${urlParams.toString()}`);

  button.blur();
}

function setCurrentWatchDate(button, calendarIndex) {
  const previousDates = calendarInstances[calendarIndex].selectedDates;

  const dateNow = new Date();
  calendarInstances[calendarIndex].setDate(dateNow);

  if (previousDates.length === 0) {
      const currentAmount = parseInt(document.getElementById('watched_amount').innerHTML);
      document.getElementById('watched_amount').innerHTML = currentAmount + 1;
  }

  button.blur();
}

function removeWatchDate(button, calendarIndex) {
    console.log(calendarIndex);
    console.log(calendarInstances[calendarIndex]);
    console.log(calendarInstances);
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

function addCalendar(evt) {
  createOneCalendar();
  evt.target.blur();
}

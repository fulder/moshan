import {getApiByName} from './api/common.js';
import {MoshanApi} from './api/moshan.js';
import {createNavbar} from './common/navbar.js';
import {isLoggedIn} from './common/auth.js';

createNavbar();

const urlParams = new URLSearchParams(window.location.search);
const qParams = new QueryParams(urlParams);

document.getElementById('headTitle').innerHTML = 'Moshan - Item';
document.getElementById('saveItem').addEventListener('click', saveItem);
document.getElementById('addButton').addEventListener('click', addItem);
document.getElementById('removeButton').addEventListener('click', removeItem);
document.getElementById('newCalendarButton').addEventListener('click', addCalendar);

const moshanApi = new MoshanApi();
const api = getApiByName(qParams.api_name);

let watchHistoryEpisodeIDs = [];
let totalPages = 0;
let calendarInstances = {};
let savedPatchData;
let currentPatchData;

if (isLoggedIn()) {
  getItemByApiId();
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

  if (this.episode_page === null) {
    this.episode_page = 1;
  } else {
    this.episode_page = parseInt(this.episode_page);
  }
}

async function getItemByApiId() {
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

  createItem(item);

  if (item.hasEpisodes) {
    const apiEpisodes = await api.getEpisodes(qParams);

    const moshanEpisodes = await moshanApi.getEpisodes(qParams);
    for (let i=0; i < moshanEpisodes.data.episodes.length; i++) {
      watchHistoryEpisodeIDs.push(parseInt(moshanEpisodes.data.episodes[i].episodeApiId));
    }

    if (qParams.api_name == 'mal' && item.status === 'Airing') {
      let lastEpId = 0;
      if (apiEpisodes.episodes.length != 0) {
        lastEpId = apiEpisodes.episodes[0].episode_id;
      }
      for (let i=0; i<12; i++) {
        apiEpisodes.episodes.unshift(
          {
          episode_id: lastEpId + i + 1,
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

function createItem (item) {
  const itemAdded = item.apiName === 'moshan';
  console.debug(`Item added: ${itemAdded}`);
  console.debug(item);


  let datesWatched = [];
  if (item.review.datesWatched !== undefined && item.review.datesWatched.length > 0) {
    datesWatched = item.review.datesWatched;
  }

  if (item.review.overview !== undefined) {
      document.getElementById('overview').value = item.review.overview;
  }
  if (item.review.review !== undefined) {
      document.getElementById('review').value = item.review.review;
  }
  if (item.review.status !== undefined) {
      document.getElementById('user-status').value = item.review.status;
  }
  if (item.review.rating) {
      document.getElementById('user-rating').value = item.review.rating;
  }
  if (item.review.createdAt) {
      document.getElementById('user_added_date').innerHTML = item.review.createdAt;
  }

  document.getElementById('poster').src = item.imageUrl;
  document.getElementById('title').innerHTML = item.title;
  document.getElementById('start-date').innerHTML = item.releaseDate;
  document.getElementById('status').innerHTML = item.status;
  //document.getElementById('synopsis').innerHTML = item.synopsis;
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
    document.getElementById('removeButton').classList.remove('d-none');
  } else {
    document.getElementById('addButton').classList.remove('d-none');
  }

  if (!item.hasEpisodes) {
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

async function addItem (evt) {
  try {
    const addItemRes = await moshanApi.addItem(qParams);
    console.debug(addItemRes);

    qParams.id = addItemRes.data.id;
    document.getElementById('addButton').classList.add('d-none');
    document.getElementById('removeButton').classList.remove('d-none');
  } catch (error) {
    console.log(error);
  }

  evt.target.blur();
}

async function removeItem (evt) {
  try {
    await moshanApi.removeItem(qParams);
    document.getElementById('addButton').classList.remove('d-none');
    document.getElementById('removeButton').classList.add('d-none');
  } catch (error) {
    console.log(error);
  }

  evt.target.blur();
}

async function saveItem (evt) {
  currentPatchData = getPatchData();
  try {
    await moshanApi.updateItem(
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
    onClickAction = `/episode?api_name=${qParams.api_name}&item_api_id=${qParams.api_id}&episode_api_id=${episodeApiId}`;
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
    epAirDate.innerHTML = moshanEpisode.air_date;
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

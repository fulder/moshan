/* global axios, flatpickr */
/* global AnimeApi, WatchHistoryApi */

const animeApi = new AnimeApi();
const watchHistoryApi = new WatchHistoryApi();

const urlParams = new URLSearchParams(window.location.search);

const collectionName = urlParams.get('collection_name');
const id = urlParams.get('id');
const episodeId = urlParams.get('episode_id');

const watchHistoryRequest = watchHistoryApi.getWatchHistoryEpisode(collectionName, id, episodeId);
const requests = [watchHistoryRequest];

if (collectionName === 'anime') {
  const animeRequest = animeApi.getAnimeEpisode(id, episodeId);
  requests.push(animeRequest);
}

axios.all(requests).then(axios.spread((...responses) => {
  const watchHistoryEpisode = responses[0].data;
  const animeEpisode = responses[1].data;

  createEpisodePage(animeEpisode, watchHistoryEpisode);
})).catch(error => {
  console.log(error);
});

function createEpisodePage (animeEpisode, watchHistoryEpisode) {
  console.debug(animeEpisode);
  console.debug(watchHistoryEpisode);

  const episodeAdded = watchHistoryEpisode !== '';
  const episodeAired = Date.parse(animeEpisode.air_date) <= (new Date()).getTime();
  const status = episodeAired ? 'Aired' : 'Not Aired';
  const dateWatched = watchHistoryEpisode['date_watched'];
  const latestWatchDate = dateWatched !== undefined && dateWatched.length > 0 ? dateWatched[dateWatched.length-1] : '';

  const resultHTML = `
        <div class="col-md-3 col-5 item">
            <img class="img-fluid" src="/includes/img/image_not_available.png" />
        </div>

        <div class="col-md-9 col-7">
            <h5>${animeEpisode.title}</h5>
            <b>Aired</b>: ${animeEpisode.air_date}<br>
            <b>Status</b>: ${status}
        </div>

        <div class="col-md-3 col-9 mt-1">
            <button id="addButton" class="btn btn-success ${!episodeAired || episodeAdded ? 'd-none' : ''}" onclick="addEpisodeWrapper('anime', '${animeEpisode.id}')"><i class="fa fa-plus"></i> Add</button>
            <button id="removeButton" class="btn btn-danger ${!episodeAired || !episodeAdded ? 'd-none' : ''}" onclick="removeEpisodeWrapper('anime', '${animeEpisode.id}')"><i class="fa fa-minus"></i> Remove</button>
            <button class="btn btn-secondary ${!episodeAired ? '" disabled' : 'd-none"'}><i class="fa fa-plus"></i> Add</button>
            <div class="input-group input-group-sm pt-1">
              <div class="input-group-prepend">
                <span class="input-group-text" id="inputGroup-sizing-sm" value="${latestWatchDate}">Watched</span>
              </div>
              <input id="flatpickr" type="text" class="form-control" aria-label="Small" aria-describedby="inputGroup-sizing-sm">
            </div>
        </div>
    `;

  document.getElementById('episode').innerHTML = resultHTML;

  flatpickr('#flatpickr', {
    enableTime: true,
    dateFormat: 'Y-m-d H:i',
    time_24hr: true,
    locale: {
      firstDayOfWeek: 1 // start week on Monday
    },
    weekNumbers: true,
    onClose: function (selectedDates, dateStr) {
      const updateDates = dateWatched !== undefined ? dateWatched : [];
      updateDates[updateDates.length-1] = dateStr;

      watchHistoryApi.updateWatchHistoryEpisode(collectionName, id, episodeId, updateDates).then(function (response) {
        console.debug(response);
      }).catch(function (error) {
        console.log(error);
      });
    }
  });
}

/* exported addEpisodeWrapper */
function addEpisodeWrapper (type, episodeId) {
  watchHistoryApi.addWatchHistoryEpisode(type, id, episodeId).then(function () {
    document.getElementById('addButton').classList.add('d-none');
    document.getElementById('removeButton').classList.remove('d-none');
  }).catch(function (error) {
    console.log(error);
  });
}

/* exported removeEpisodeWrapper */
function removeEpisodeWrapper (type, episodeId) {
  watchHistoryApi.removeWatchHistoryEpisode(type, id, episodeId).then(function () {
    document.getElementById('addButton').classList.remove('d-none');
    document.getElementById('removeButton').classList.add('d-none');
  }).catch(function (error) {
    console.log(error);
  });
}

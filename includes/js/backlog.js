/* global WatchHistoryApi, accessToken, getApiByName */
//const urlParams = new URLSearchParams(window.location.search);

const watchHistoryApi = new WatchHistoryApi();

const apiNamesMapping = {
  'movie': 'tmdb',
  'show': 'tvmaze',
  'anime': 'mal',
};

if (accessToken === null) {
  document.getElementById('logInAlert').className = 'alert alert-danger';
} else {
  document.getElementById('logInAlert').className = 'd-none';
}

createTableRows();

async function createTableRows() {
    const response = await watchHistoryApi.getWatchHistory('backlog');
    const items = response.data.items;

    const apiReq = [];
    for (let i=0; i < items.length; i++) {
      const apiName = apiNamesMapping[items[i].collection_name];
      const api = getApiByName(apiName);
      apiReq.push(api.getItemById({ 'api_id': items[i][`${apiName}_id`] }));
    }

    const responses = await Promise.all(watchHistoryRequests);

    for (let i=0; i< responses.length; i++) {
      console.log(responses[i].data);
    }

}

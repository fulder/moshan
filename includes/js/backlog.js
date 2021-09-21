/* global WatchHistoryApi, accessToken */
//const urlParams = new URLSearchParams(window.location.search);

const watchHistoryApi = new WatchHistoryApi();

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
      api = getApiByName(items[i].api_name);
      apiReq.push(api.getItemByApiId({ 'api_id': items[i].api_id }));
    }

    const responses = await Promise.all(watchHistoryRequests);

    for (let i=0; i< responses.length; i++) {
      console.log(responses[i]);
    }

}

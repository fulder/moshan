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

    for (let i=0; i < items.length; i++) {
      console.debug(items[i]);
    }

}

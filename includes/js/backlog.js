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

    const apiRequests = [];
    const externalIDMap = {};
    for (let i=0; i < items.length; i++) {
      const apiName = apiNamesMapping[items[i].collection_name];
      const apiId = items[i][`${apiName}_id`];
      const api = getApiByName(apiName);

      apiRequests.push(api.getItemById({ 'api_id': apiId }));

      externalIDMap[`${items[i].collection_name}_${apiId}`] = items[i];
    }
    console.debug(externalIDMap);

    const responses = await Promise.all(apiRequests);

    responses.sort(function(x, y) {
      const xWatchHistoryItem = externalIDMap[`${x.collection_name}_${x.id}`];
      const yWatchHistoryItem = externalIDMap[`${y.collection_name}_${y.id}`];

      const xDate = new Date(xWatchHistoryItem.created_at);
      const yDate = new Date(yWatchHistoryItem.created_at);

      if (xDate < yDate) {
        return -1;
      }
      if (xDate > yDate) {
        return 1;
      }
      return 0;
    });

    html = '';
    for (let i=0; i< responses.length; i++) {
      html += createRow(responses[i], externalIDMap);
    }
    document.getElementById('backlog-table-body').innerHTML = html;
}


function createRow(moshanItem, externalIDMap) {
  console.debug(`${moshanItem.collection_name}_${moshanItem.id}`);
  watchHistoryItem = externalIDMap[`${moshanItem.collection_name}_${moshanItem.id}`];

  let rowClass = 'bg-secondary';
  if (moshanItem.status === 'Released' || moshanItem.status === 'Airing' || moshanItem.status === 'Ended') {
      rowClass = 'episodeRow';
  }

  const apiName = apiNamesMapping[moshanItem.collection_name];
  const onClickAction = `window.location='item/index.html?collection=${moshanItem.collection_name}&api_name=${apiName}&api_id=${moshanItem.id}'`;
  return `
  <tr onclick="${onClickAction}" class=${rowClass}>
      <td>${watchHistoryItem.created_at}</td>
      <td>${moshanItem.collection_name}</td>
      <td>${moshanItem.title}</td>
      <td>${moshanItem.status}</td>
      <td>${moshanItem.start_date}</td>
    </tr>
    `;

}

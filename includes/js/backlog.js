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

    html = '';
    for (let i=0; i< responses.length; i++) {
      html += createRow(responses[i], externalIDMap);
    }
    document.getElementById('backlog-table-body').innerHTML = html;
}


function createRow(moshanItem, externalIDMap) {
  console.debug(`${moshanItem.collection_name}_${moshanItem.id}`);
  watchHistoryItem = externalIDMap[`${moshanItem.collection_name}_${moshanItem.id}`];
  return `
  <tr>
      <td>${watchHistoryItem.created_at}</td>
      <td>${moshanItem.title}</td>
      <td>${moshanItem.start_date}</td>
    </tr>
    `;

}

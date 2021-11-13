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
    const response = await watchHistoryApi.getWatchHistory('backlog_date');
    const items = response.data.items;

    const apiRequests = [];
    for (let i=0; i < items.length; i++) {
      const apiName = items[i]['api_name'];
      const apiId = items[i]['api_id'];
      const api = getApiByName(apiName);

      apiRequests.push(api.getItemById({ 'api_id': apiId }));
    }

    const responses = await Promise.all(apiRequests);
    const moshanItems = {};
    for (let i=0; i< responses.length; i++) {
      moshanItems[`${responses[i].api_name}_${responses[i].id}`] = responses[i];
    }

    html = '';
    for (let i=0; i< items.length; i++) {
      html += createRow(items[i], moshanItems);
    }
    document.getElementById('backlog-table-body').innerHTML = html;
}


function createRow(watchHistoryItem, moshanItems) {
  moshanItem = moshanItems[`${watchHistoryItem.api_name}_${watchHistoryItem.api_id}`];

  let rowClass = 'bg-secondary';
  if (moshanItem.status === 'Released' || moshanItem.status === 'Airing' || moshanItem.status === 'Ended' || moshanItem.status === 'Running') {
      rowClass = 'episodeRow';
  }
  if (new Date(moshanItem.start_date) >= new Date()) {
      rowClass = 'bg-secondary';
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
